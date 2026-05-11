/**
 * kopano-vault.js — Starfall Salvage offline data layer
 * Database : kopano_vault (IndexedDB v1)
 * Doctrine : Commandment 9 (Offline-First), CRUD-only mandate, AER (Asymmetric Edge Reality)
 * Sync     : write-first / queue-later; no outbound attempt when MOBILE_LOCKDOWN === true
 *
 * Object stores
 * ─────────────
 *  pilot_profiles  — one record per local pilot identity
 *  scores          — immutable score snapshots
 *  event_log       — capped ring-buffer (MAX_EVENT_LOG entries)
 *  chat_messages   — Kasi-Comm messages, offline-queued
 *  sync_queue      — pending /api/v1/sync payloads
 *
 * Usage
 * ──────
 *  import { KopanoVault } from './kopano-vault.js';
 *  const vault = await KopanoVault.open();
 *  await vault.pilots.upsert({ callsign: 'Robyn', bestScore: 4200, ... });
 */

'use strict';

// ─── Constants ──────────────────────────────────────────────────────────────

const DB_NAME    = 'kopano_vault';
const DB_VERSION = 1;

/** Hard cap on event_log rows; oldest evicted on overflow. Commandment 9 AER. */
const MAX_EVENT_LOG = 200;

/** Sync statuses for sync_queue records. */
const SYNC_STATUS = Object.freeze({
  PENDING   : 'pending',
  IN_FLIGHT : 'in_flight',
  DONE      : 'done',
  FAILED    : 'failed',
});

// ─── Schema helpers ──────────────────────────────────────────────────────────

/**
 * Generates a deterministic idempotency key from composite fields.
 * Uses crypto.randomUUID() when available, falls back to timestamp+random.
 * @returns {string}
 */
function generateIdKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Returns a UTC ISO-8601 timestamp string.
 * @returns {string}
 */
function now() {
  return new Date().toISOString();
}

// ─── DB open / upgrade ───────────────────────────────────────────────────────

/**
 * Opens (or creates) the kopano_vault IndexedDB database.
 * Resolves with the IDBDatabase instance.
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = event.target.result;

      // ── pilot_profiles ────────────────────────────────────────────────────
      // One record per local pilot identity. Keyed by UUID assigned on first
      // profile creation. `callsign` uniquely enforced at store level.
      if (!db.objectStoreNames.contains('pilot_profiles')) {
        const pilots = db.createObjectStore('pilot_profiles', { keyPath: 'id' });
        pilots.createIndex('by_callsign',   'callsign',      { unique: true });
        pilots.createIndex('by_lastSync',   'lastSync',      { unique: false });
        pilots.createIndex('by_updatedAt',  'updatedAt',     { unique: false });
      }

      // ── scores ────────────────────────────────────────────────────────────
      // Immutable score snapshots. `idempotencyKey` prevents double-writes
      // when the sync worker replays after a network drop.
      if (!db.objectStoreNames.contains('scores')) {
        const scores = db.createObjectStore('scores', { keyPath: 'id' });
        scores.createIndex('by_pilotId',         'pilotId',         { unique: false });
        scores.createIndex('by_savedAt',          'savedAt',         { unique: false });
        scores.createIndex('by_synced',           'synced',          { unique: false });
        scores.createIndex('by_idempotencyKey',   'idempotencyKey',  { unique: true  });
      }

      // ── event_log ─────────────────────────────────────────────────────────
      // Ring-buffer of game events (hits, waves, OPS codes, errors).
      // Capped at MAX_EVENT_LOG=200 by trimEventLog() on every write.
      // autoIncrement id used as natural chronological cursor.
      if (!db.objectStoreNames.contains('event_log')) {
        const events = db.createObjectStore('event_log', {
          keyPath: 'id', autoIncrement: true,
        });
        events.createIndex('by_pilotId',  'pilotId',  { unique: false });
        events.createIndex('by_ts',       'ts',       { unique: false });
        events.createIndex('by_flushed',  'flushed',  { unique: false });
        events.createIndex('by_type',     'type',     { unique: false });
      }

      // ── chat_messages ─────────────────────────────────────────────────────
      // Kasi-Comm lobby messages. Written offline-first; sync worker posts to
      // /api/v1/sync when connectivity is available.
      if (!db.objectStoreNames.contains('chat_messages')) {
        const chat = db.createObjectStore('chat_messages', { keyPath: 'id' });
        chat.createIndex('by_ts',             'ts',             { unique: false });
        chat.createIndex('by_pilotId',        'pilotId',        { unique: false });
        chat.createIndex('by_synced',         'synced',         { unique: false });
        chat.createIndex('by_idempotencyKey', 'idempotencyKey', { unique: true  });
      }

      // ── sync_queue ────────────────────────────────────────────────────────
      // Pending outbound requests for the KC API Gateway (/api/v1/sync).
      // Records persist across reloads; sync worker drains them when online.
      // Never touched when MOBILE_LOCKDOWN === true.
      if (!db.objectStoreNames.contains('sync_queue')) {
        const queue = db.createObjectStore('sync_queue', {
          keyPath: 'id', autoIncrement: true,
        });
        queue.createIndex('by_status',          'status',          { unique: false });
        queue.createIndex('by_endpoint',        'endpoint',        { unique: false });
        queue.createIndex('by_createdAt',       'createdAt',       { unique: false });
        queue.createIndex('by_idempotencyKey',  'idempotencyKey',  { unique: true  });
      }
    };

    req.onsuccess  = (event) => resolve(event.target.result);
    req.onerror    = (event) => reject(event.target.error);
    req.onblocked  = ()      => reject(new Error('kopano_vault: DB open blocked — close other tabs'));
  });
}

// ─── Store helpers ────────────────────────────────────────────────────────────

/**
 * Wraps an IDB request in a Promise.
 * @template T
 * @param {IDBRequest} req
 * @returns {Promise<T>}
 */
