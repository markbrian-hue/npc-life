
import { useEffect, useRef, useState } from 'react';
import { playGameSound } from './gameAudio';
import { ARCADE_POSITION } from './alpha6';

const GOAL = 7;
const DURATION = 15;

function nextTarget(previous: number): number {
  return (
    previous +
    1 +
    Math.floor(Math.random() * 8)
  ) % 9;
}

export function ArcadeKiosk() {
  return (
    <group
      position={[
        ARCADE_POSITION.x,
        0,
        ARCADE_POSITION.z,
      ]}
    >
      <mesh castShadow position={[0, 0.8, 0]}>
        <boxGeometry args={[1.4, 1.6, 0.9]} />
        <meshStandardMaterial
          color="#454f78"
          roughness={0.68}
        />
      </mesh>

      <mesh position={[0, 1.14, 0.47]}>
        <boxGeometry args={[1.1, 0.64, 0.07]} />
        <meshStandardMaterial
          color="#74c8de"
          emissive="#164b69"
          emissiveIntensity={0.35}
        />
      </mesh>

      <mesh position={[0, 1.15, 0.52]}>
        <planeGeometry args={[0.87, 0.47]} />
        <meshBasicMaterial color="#273c5a" />
      </mesh>

      <mesh castShadow position={[0, 1.97, 0.05]}>
        <boxGeometry args={[1.56, 0.32, 1.08]} />
        <meshStandardMaterial color="#f3cb75" />
      </mesh>

      <mesh position={[0, 0.65, 0.51]}>
        <boxGeometry args={[0.85, 0.22, 0.12]} />
        <meshStandardMaterial color="#e5a28c" />
      </mesh>

      <mesh position={[0.2, 0.48, 0.51]}>
        <sphereGeometry args={[0.12, 10, 8]} />
        <meshStandardMaterial color="#f5de7b" />
      </mesh>

      <mesh position={[0, 2.25, 0]}>
        <octahedronGeometry args={[0.23]} />
        <meshBasicMaterial color="#fdf39b" />
      </mesh>
    </group>
  );
}

type Props = {
  onClose: () => void;
  onFinish: (won: boolean) => void;
};

export function PigeonPanic({
  onClose,
  onFinish,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(DURATION);
  const [hits, setHits] = useState(0);
  const [target, setTarget] = useState(4);
  const [result, setResult] = useState<
    'win' | 'lose' | null
  >(null);

  const concluded = useRef(false);

  const finish = (won: boolean) => {
    if (concluded.current) return;

    concluded.current = true;
    setPlaying(false);
    setResult(won ? 'win' : 'lose');

    playGameSound(won ? 'job' : 'error');
    onFinish(won);
  };

  useEffect(() => {
    if (!playing) return;

    const timer = window.setInterval(
      () =>
        setSeconds((s) =>
          Math.max(0, s - 1)
        ),
      1000
    );

    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (playing && seconds === 0) {
      finish(false);
    }
  });

  const start = () => {
    concluded.current = false;
    setResult(null);
    setHits(0);
    setSeconds(DURATION);
    setTarget(Math.floor(Math.random() * 9));
    setPlaying(true);

    playGameSound('start');
  };

  const hit = (index: number) => {
    if (
      !playing ||
      index !== target ||
      concluded.current
    ) {
      return;
    }

    const next = hits + 1;
    setHits(next);

    playGameSound('coin');

    if (next >= GOAL) {
      finish(true);
    } else {
      setTarget(nextTarget(index));
    }
  };

  return (
    <div
      className="alpha6-overlay"
      onMouseDown={onClose}
    >
      <section
        className="alpha6-arcade"
        role="dialog"
        aria-modal="true"
        aria-label="Pigeon Panic arcade"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="alpha6-heading">
          <div>
            <small>IDIOT CITY ARCADE</small>
            <h2>🐦 PIGEON PANIC</h2>
            <p>
              Tap 7 suspicious pigeons before the
              timer runs out.
            </p>
          </div>

          <button
            aria-label="Close arcade"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="alpha6-score">
          <span>
            CAUGHT <strong>{hits}/{GOAL}</strong>
          </span>
          <span>
            TIME <strong>{seconds}s</strong>
          </span>
        </div>

        <div className="alpha6-grid">
          {Array.from({ length: 9 }, (_, index) => (
            <button
              key={index}
              type="button"
              disabled={!playing}
              aria-label={
                playing && target === index
                  ? 'Catch pigeon'
                  : 'Empty spot'
              }
              className={
                playing && target === index
                  ? 'bird'
                  : ''
              }
              onClick={() => hit(index)}
            >
              {playing && target === index
                ? '🐦'
                : '·'}
            </button>
          ))}
        </div>

        <div className="alpha6-arcade-footer">
          <p aria-live="polite">
            {result === 'win'
              ? 'You won. The pigeon union is furious.'
              : result === 'lose'
                ? 'Too slow. The pigeons have escaped.'
                : playing
                  ? 'Quick! Click the moving pigeon.'
                  : 'First win each day pays 20 Coins and 8 reputation.'}
          </p>

          {!playing && (
            <button onClick={start}>
              {result ? 'Try again' : 'Start round'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
