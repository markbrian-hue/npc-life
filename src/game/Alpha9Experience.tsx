
import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { createPortal } from 'react-dom';

import { playGameSound } from './gameAudio';
import { WorkDodge } from './WorkDodge';

import {
  loadTour,
  newTour,
  TOUR_KEY,
  TOUR_TARGETS,
  type TourProgress,
} from './alpha9';

type Position = {
  x: number;
  z: number;
};

function saveTour(value: TourProgress) {
  try {
    localStorage.setItem(
      TOUR_KEY,
      JSON.stringify(value)
    );
  } catch {
    // localStorage can be disabled.
  }
}

function TourGuide({
  progress,
  onDismiss,
  onRestart,
}: {
  progress: TourProgress;
  onDismiss: () => void;
  onRestart: () => void;
}) {
  const checks = [
    {
      title: 'Explore at least 20 meters',
      done: progress.distance >= 20,
      detail: `${Math.floor(progress.distance)}/20 m`,
    },
    {
      title: 'Find Gary, the pigeon debt collector',
      done: progress.visitedGary,
      detail: 'X 3 / Z 3',
    },
    {
      title: 'Find the Pigeon Panic arcade',
      done: progress.visitedArcade,
      detail: 'X 9 / Z 8',
    },
  ];

  return (
    <section
      className="alpha9-guide"
      aria-label="City orientation guide"
    >
      <div className="alpha9-guide-header">
        <div>
          <span className="alpha9-eyebrow">
            CITY ORIENTATION
          </span>

          <h3>
            {progress.status === 'completed'
              ? 'YOU ARE OFFICIALLY AN NPC'
              : 'YOUR FIRST USEFUL DAY'}
          </h3>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          title="Hide guide"
          aria-label="Hide guide"
        >
          ×
        </button>
      </div>

      <p>
        {progress.status === 'completed'
          ? 'You earned your honorary City Resident Permit. It has no legal value.'
          : 'Find your way around. Follow the markers on the minimap and use WASD to walk.'}
      </p>

      <div className="alpha9-guide-steps">
        {checks.map((check) => (
          <div
            className={
              check.done ? 'done' : ''
            }
            key={check.title}
          >
            <span>
              {check.done ? '✓' : '○'}
            </span>

            <span>
              {check.title}
              <small>{check.detail}</small>
            </span>
          </div>
        ))}
      </div>

      <div className="alpha9-guide-actions">
        <button
          type="button"
          onClick={onDismiss}
        >
          {progress.status === 'completed'
            ? 'Claim useless permit'
            : 'Hide for now'}
        </button>

        {progress.status === 'completed' && (
          <button
            type="button"
            className="alpha9-secondary"
            onClick={onRestart}
          >
            Replay tour
          </button>
        )}
      </div>
    </section>
  );
}

