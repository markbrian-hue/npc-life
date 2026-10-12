
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AmbientSound } from './game/AmbientSound';

import './styles.css';
import './phase2.css';
import './phase4c.css';
import './phase5.css';

ReactDOM.createRoot(
  document.getElementById('root')!
).render(
  <React.StrictMode>
    <App />
    <AmbientSound />
  </React.StrictMode>
);
