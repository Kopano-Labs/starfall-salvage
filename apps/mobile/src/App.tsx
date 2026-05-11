/**
 * App.tsx — Starfall Salvage mobile root
 *
 * Shell: IonApp + IonTabs (4 tabs)
 * Guard: LockdownGuard wraps the entire tab shell
 *
 * Protocol 13: MOBILE_LOCKDOWN gate must be cleared before gameplay.
 * Commandment 9: All data writes go to kopano_vault first.
 */

import React from 'react';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import {
  gameControllerOutline,
  gameController,
  chatbubblesOutline,
  chatbubbles,
  personCircleOutline,
  personCircle,
  radioOutline,
  radio,
} from 'ionicons/icons';

import { LockdownGuard, OfflineBanner, KopanoTokens } from '@starfall/ui';

// Pages (lazy-loaded to keep initial bundle lean — Commandment 8 MXit Efficiency)
const GameTab   = React.lazy(() => import('./tabs/GameTab'));
const CommsTab  = React.lazy(() => import('./tabs/CommsTab'));
const PilotTab  = React.lazy(() => import('./tabs/PilotTab'));
const OpsTab    = React.lazy(() => import('./tabs/OpsTab'));

/* Ionic setup — must be called once at app boot */
setupIonicReact({
  mode: 'md', // Material Design tokens (consistent on Android + iOS)
});

/* Inject Kopano Labs CSS variables into :root */
const cssVars = `
  :root {
    --ion-background-color:       ${KopanoTokens.KAROO_NIGHT};
    --ion-color-primary:          ${KopanoTokens.SAVANNA_GOLD};
    --ion-color-primary-contrast: ${KopanoTokens.KAROO_NIGHT};
    --ion-color-success:          ${KopanoTokens.TERMINAL_MINT};
    --ion-text-color:             ${KopanoTokens.CHALK_DUST};
    --ion-toolbar-background:     ${KopanoTokens.KAROO_NIGHT};
    --ion-tab-bar-background:     ${KopanoTokens.KAROO_NIGHT};
    --ion-tab-bar-color:          #8891A4;
    --ion-tab-bar-color-selected: ${KopanoTokens.SAVANNA_GOLD};
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('starfall-css-vars')) {
  const style = document.createElement('style');
  style.id = 'starfall-css-vars';
  style.textContent = cssVars;
  document.head.appendChild(style);
}

export default function App() {
  return (
    <IonApp>
      {/* Global offline banner — Pillar 2 Community, Commandment 9 */}
      <OfflineBanner />

      {/* Protocol 13 gate — shows MobileLockdownOverlay if MOBILE_LOCKDOWN */}
      <LockdownGuard>
        <IonReactRouter>
          <IonTabs>
            <IonRouterOutlet>
              <React.Suspense fallback={null}>
                <Route exact path="/game"  render={() => <GameTab  />} />
                <Route exact path="/comms" render={() => <CommsTab />} />
                <Route exact path="/pilot" render={() => <PilotTab />} />
                <Route exact path="/ops"   render={() => <OpsTab   />} />
                <Route exact path="/" render={() => <Redirect to="/game" />} />
              </React.Suspense>
            </IonRouterOutlet>

            <IonTabBar slot="bottom">
              <IonTabButton tab="game" href="/game">
                <IonIcon aria-hidden="true" ios={gameControllerOutline} md={gameController} />
                <IonLabel>PLAY</IonLabel>
              </IonTabButton>

              <IonTabButton tab="comms" href="/comms">
                <IonIcon aria-hidden="true" ios={chatbubblesOutline} md={chatbubbles} />
                <IonLabel>COMMS</IonLabel>
              </IonTabButton>

              <IonTabButton tab="pilot" href="/pilot">
                <IonIcon aria-hidden="true" ios={personCircleOutline} md={personCircle} />
                <IonLabel>PILOT</IonLabel>
              </IonTabButton>

              <IonTabButton tab="ops" href="/ops">
                <IonIcon aria-hidden="true" ios={radioOutline} md={radio} />
                <IonLabel>OPS</IonLabel>
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        </IonReactRouter>
      </LockdownGuard>
    </IonApp>
  );
}
