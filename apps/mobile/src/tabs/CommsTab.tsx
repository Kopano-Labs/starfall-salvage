/**
 * CommsTab.tsx — COMMS tab (Kasi-Comm lobby)
 *
 * Offline-first chat. Writes to kopano_vault chat_messages store first.
 * Syncs to /api/v1/sync when online and !MOBILE_LOCKDOWN.
 *
 * Pillar 2 (Community): messages never lost during load-shedding.
 * Commandment 9 (Offline-First): write-first / sync-later pattern.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  IonContent,
  IonFooter,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonText,
  IonToolbar,
  IonButton,
} from '@ionic/react';
import { KopanoVault } from '@starfall/vault';
import { PendingSyncBadge } from '@starfall/ui';

interface ChatMessage {
  id       : string;
  callsign : string;
  message  : string;
  ts       : string;
  synced   : boolean;
}

export default function CommsTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft,    setDraft]    = useState('');
  const [vault,    setVault]    = useState<KopanoVault | null>(null);
  const listRef = useRef<HTMLIonListElement>(null);

  useEffect(() => {
    KopanoVault.open().then((v) => {
      setVault(v);
      v.chat.recent(50).then(setMessages);
    });
  }, []);

  async function sendMessage() {
    if (!vault || !draft.trim()) return;
    const callsign = localStorage.getItem('sf_callsign') || 'Pilot';
    await vault.chat.add({ callsign, message: draft.trim() });
    setDraft('');
    vault.chat.recent(50).then(setMessages);
  }

  return (
    <IonPage>
      <IonContent ref={listRef}>
        {!navigator.onLine && (
          <IonText color="warning" style={{ display: 'block', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
            Offline — messages queued locally
          </IonText>
        )}

        <IonList lines="none">
          {messages.map((msg) => (
            <IonItem key={msg.id} style={{ '--padding-start': '1rem' }}>
              <div style={{ padding: '0.4rem 0', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#F5A623', fontSize: '0.85rem' }}>{msg.callsign}</strong>
                  <PendingSyncBadge synced={msg.synced} />
                </div>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', color: '#E2E8F0' }}>
                  {msg.message}
                </p>
                <small style={{ color: '#8891A4', fontSize: '0.7rem' }}>
                  {new Date(msg.ts).toLocaleTimeString()}
                </small>
              </div>
            </IonItem>
          ))}
        </IonList>
      </IonContent>

      <IonFooter>
        <IonToolbar style={{ '--background': '#0D1117', '--border-color': '#1E2433' }}>
          <IonItem lines="none" style={{ '--background': '#0D1117' }}>
            <IonInput
              value={draft}
              placeholder="Message the fleet…"
              onIonInput={(e) => setDraft(e.detail.value ?? '')}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              style={{ '--color': '#E2E8F0' }}
            />
            <IonButton
              slot="end"
              fill="solid"
              color="primary"
              onClick={sendMessage}
              disabled={!draft.trim()}
            >
              Send
            </IonButton>
          </IonItem>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
}