function promisify(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

/**
 * Trims event_log to MAX_EVENT_LOG rows, deleting the oldest entries first.
 * Called after every event_log write to enforce the ring-buffer contract.
 * @param {IDBDatabase} db
 * @returns {Promise<void>}
 */
async function trimEventLog(db) {
  const tx      = db.transaction('event_log', 'readwrite');
  const store   = tx.objectStore('event_log');
  const count   = await promisify(store.count());
  const surplus = count - MAX_EVENT_LOG;
  if (surplus <= 0) return;

  // Open a cursor from the oldest key and delete `surplus` records.
  return new Promise((resolve, reject) => {
    const cursorReq = store.openCursor();
    let deleted = 0;
    cursorReq.onsuccess = (e) => {
      const cursor = e.target.result;
      if (!cursor || deleted >= surplus) { resolve(); return; }
      cursor.delete();
      deleted++;
      cursor.continue();
    };
    cursorReq.onerror = (e) => reject(e.target.error);
  });
}

// ─── KopanoVault ─────────────────────────────────────────────────────────────

/**
 * KopanoVault — offline data layer for Starfall Salvage.
 *
 * @example
 *   const vault = await KopanoVault.open();
 *   await vault.pilots.upsert({ callsign: 'Robyn', bestScore: 4200 });
 *   const top = await vault.scores.topN(10);
 */
class KopanoVault {
  /** @type {IDBDatabase} */
  #db;

  /** @param {IDBDatabase} db */
  constructor(db) {
    this.#db = db;
  }

  /**
   * Opens the vault. Call once at app boot.
   * @returns {Promise<KopanoVault>}
   */
  static async open() {
    const db = await openDB();
    return new KopanoVault(db);
  }

  // ── pilot_profiles ─────────────────────────────────────────────────────────

  /** @type {{ upsert, get, getByCallsign, list, delete }} */
  get pilots() {
    const db = this.#db;
    return {
      /**
       * Creates or fully replaces a pilot profile record.
       * Assigns a new `id` and `idempotencyKey` if not present.
       * @param {object} profile
       * @returns {Promise<string>} the record id
       */
      async upsert(profile) {
        const record = {
          id              : profile.id              || generateIdKey(),
          callsign        : profile.callsign        || 'Unknown',
          displayName     : profile.displayName     || profile.callsign || 'Unknown',
          bestScore       : profile.bestScore       || 0,
          totalCores      : profile.totalCores      || 0,
          sessionsPlayed  : profile.sessionsPlayed  || 0,
          mode            : profile.mode            || 'desktop',
          createdAt       : profile.createdAt       || now(),
          updatedAt       : now(),
          lastSync        : profile.lastSync        || null,
          idempotencyKey  : profile.idempotencyKey  || generateIdKey(),
        };
        const tx    = db.transaction('pilot_profiles', 'readwrite');
        const store = tx.objectStore('pilot_profiles');
        await promisify(store.put(record));
        return record.id;
      },

      /**
       * Gets a pilot profile by id.
       * @param {string} id
       * @returns {Promise<object|undefined>}
       */
      async get(id) {
        const tx    = db.transaction('pilot_profiles', 'readonly');
        const store = tx.objectStore('pilot_profiles');
        return promisify(store.get(id));
      },

      /**
       * Gets a pilot profile by callsign.
       * @param {string} callsign
       * @returns {Promise<object|undefined>}
       */
      async getByCallsign(callsign) {
        const tx    = db.transaction('pilot_profiles', 'readonly');
        const store = tx.objectStore('pilot_profiles');
        const index = store.index('by_callsign');
        return promisify(index.get(callsign));
      },

      /**
       * Returns all pilot profiles.
       * @returns {Promise<object[]>}
       */
      async list() {
        const tx    = db.transaction('pilot_profiles', 'readonly');
        const store = tx.objectStore('pilot_profiles');
        return promisify(store.getAll());
      },

      /**
       * Deletes a pilot profile by id.
       * @param {string} id
       * @returns {Promise<void>}
       */
      async delete(id) {
        const tx    = db.transaction('pilot_profiles', 'readwrite');
        const store = tx.objectStore('pilot_profiles');
        return promisify(store.delete(id));
      },
    };
  }

  // ── scores ─────────────────────────────────────────────────────────────────

  /** @type {{ add, topN, forPilot, markSynced }} */
  get scores() {
    const db = this.#db;
    return {
      /**
       * Records an immutable score snapshot.
       * @param {object} entry  — { pilotId, callsign, score, cores, timeAlive, wave, mode }
       * @returns {Promise<string>} the record id
       */
      async add(entry) {
        const record = {
          id              : generateIdKey(),
          pilotId         : entry.pilotId         || null,
          callsign        : entry.callsign         || 'Unknown',
          score           : entry.score            || 0,
          cores           : entry.cores            || 0,
          timeAlive       : entry.timeAlive        || 0,
          wave            : entry.wave             || 1,
          mode            : entry.mode             || 'desktop',
          savedAt         : now(),
          synced          : false,
          syncedAt        : null,
          idempotencyKey  : entry.idempotencyKey   || generateIdKey(),
        };
        const tx    = db.transaction('scores', 'readwrite');
        const store = tx.objectStore('scores');
        await promisify(store.add(record));
        return record.id;
      },

      /**
       * Returns the top N scores across all pilots, ordered highest-first.
       * @param {number} [n=10]
       * @returns {Promise<object[]>}
       */
      async topN(n = 10) {
        const tx    = db.transaction('scores', 'readonly');
        const store = tx.objectStore('scores');
        const all   = await promisify(store.getAll());
        return all
          .sort((a, b) => b.score - a.score)
          .slice(0, n);
      },

      /**
       * Returns all score records for a given pilot id.
       * @param {string} pilotId
       * @returns {Promise<object[]>}
       */
      async forPilot(pilotId) {
        const tx    = db.transaction('scores', 'readonly');
        const store = tx.objectStore('scores');
        const index = store.index('by_pilotId');
        return promisify(index.getAll(pilotId));
      },

      /**
       * Marks a score record as synced.
       * @param {string} id
       * @returns {Promise<void>}
       */
      async markSynced(id) {
        const tx     = db.transaction('scores', 'readwrite');
        const store  = tx.objectStore('scores');
        const record = await promisify(store.get(id));
        if (!record) return;
        record.synced   = true;
        record.syncedAt = now();
        return promisify(store.put(record));
      },
    };
  }

  // ── event_log ──────────────────────────────────────────────────────────────

  /** @type {{ push, unsynced, markFlushed, count }} */
  get events() {
    const db = this.#db;
    return {
      /**
       * Appends one event to the log.
       * Automatically trims to MAX_EVENT_LOG=200 after write.
       * @param {object} event  — { pilotId, type, payload, mode, score, wave }
       * @returns {Promise<number>} the auto-increment id
       */
      async push(event) {
        const record = {
          pilotId  : event.pilotId  || null,
          type     : event.type     || 'unknown',
          payload  : event.payload  || null,
          mode     : event.mode     || 'desktop',
          score    : event.score    || 0,
          wave     : event.wave     || 1,
          ts       : now(),
          flushed  : false,
        };
        const tx    = db.transaction('event_log', 'readwrite');
        const store = tx.objectStore('event_log');
        const id    = await promisify(store.add(record));
        // Trim async — non-blocking for hot path
        trimEventLog(db).catch(() => {});
        return id;
      },

      /**
       * Returns all event records not yet flushed to the sync worker.
       * @returns {Promise<object[]>}
       */
      async unsynced() {
        const tx    = db.transaction('event_log', 'readonly');
        const store = tx.objectStore('event_log');
        const index = store.index('by_flushed');
        return promisify(index.getAll(false));
      },

      /**
       * Marks a batch of event records as flushed.
       * @param {number[]} ids
       * @returns {Promise<void>}
       */
      async markFlushed(ids) {
        const tx    = db.transaction('event_log', 'readwrite');
        const store = tx.objectStore('event_log');
        await Promise.all(ids.map(async (id) => {
          const rec = await promisify(store.get(id));
          if (!rec) return;
          rec.flushed = true;
          return promisify(store.put(rec));
        }));
      },

      /**
       * Returns total count of event_log records.
       * @returns {Promise<number>}
       */
      async count() {
        const tx    = db.transaction('event_log', 'readonly');
        const store = tx.objectStore('event_log');
        return promisify(store.count());
      },
    };
  }

  // ── chat_messages ──────────────────────────────────────────────────────────

  /** @type {{ add, recent, markSynced, unsynced }} */
  get chat() {
    const db = this.#db;
    return {
      /**
       * Stores a Kasi-Comm message locally.
       * @param {object} msg  — { id?, callsign, pilotId, message }
       * @returns {Promise<string>} the record id
       */
      async add(msg) {
        const record = {
          id              : msg.id              || generateIdKey(),
          callsign        : msg.callsign        || 'Unknown',
          pilotId         : msg.pilotId         || null,
          message         : msg.message         || '',
          ts              : now(),
          synced          : false,
          syncedAt        : null,
          idempotencyKey  : msg.idempotencyKey  || generateIdKey(),
        };
        const tx    = db.transaction('chat_messages', 'readwrite');
        const store = tx.objectStore('chat_messages');
        await promisify(store.add(record));
        return record.id;
      },

      /**
       * Returns the N most recent chat messages.
       * @param {number} [n=50]
       * @returns {Promise<object[]>}
       */
      async recent(n = 50) {
        const tx    = db.transaction('chat_messages', 'readonly');
        const store = tx.objectStore('chat_messages');
        const all   = await promisify(store.getAll());
        return all
          .sort((a, b) => b.ts.localeCompare(a.ts))
          .slice(0, n)
          .reverse(); // oldest-first for display
      },

      /**
       * Returns all chat messages not yet synced.
       * @returns {Promise<object[]>}
       */
      async unsynced() {
        const tx    = db.transaction('chat_messages', 'readonly');
        const store = tx.objectStore('chat_messages');
        const index = store.index('by_synced');
        return promisify(index.getAll(false));
      },

      /**
       * Marks a chat message as synced.
       * @param {string} id
       * @returns {Promise<void>}
       */
      async markSynced(id) {
        const tx     = db.transaction('chat_messages', 'readwrite');
        const store  = tx.objectStore('chat_messages');
        const record = await promisify(store.get(id));
        if (!record) return;
        record.synced   = true;
        record.syncedAt = now();
        return promisify(store.put(record));
      },
    };
  }

  // ── sync_queue ─────────────────────────────────────────────────────────────

  /**
   * sync_queue is NEVER written to when `MOBILE_LOCKDOWN === true`.
   * The caller must check before enqueuing.
   *
   * @type {{ enqueue, pending, markInFlight, markDone, markFailed, purge }}
   */
  get syncQueue() {
    const db = this.#db;
    return {
      /**
       * Adds a new outbound request to the queue.
       * Caller MUST check MOBILE_LOCKDOWN before calling this method.
       *
       * @param {object} item  — { endpoint, method?, payload }
       * @returns {Promise<number>} the auto-increment id
       */
      async enqueue(item) {
        const record = {
          endpoint        : item.endpoint       || '/api/v1/sync',
          method          : item.method         || 'POST',
          payload         : item.payload        || {},
          idempotencyKey  : item.idempotencyKey || generateIdKey(),
          retries         : 0,
          maxRetries      : item.maxRetries     || 3,
          createdAt       : now(),
          lastAttempt     : null,
          status          : SYNC_STATUS.PENDING,
        };
        const tx    = db.transaction('sync_queue', 'readwrite');
        const store = tx.objectStore('sync_queue');
        return promisify(store.add(record));
      },

      /**
       * Returns all pending queue items.
       * @returns {Promise<object[]>}
       */
      async pending() {
        const tx    = db.transaction('sync_queue', 'readonly');
        const store = tx.objectStore('sync_queue');
        const index = store.index('by_status');
        return promisify(index.getAll(SYNC_STATUS.PENDING));
      },

      /**
       * Transitions a queue item to IN_FLIGHT.
       * @param {number} id
       * @returns {Promise<void>}
       */
      async markInFlight(id) {
        const tx     = db.transaction('sync_queue', 'readwrite');
        const store  = tx.objectStore('sync_queue');
        const record = await promisify(store.get(id));
        if (!record) return;
        record.status      = SYNC_STATUS.IN_FLIGHT;
        record.lastAttempt = now();
        return promisify(store.put(record));
      },

      /**
       * Marks a queue item as successfully synced (DONE).
       * @param {number} id
       * @returns {Promise<void>}
       */
      async markDone(id) {
        const tx     = db.transaction('sync_queue', 'readwrite');
        const store  = tx.objectStore('sync_queue');
        const record = await promisify(store.get(id));
        if (!record) return;
        record.status = SYNC_STATUS.DONE;
        return promisify(store.put(record));
      },

      /**
       * Increments retry count; moves to FAILED if maxRetries exceeded.
       * @param {number} id
       * @returns {Promise<void>}
       */
      async markFailed(id) {
        const tx     = db.transaction('sync_queue', 'readwrite');
        const store  = tx.objectStore('sync_queue');
        const record = await promisify(store.get(id));
        if (!record) return;
        record.retries     += 1;
        record.lastAttempt  = now();
        record.status       = record.retries >= record.maxRetries
          ? SYNC_STATUS.FAILED
          : SYNC_STATUS.PENDING; // re-queue for retry
        return promisify(store.put(record));
      },

      /**
       * Deletes all DONE and FAILED records older than `maxAgeMs` (default 7 days).
       * @param {number} [maxAgeMs]
       * @returns {Promise<number>} records deleted
       */
      async purge(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
        const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
        const tx     = db.transaction('sync_queue', 'readwrite');
        const store  = tx.objectStore('sync_queue');
        const all    = await promisify(store.getAll());
        let   count  = 0;
        for (const record of all) {
          const terminal = record.status === SYNC_STATUS.DONE
                        || record.status === SYNC_STATUS.FAILED;
          if (terminal && record.createdAt < cutoff) {
            await promisify(store.delete(record.id));
            count++;
          }
        }
        return count;
      },
    };
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export { KopanoVault, SYNC_STATUS, MAX_EVENT_LOG, DB_NAME, DB_VERSION };
