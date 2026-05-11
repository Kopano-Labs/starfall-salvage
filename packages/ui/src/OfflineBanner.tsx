/**
 * OfflineBanner.tsx — Global offline state indicator
 *
 * Fixed top banner shown when navigator.onLine === false.
 * Pillar 2 (Community): township connectivity is intermittent.
 * Messages queued to kopano_vault are never silently dropped.
 */

import React, { useEffect, useState } from 'react';
import { IonBanner } from '@ionic/react';

// Kopano Labs palette
const SAVANNA_GOLD  = '#F5A623';
const KAROO_NIGHT   = '#0D1117';

interface OfflineBannerProps {
  /** Additional message appended after the default copy */
  extraCopy?: string;
}

export function OfflineBanner({ extraCopy }: OfflineBannerProps) {
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOnline  = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!offline) return null;

  const copy = extraCopy
    ? `Offline Mode — Actions saved locally. ${extraCopy}`
    : 'Offline Mode — Actions saved locally. Will sync when connected.';

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position        : 'fixed',
        top             : 0,
        left            : 0,
        right           : 0,
        zIndex          : 9999,
        backgroundColor : SAVANNA_GOLD,
        color           : KAROO_NIGHT,
        fontSize        : '0.8rem',
        fontWeight      : 600,
        textAlign       : 'center',
        padding         : '0.4rem 1rem',
        letterSpacing   : '0.02em',
      }}
    >
      {copy}
    </div>
  );
}
