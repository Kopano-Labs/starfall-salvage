/**
 * LockdownGuard.tsx — Protocol 13 Save Kill enforcement component
 *
 * Wraps any surface that must be hidden when MOBILE_LOCKDOWN is active.
 * When lockdown is true, renders MobileLockdownOverlay instead of children.
 *
 * Commandment 10: Protocol 13 — Halt at logical boundaries.
 * Commandment 9:  Offline-First — Lockdown never silently disabled.
 *
 * @example
 *   <LockdownGuard>
 *     <GameTab />
 *   </LockdownGuard>
 */

import React from 'react';
import { MobileLockdownOverlay } from './MobileLockdownOverlay';

/**
 * Source of truth for lockdown state.
 * In production: import from @starfall/game-config or environment const.
 * During Protocol 13 active period: hardcoded true.
 */
const MOBILE_LOCKDOWN: boolean =
  typeof window !== 'undefined'
    ? !!(window as any).__STARFALL_MOBILE_LOCKDOWN
    : true; // SSR default: locked

interface LockdownGuardProps {
  children: React.ReactNode;
  /** Override lockdown check — for Storybook / testing only */
  forceUnlocked?: boolean;
}

export function LockdownGuard({ children, forceUnlocked = false }: LockdownGuardProps) {
  const locked = MOBILE_LOCKDOWN && !forceUnlocked;

  if (locked) {
    return <MobileLockdownOverlay />;
  }

  return <>{children}</>;
}
