
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

import { AmbientSound } from './game/AmbientSound';

import { Alpha9Experience } from './game/Alpha9Experience';

import { ReleaseCenter } from './game/ReleaseCenter';
import { GameErrorBoundary } from './game/GameErrorBoundary';

import { GameUIProvider } from './game/ui/GameUI';
import { loadTour } from './game/alpha9';

import './styles.css';
import './phase2.css';
import './phase4c.css';
import './phase5.css';
import './phase6.css';
import './phase8.css';
import './phase9.css';
import './game/release.css';
import './game/ui/retro.css';
import './game/city-revival.css';
import './game/living-city.css';
import './game/garage.css';

ReactDOM.createRoot(
  document.getElementById('root')!
).render(
  <React.StrictMode>
    <GameErrorBoundary>
      <GameUIProvider initialMenu={loadTour().status === 'new' ? 'welcome' : 'release'}>
      <App />
      <AmbientSound />
      <Alpha9Experience />
      <ReleaseCenter />
      </GameUIProvider>
    </GameErrorBoundary>
  </React.StrictMode>
);
