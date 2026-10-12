
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

import { AmbientSound } from './game/AmbientSound';
import { WorldMinimap } from './game/WorldMinimap';
import { Alpha9Experience } from './game/Alpha9Experience';

import './styles.css';
import './phase2.css';
import './phase4c.css';
import './phase5.css';
import './phase6.css';
import './phase8.css';
import './phase9.css';

ReactDOM.createRoot(
  document.getElementById('root')!
).render(
  <React.StrictMode>
    <App />
    <WorldMinimap />
    <AmbientSound />
    <Alpha9Experience />
  </React.StrictMode>
);
