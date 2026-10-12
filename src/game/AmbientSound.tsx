
import { useEffect, useRef, useState } from 'react';

export function AmbientSound() {
  const [enabled, setEnabled] = useState(false);

  const audio = useRef<{
    context: AudioContext;
    source: AudioBufferSourceNode;
  } | null>(null);

  useEffect(() => {
    return () => {
      const active = audio.current;

      if (active) {
        active.source.stop();
        void active.context.close();
        audio.current = null;
      }
    };
  }, []);

  async function toggle() {
    if (audio.current) {
      audio.current.source.stop();
      await audio.current.context.close();
      audio.current = null;
      setEnabled(false);
      return;
    }

    try {
      const context = new AudioContext();

      const buffer = context.createBuffer(
        1,
        context.sampleRate * 2,
        context.sampleRate
      );

      const samples = buffer.getChannelData(0);

      for (let i = 0; i < samples.length; i++) {
        samples[i] = (Math.random() * 2 - 1) * 0.23;
      }

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 220;

      const gain = context.createGain();
      gain.gain.value = 0.045;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);

      source.start();

      audio.current = { context, source };

      await context.resume();
      setEnabled(true);
    } catch (error) {
      console.warn('Ambient audio unavailable', error);
      setEnabled(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void toggle();
      }}
      aria-pressed={enabled}
      title="Toggle subtle city ambience"
      style={{
        position: 'fixed',
        right: 235,
        bottom: 24,
        zIndex: 20,
        padding: '10px 12px',
        borderRadius: 12,
        border: '1px solid #39495e',
        background: '#192434ee',
        color: '#fff',
        fontWeight: 700,
        cursor: 'pointer',
        fontSize: 12,
        boxShadow: '0 6px 18px #0004',
      }}
    >
      {enabled ? '🔊 Ambience' : '🔇 Ambience'}
    </button>
  );
}
