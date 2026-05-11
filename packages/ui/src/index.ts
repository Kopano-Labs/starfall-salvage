/**
 * @starfall/ui — IONS component library
 * Kopano Labs palette · Ionic React · Offline-first
 *
 * Commandment 9: Offline-First Mandate
 * Commandment 4: Servant-Stewardship (township community focus)
 */

export { LockdownGuard }       from './LockdownGuard';
export { MobileLockdownOverlay } from './MobileLockdownOverlay';
export { OfflineBanner }        from './OfflineBanner';
export { PendingSyncBadge }     from './PendingSyncBadge';

/**
 * Kopano Labs design tokens — import directly if you need raw values.
 * @example
 *   import { KopanoTokens } from '@starfall/ui';
 *   console.log(KopanoTokens.SAVANNA_GOLD); // '#F5A623'
 */
export const KopanoTokens = {
  KAROO_NIGHT   : '#0D1117',
  SAVANNA_GOLD  : '#F5A623',
  TERMINAL_MINT : '#00E676',
  CHALK_DUST    : '#E2E8F0',
} as const;

export type KopanoTokenKey = keyof typeof KopanoTokens;
