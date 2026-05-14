#!/usr/bin/env node
/**
 * P1 gate: verify live Digital Asset Links before Play promotion.
 * Usage: node verify-assetlinks.mjs
 *        ORIGIN=https://starfallsalvage.kopanolabs.com node verify-assetlinks.mjs
 */

const ORIGIN = (process.env.ORIGIN || 'https://starfallsalvage.kopanolabs.com').replace(/\/$/, '');
const PACKAGE = process.env.ANDROID_PACKAGE || 'com.kopanolabs.starfall.salvage';
const ASSETLINKS_URL = `${ORIGIN}/.well-known/assetlinks.json`;
const DAL_URL =
  'https://digitalassetlinks.googleapis.com/v1/statements:list' +
  `?source.web.site=${encodeURIComponent(ORIGIN)}` +
  '&relation=delegate_permission/common.handle_all_urls';

const PLACEHOLDER_PATTERNS = [
  /REPLACE_WITH/i,
  /YOUR_PLAY_APP_SIGNING/i,
  /PASTE_/i,
  /CHANGE_ME/i,
];

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

async function main() {
  console.log(`Starfall P1 assetlinks verification`);
  console.log(`Origin: ${ORIGIN}`);
  console.log(`Package: ${PACKAGE}`);
  console.log(`URL: ${ASSETLINKS_URL}\n`);

  const head = await fetch(ASSETLINKS_URL, { method: 'HEAD', redirect: 'follow' });
  if (!head.ok) fail(`HTTP ${head.status} on HEAD ${ASSETLINKS_URL}`);

  const contentType = head.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    console.warn(`WARN: Content-Type is "${contentType}" (expected application/json)`);
  } else {
    ok(`Content-Type includes application/json`);
  }

  const res = await fetch(ASSETLINKS_URL, { redirect: 'follow' });
  if (!res.ok) fail(`HTTP ${res.status} on GET ${ASSETLINKS_URL}`);

  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    fail('Response is not valid JSON');
  }

  if (!Array.isArray(data) || data.length === 0) fail('assetlinks.json must be a non-empty JSON array');

  const stmt = data.find(
    (s) =>
      Array.isArray(s.relation) &&
      s.relation.includes('delegate_permission/common.handle_all_urls') &&
      s.target?.namespace === 'android_app' &&
      s.target?.package_name === PACKAGE
  );
  if (!stmt) fail(`No DAL statement for package ${PACKAGE}`);

  const fps = stmt.target.sha256_cert_fingerprints;
  if (!Array.isArray(fps) || fps.length === 0) fail('sha256_cert_fingerprints is missing or empty');

  for (const fp of fps) {
    if (typeof fp !== 'string' || fp.length < 20) fail(`Invalid fingerprint: ${fp}`);
    if (PLACEHOLDER_PATTERNS.some((re) => re.test(fp))) {
      fail(`Placeholder fingerprint still present: ${fp}`);
    }
    if (!/^[A-Fa-f0-9]{2}(:[A-Fa-f0-9]{2})+$/.test(fp)) {
      fail(`Fingerprint must be colon-separated SHA-256 hex: ${fp}`);
    }
  }

  ok(`${fps.length} production fingerprint(s) present for ${PACKAGE}`);

  try {
    const dal = await fetch(DAL_URL);
    if (dal.ok) {
      const body = await dal.json();
      const count = body.statements?.length ?? 0;
      if (count > 0) ok(`Google DAL API returned ${count} statement(s)`);
      else console.warn('WARN: Google DAL API returned zero statements (propagation delay?)');
    } else {
      console.warn(`WARN: DAL API HTTP ${dal.status} (check manually)`);
    }
  } catch (e) {
    console.warn(`WARN: DAL API request failed: ${e.message}`);
  }

  console.log('\nP1 assetlinks gate passed. Run device fullscreen TWA test before Play promotion.');
}

main().catch((e) => fail(e.message));
