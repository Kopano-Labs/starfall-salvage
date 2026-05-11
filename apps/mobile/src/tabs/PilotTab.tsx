/**
 * PilotTab.tsx — PILOT tab (profile + stats)
 *
 * Reads from kopano_vault pilot_profiles + scores stores.
 * Creates a pilot profile on first visit if none exists.
 */

import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonPage,
  IonButton,
  IonNote,
} from '@ionic/react';
import { KopanoVault } from '@starfall/vault';
import { PendingSyncBadge } from '@starfall/ui';

interface Pilot {
  id            : string;
  callsign      : string;
  bestScore     : number;
  totalCores    : number;
  sessionsPlayed: number;
  lastSync      : string | null;
}

interface Score {
  id       : string;
  score    : number;
  cores    : number;
  timeAlive: number;
  savedAt  : string;
  synced   : boolean;
}

export default function PilotTab() {
  const [vault,        setVault]        = useState<KopanoVault | null>(null);
  const [pilot,        setPilot]        = useState<Pilot | null>(null);
  const [scores,       setScores]       = useState<Score[]>([]);
  const [callsignDraft, setCallsignDraft] = useState('');

  useEffect(() => {
    KopanoVault.open().then(async (v) => {
      setVault(v);
      const stored = localStorage.getItem('sf_pilot_id');
      if (stored) {
        const p = await v.pilots.get(stored);
        if (p) {
          setPilot(p as Pilot);
          const s = await v.scores.forPilot(p.id);
          setScores((s as Score[]).slice(-5).reverse());
        }
      }
    });
  }, []);

  async function createPilot() {
    if (!vault || !callsignDraft.trim()) return;
    const id = await vault.pilots.upsert({ callsign: callsignDraft.trim() });
    localStorage.setItem('sf_pilot_id', id);
    const p = await vault.pilots.get(id);
    setPilot(p as Pilot);
  }

  if (!pilot) {
    return (
      <IonPage>
        <IonContent style={{ '--background': '#0D1117' }}>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ color: '#E2E8F0', marginBottom: '0.5rem' }}>Choose your callsign</h2>
            <p style={{ color: '#8891A4', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Your callsign identifies you in the fleet and leaderboard.
            </p>
            <IonItem style={{ '--background': '#1E2433', '--border-radius': '8px', marginBottom: '1rem' }}>
              <IonInput
                placeholder="e.g. Robyn"
                value={callsignDraft}
                onIonInput={(e) => setCallsignDraft(e.detail.value ?? '')}
                style={{ '--color': '#E2E8F0' }}
              />
            </IonItem>
            <IonButton
              expand="block"
              color="primary"
              onClick={createPilot}
              disabled={!callsignDraft.trim()}
            >
              Join the Fleet
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent style={{ '--background': '#0D1117' }}>
        {/* Pilot card */}
        <div style={{
          margin         : '1.5rem',
          padding        : '1.25rem',
          background     : '#1E2433',
          borderRadius   : '12px',
          borderLeft     : '3px solid #F5A623',
        }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#F5A623', marginBottom: '0.25rem' }}>
            {pilot.callsign}
          </div>
          <div style={{ color: '#8891A4', fontSize: '0.8rem' }}>
            {pilot.lastSync ? `Last sync: ${new Date(pilot.lastSync).toLocaleString()}` : 'Never synced'}
          </div>
        </div>

        {/* Stats */}
        <IonList style={{ '--background': '#0D1117' }}>
          <IonListHeader style={{ '--background': '#0D1117', color: '#8891A4' }}>Stats</IonListHeader>
          <IonItem style={{ '--background': '#0D1117' }}>
            <IonLabel>Best Score</IonLabel>
            <IonNote slot="end" style={{ color: '#F5A623', fontWeight: 600 }}>{pilot.bestScore.toLocaleString()}</IonNote>
          </IonItem>
          <IonItem style={{ '--background': '#0D1117' }}>
            <IonLabel>Total Cores</IonLabel>
            <IonNote slot="end" style={{ color: '#E2E8F0' }}>{pilot.totalCores.toLocaleString()}</IonNote>
          </IonItem>
          <IonItem style={{ '--background': '#0D1117' }}>
            <IonLabel>Sessions</IonLabel>
            <IonNote slot="end" style={{ color: '#E2E8F0' }}>{pilot.sessionsPlayed}</IonNote>
          </IonItem>
        </IonList>

        {/* Recent scores */}
        {scores.length > 0 && (
          <IonList style={{ '--background': '#0D1117' }}>
            <IonListHeader style={{ '--background': '#0D1117', color: '#8891A4' }}>Recent Runs</IonListHeader>
            {scores.map((s) => (
              <IonItem key={s.id} style={{ '--background': '#0D1117' }}>
                <IonLabel>
                  <div style={{ color: '#E2E8F0', fontWeight: 600 }}>{s.score.toLocaleString()}</div>
                  <div style={{ color: '#8891A4', fontSize: '0.75rem' }}>
                    {s.cores} cores · {Math.round(s.timeAlive)}s · {new Date(s.savedAt).toLocaleDateString()}
                  </div>
                </IonLabel>
                <PendingSyncBadge synced={s.synced} />
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
}
