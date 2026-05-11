/**
 * GameTab.tsx — PLAY tab
 *
 * Hosts the raw WebGL canvas. When MOBILE_LOCKDOWN is true, the parent
 * LockdownGuard intercepts before this tab mounts.
 *
 * Two states:
 *  - SplashPage  (state.mode === 'ready')
 *  - GamePage    (state.mode === 'playing' | 'gameover')
 *
 * The WebGL canvas is injected via a ref — no Three.js, no external engines.
 * Commandment 3: no framework dependency above the raw WebGL contract.
 */

import React, { useRef, useEffect } from 'react';
import {
  IonContent,
  IonPage,
} from '@ionic/react';
import { KopanoVault } from '@starfall/vault';

export default function GameTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // TODO: boot game.js WebGL loop against canvasRef.current
    // The kopano_vault is opened here; KopanoVault.open() resolves async.
    KopanoVault.open().then((vault) => {
      // vault.scores.topN(1) → seed SplashPage high score display
      vault.scores.topN(1).then((top) => {
        if (top[0]) {
          console.debug('[GameTab] best score loaded:', top[0].score);
        }
      });
    });
  }, []);

  return (
    <IonPage>
      <IonContent fullscreen scrollY={false}>
        {/* WebGL canvas — touch-action: none prevents scroll interference */}
        <canvas
          ref={canvasRef}
          id="starfallCanvas"
          style={{
            display   : 'block',
            width     : '100%',
            height    : '100%',
            touchAction: 'none',
          }}
        />
        {/* HUD, MobileFireButton, and game loop mounted by game.js boot sequence */}
      </IonContent>
    </IonPage>
  );
}
