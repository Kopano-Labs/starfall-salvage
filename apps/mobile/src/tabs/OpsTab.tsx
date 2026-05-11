/**
 * OpsTab.tsx — OPS tab (flight ops monitor)
 *
 * Live event log from kopano_vault event_log store.
 * Diagnostics export + Kopano ecosystem links.
 * Mirrors the desktop #opsConsole dialog.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
} from '@ionic/react';
import { openOutline, downloadOutline } from 'ionicons/icons';
import { KopanoVault } from '@starfall/vault';

interface EventRecord {
  id     : number;
  type   : string;
  ts     : string;
  score  : number;
  wave   : number;
  flushed: boolean;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  danger_zone_entered : '#F5A623',
  boss_destroyed      : '#00E676',
  debris_destroyed    : '#E2E8F0',
  game_over           : '#FF4444',
  player_hit          : '#FF8C00',
};

export default function OpsTab() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [vault,  setVault]  = useState<KopanoVault | null>(null);

  useEffect(() => {
    KopanoVault.open().then(async (v) => {
      setVault(v);
      const unsynced = await v.events.unsynced();
      setEvents((unsynced as EventRecord[]).slice(-50).reverse());
    });

    // Refresh every 5 seconds while tab is visible
    const timer = setInterval(async () => {
      if (!vault) return;
      const unsynced = await vault.events.unsynced();
      setEvents((unsynced as EventRecord[]).slice(-50).reverse());
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  function exportDiagnostics() {
    const data = JSON.stringify(events, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `starfall-diag-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <IonPage>
      <IonContent style={{ '--background': '#0D1117' }}>
        {/* Diagnostics export */}
        <div style={{ padding: '1rem 1.5rem 0' }}>
          <IonButton fill="outline" color="primary" onClick={exportDiagnostics}>
            <IonIcon slot="start" icon={downloadOutline} />
            Export Diagnostics
          </IonButton>
        </div>

        {/* Event log */}
        <IonList style={{ '--background': '#0D1117' }}>
          <IonListHeader style={{ '--background': '#0D1117', color: '#8891A4' }}>
            Event Log ({events.length} recent)
          </IonListHeader>
          {events.length === 0 && (
            <IonItem style={{ '--background': '#0D1117' }}>
              <IonLabel style={{ color: '#8891A4' }}>No events yet — play a run</IonLabel>
            </IonItem>
          )}
          {events.map((ev) => (
            <IonItem key={ev.id} style={{ '--background': '#0D1117' }}>
              <div style={{ padding: '0.3rem 0', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize       : '0.75rem',
                    fontWeight     : 600,
                    color          : EVENT_TYPE_COLORS[ev.type] ?? '#E2E8F0',
                    backgroundColor: `${EVENT_TYPE_COLORS[ev.type] ?? '#E2E8F0'}1A`,
                    padding        : '0.1rem 0.4rem',
                    borderRadius   : '4px',
                  }}>
                    {ev.type}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#8891A4' }}>
                    {new Date(ev.ts).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#8891A4', marginTop: '0.2rem' }}>
                  score: {ev.score.toLocaleString()} · wave: {ev.wave}
                  {ev.flushed ? '' : ' · pending'}
                </div>
              </div>
            </IonItem>
          ))}
        </IonList>

        {/* Ecosystem links */}
        <IonList style={{ '--background': '#0D1117' }}>
          <IonListHeader style={{ '--background': '#0D1117', color: '#8891A4' }}>Ecosystem</IonListHeader>
          {[
            { label: "Five's Arena",      href: 'https://fivesarena.com' },
            { label: 'Kopano-Labs GitHub', href: 'https://github.com/Kopano-Labs/starfall-salvage' },
            { label: 'Starfall (Desktop)', href: 'https://starfallsalvage.kopanolabs.com' },
          ].map(({ label, href }) => (
            <IonItem
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ '--background': '#0D1117' }}
              detail
            >
              <IonLabel style={{ color: '#F5A623' }}>{label}</IonLabel>
              <IonIcon slot="end" icon={openOutline} style={{ color: '#8891A4' }} />
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
}