export function Alpha9Experience() {
  const [mount, setMount] =
    useState<Element | null>(null);

  const [tour, setTour] =
    useState<TourProgress>(loadTour);

  const [
    guideVisible,
    setGuideVisible,
  ] = useState(
    () =>
      loadTour().status === 'started'
  );

  const [gameOpen, setGameOpen] =
    useState(false);

  const previous =
    useRef<Position | null>(null);

  useEffect(() => {
    setMount(
      document.querySelector('.game-shell')
    );
  }, []);

  useEffect(() => {
    saveTour(tour);
  }, [tour]);

  // Track player movement from Alpha 0.8's
  // existing position event.
  useEffect(() => {
    function onPosition(event: Event) {
      const detail = (
        event as CustomEvent<Position>
      ).detail;

      if (
        !detail ||
        !Number.isFinite(detail.x) ||
        !Number.isFinite(detail.z)
      ) {
        return;
      }

      const old = previous.current;

      previous.current = {
        x: detail.x,
        z: detail.z,
      };

      if (!old) return;

      const delta = Math.hypot(
        detail.x - old.x,
        detail.z - old.z
      );

      if (
        delta < 0.08 ||
        delta > 2
      ) {
        return;
      }

      setTour((current) => {
        if (
          current.status !== 'started'
        ) {
          return current;
        }

        const distance = Math.min(
          20,
          current.distance + delta
        );

        const visitedGary =
          current.visitedGary ||
          Math.hypot(
            detail.x - TOUR_TARGETS.gary.x,
            detail.z - TOUR_TARGETS.gary.z
          ) < 3.4;

        const visitedArcade =
          current.visitedArcade ||
          Math.hypot(
            detail.x - TOUR_TARGETS.arcade.x,
            detail.z - TOUR_TARGETS.arcade.z
          ) < 3.6;

        const status =
          distance >= 20 &&
          visitedGary &&
          visitedArcade
            ? 'completed'
            : 'started';

        if (status === 'completed') {
          playGameSound('job');
        }

        return {
          status,
          distance,
          visitedGary,
          visitedArcade,
        };
      });
    }

    window.addEventListener(
      'npc-life:position',
      onPosition
    );

    return () =>
      window.removeEventListener(
        'npc-life:position',
        onPosition
      );
  }, []);

  const closeWelcome = (
    status: 'started' | 'skipped'
  ) => {
    setTour(newTour(status));

    setGuideVisible(
      status === 'started'
    );

    previous.current = null;

    if (status === 'started') {
      playGameSound('start');
    }
  };

  function openGame() {
    // Avoid overlapping existing game modals.
    if (
      document.querySelector(
        '.shop-backdrop, .npc-dialog-backdrop, .progress-backdrop, .alpha6-overlay, .encounter-backdrop'
      )
    ) {
      return;
    }

    setGameOpen(true);
    setGuideVisible(false);
  }

  // New M shortcut for the mini-game.
  useEffect(() => {
    const onKey = (
      event: KeyboardEvent
    ) => {
      if (
        event.code !== 'KeyM' ||
        event.repeat ||
        gameOpen ||
        tour.status === 'new'
      ) {
        return;
      }

      if (
        event.target instanceof HTMLElement &&
        event.target.closest(
          'input, textarea, select, [contenteditable="true"]'
        )
      ) {
        return;
      }

      if (
        document.querySelector(
          '.shop-backdrop, .npc-dialog-backdrop, .progress-backdrop, .alpha6-overlay, .encounter-backdrop'
        )
      ) {
        return;
      }

      event.preventDefault();
      openGame();
    };

    window.addEventListener(
      'keydown',
      onKey
    );

    return () =>
      window.removeEventListener(
        'keydown',
        onKey
      );
  }, [
    gameOpen,
    tour.status,
  ]);

  // Block player movement while the welcome
  // screen is displayed.
  useEffect(() => {
    if (tour.status !== 'new') return;

    window.dispatchEvent(
      new Event('blur')
    );

    const keys = new Set([
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
      'Space',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
    ]);

    const swallow = (
      event: KeyboardEvent
    ) => {
      if (
        keys.has(event.code)
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener(
      'keydown',
      swallow,
      true
    );

    return () =>
      window.removeEventListener(
        'keydown',
        swallow,
        true
      );
  }, [tour.status]);

  if (!mount) return null;

  return createPortal(
    <>
      <div className="alpha9-toolbar">
        <button
          type="button"
          title="City orientation guide"
          onClick={() => {
            setGuideVisible(
              (value) => !value
            );

            if (
              tour.status === 'skipped'
            ) {
              setTour(
                newTour('started')
              );
            }
          }}
        >
          🧭 Guide
        </button>

        <button
          type="button"
          title="Play Unemployment Simulator (M)"
          onClick={openGame}
        >
          💼 Mini-game <kbd>M</kbd>
        </button>
      </div>

      {guideVisible &&
        tour.status !== 'new' &&
        !gameOpen && (
          <TourGuide
            progress={tour}
            onDismiss={() =>
              setGuideVisible(false)
            }
            onRestart={() => {
              setTour(
                newTour('started')
              );
              previous.current = null;
            }}
          />
        )}

      {tour.status === 'new' && (
        <div className="alpha9-backdrop">
          <section
            className="alpha9-modal alpha9-welcome"
            role="dialog"
            aria-modal="true"
            aria-label="Welcome to Idiot City"
          >
            <span className="alpha9-eyebrow">
              NPC LIFE · ALPHA 0.9
            </span>

            <h2>
              WELCOME TO IDIOT CITY.
            </h2>

            <p>
              You are an unemployed background
              character in a city that
              desperately needs adult
              supervision.
            </p>

            <div className="alpha9-welcome-grid">
              <div>
                <strong>WASD</strong>
                <span>
                  Walk around and ignore
                  responsibility
                </span>
              </div>

              <div>
                <strong>E / F</strong>
                <span>
                  Talk to residents and inspect
                  odd things
                </span>
              </div>

              <div>
                <strong>I / J / K</strong>
                <span>
                  Wardrobe, achievements, dailies
                </span>
              </div>

              <div>
                <strong>M</strong>
                <span>
                  Play the new survival mini-game
                </span>
              </div>
            </div>

            <div className="alpha9-welcome-buttons">
              <button
                type="button"
                className="alpha9-primary"
                onClick={() =>
                  closeWelcome('started')
                }
              >
                Start city orientation →
              </button>

              <button
                type="button"
                className="alpha9-secondary"
                onClick={() =>
                  closeWelcome('skipped')
                }
              >
                Skip, I live here already
              </button>
            </div>
          </section>
        </div>
      )}

      {gameOpen && (
        <WorkDodge
          onClose={() =>
            setGameOpen(false)
          }
        />
      )}
    </>,
    mount
  );
}
