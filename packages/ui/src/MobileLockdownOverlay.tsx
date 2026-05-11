/**
 * MobileLockdownOverlay.tsx — Protocol 13 full-screen overlay
 *
 * Shown instead of the game / tabs when MOBILE_LOCKDOWN === true.
 * The dismiss button closes the overlay visually but does NOT disable the
 * lockdown flag — Protocol 13 requires explicit teacher gate clearance.
 *
 * Palette: Karoo Night background, Savanna Gold accent, Chalk Dust text.
 */

import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { lockClosedOutline, desktopOutline } from 'ionicons/icons';

// Kopano Labs palette tokens
const KAROO_NIGHT     = '#0D1117';
const SAVANNA_GOLD    = '#F5A623';
const CHALK_DUST      = '#E2E8F0';
const TERMINAL_MINT   = '#00E676';

const styles: Record<string, React.CSSProperties> = {
  page: {
    '--background': KAROO_NIGHT,
  } as React.CSSProperties,
  content: {
    display        : 'flex',
    flexDirection  : 'column',
    alignItems     : 'center',
    justifyContent : 'center',
    height         : '100%',
    padding        : '2rem',
    backgroundColor: KAROO_NIGHT,
    textAlign      : 'center',
  },
  icon: {
    fontSize : '3.5rem',
    color    : SAVANNA_GOLD,
    marginBottom: '1.5rem',
  },
  title: {
    fontSize     : '1.5rem',
    fontWeight   : 700,
    color        : CHALK_DUST,
    marginBottom : '0.75rem',
    letterSpacing: '0.03em',
  },
  subtitle: {
    fontSize    : '0.95rem',
    color       : `${CHALK_DUST}99`,
    marginBottom: '2rem',
    maxWidth    : '320px',
    lineHeight  : 1.5,
  },
  badge: {
    display        : 'inline-flex',
    alignItems     : 'center',
    gap            : '0.4rem',
    padding        : '0.3rem 0.75rem',
    borderRadius   : '999px',
    backgroundColor: `${TERMINAL_MINT}1A`,
    border         : `1px solid ${TERMINAL_MINT}66`,
    color          : TERMINAL_MINT,
    fontSize       : '0.8rem',
    marginBottom   : '2.5rem',
  },
  dot: {
    width          : '6px',
    height         : '6px',
    borderRadius   : '50%',
    backgroundColor: TERMINAL_MINT,
  },
  desktopLink: {
    display        : 'flex',
    alignItems     : 'center',
    gap            : '0.5rem',
    color          : SAVANNA_GOLD,
    fontSize       : '0.9rem',
    textDecoration : 'none',
    marginBottom   : '2rem',
  },
  protocol: {
    fontSize : '0.7rem',
    color    : `${CHALK_DUST}44`,
    marginTop: '3rem',
  },
};

export function MobileLockdownOverlay() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return (
      <IonPage style={styles.page}>
        <IonContent style={styles.content}>
          <div style={styles.content}>
            <p style={{ ...styles.subtitle, marginBottom: 0 }}>
              Mobile rebuild in progress. Lockdown is active until the 80% gate clears.
            </p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage style={styles.page}>
      <IonContent>
        <div style={styles.content}>
          {/* Lock icon */}
          <IonIcon icon={lockClosedOutline} style={styles.icon} />

          {/* Title */}
          <h1 style={styles.title}>Mobile Rebuild in Progress</h1>

          {/* Subtitle */}
          <p style={styles.subtitle}>
            The Starfall Salvage mobile experience is being rebuilt for Cape Town
            township performance. It will be back when it clears the 80% gate.
          </p>

          {/* Status badge */}
          <div style={styles.badge}>
            <span style={styles.dot} />
            Protocol 13 Active — Sandbox
          </div>

          {/* Desktop link */}
          <a
            href="https://starfallsalvage.kopanolabs.com"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.desktopLink}
          >
            <IonIcon icon={desktopOutline} style={{ fontSize: '1.1rem' }} />
            Play on Desktop
          </a>

          {/* Dismiss — visual only, does NOT clear lockdown */}
          <IonButton
            fill="outline"
            color="medium"
            onClick={() => setDismissed(true)}
            style={{ '--color': `${CHALK_DUST}66` } as React.CSSProperties}
          >
            Dismiss
          </IonButton>

          {/* Protocol label */}
          <p style={styles.protocol}>
            Protocol 13 Save Kill — Commandment 10
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
}
