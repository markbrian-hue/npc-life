
import { useEffect, useState } from 'react';
import {
  playGameSound,
  setGameAudioVolume,
  startGameAudio,
  stopGameAudio,
} from './gameAudio';

export function AmbientSound() {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [volume, setVolume] = useState(75);
  const [message, setMessage] = useState('Sound is off');

  useEffect(() => () => {
    void stopGameAudio();
  }, []);

  async function toggle() {
    if (busy) return;

    setBusy(true);

    try {
      if (on) {
        await stopGameAudio();
        setOn(false);
        setMessage('Sound is off');
      } else {
        setGameAudioVolume(volume / 100);
        await startGameAudio();
        setOn(true);
        setMessage('Sound on — did you hear the chime?');
      }
    } catch (error) {
      console.warn('Audio could not start:', error);
      setOn(false);
      setMessage('Audio blocked; check browser/device sound');
    } finally {
      setBusy(false);
    }
  }

  return (
    <details
      className="npc-sound-panel"
      role="group"
      aria-label="Game audio controls"
    >
      <summary>AUDIO <span>{on ? "ON" : "OFF"}</span></summary>
      <div className="npc-sound-actions">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void toggle();
          }}
        >
          {on ? 'Sound ON' : 'Enable sound'}
        </button>

        <button
          type="button"
          disabled={!on || busy}
          title="Play a test sound"
          onClick={() => playGameSound('start')}
        >
          Test ♪
        </button>
      </div>

      <label className="npc-volume">
        Volume: {volume}%
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={volume}
          onChange={(event) => {
            const next = Number(event.target.value);
            setVolume(next);
            setGameAudioVolume(next / 100);
          }}
        />
      </label>

      <small aria-live="polite">{message}</small>
    </details>
  );
}
