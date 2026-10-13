
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

import { AmbientSound } from './game/AmbientSound';
import { WorldMinimap } from './game/WorldMinimap';
import { Alpha9Experience } from './game/Alpha9Experience';

import { ReleaseCenter } from './game/ReleaseCenter';
import { GameErrorBoundary } from './game/GameErrorBoundary';
import { validateWorld } from './game/worldValidation';

import './styles.css';
import './phase2.css';
import './phase4c.css';
import './phase5.css';
import './phase6.css';
import './phase8.css';
import './phase9.css';
import './game/release.css';

// Development-time world placement diagnostics (never modifies the world).
if (import.meta.env.DEV) {
  for (const issue of validateWorld()) {
    console.warn(`[NPC LIFE world][${issue.severity}] ${issue.code}: ${issue.message}`);
  }
}

ReactDOM.createRoot(
  document.getElementById('root')!
).render(
  <React.StrictMode>
    <GameErrorBoundary>
      <App />
      <WorldMinimap />
      <AmbientSound />
      <Alpha9Experience />
      <ReleaseCenter />
    </GameErrorBoundary>
  </React.StrictMode>
);
