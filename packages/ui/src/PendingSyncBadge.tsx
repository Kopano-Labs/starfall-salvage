/**
 * PendingSyncBadge.tsx — Visual indicator for unsynced vault records
 *
 * Pulsing Terminal Mint dot shown next to any row that is queued in
 * kopano_vault sync_queue but not yet DONE.
 *
 * Usage:
 *   <PendingSyncBadge synced={score.synced} />
 */

import React from 'react';

const TERMINAL_MINT = '#00E676';

interface PendingSyncBadgeProps {
  synced: boolean;
  /** Override label (default: "Syncing…") */
  label?: string;
}

export function PendingSyncBadge({ synced, label = 'Syncing…' }: PendingSyncBadgeProps) {
  if (synced) return null;

  return (
    <span
      aria-label="Pending sync"
      style={{
        display       : 'inline-flex',
        alignItems    : 'center',
        gap           : '0.3rem',
        fontSize      : '0.7rem',
        color         : TERMINAL_MINT,
        letterSpacing : '0.02em',
      }}
    >
      <span
        style={{
          width           : '6px',
          height          : '6px',
          borderRadius    : '50%',
          backgroundColor : TERMINAL_MINT,
          animation       : 'pulse 1.4s ease-in-out infinite',
        }}
      />
      {label}
    </span>
  );
}

/*
 * Inject keyframe once — won't duplicate if multiple badges mount.
 * Matches the "pulsing Terminal Mint dot" spec from Offline Worker Contract.
 */
if (typeof document !== 'undefined' && !document.getElementById('ions-pulse-kf')) {
  const style = document.createElement('style');
  style.id = 'ions-pulse-kf';
  style.textContent = `
    @keyframes pulse {
      0%,100% { opacity: 1; transform: scale(1); }
      50%      { opacity: 0.4; transform: scale(1.5); }
    }
  `;
  document.head.appendChild(style);
}
