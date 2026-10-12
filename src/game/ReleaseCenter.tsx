
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { loadTour } from './alpha9';
import { playGameSound } from './gameAudio';

import {
  ENDING_KEY,
  exportSave,
  getSettings,
  importSave,
  readGoals,
  resetSave,
  setSettings,
  type ReleaseGoal,
  type ReleaseSettings,
} from './releaseData';

import './release.css';

type Screen =
  | 'home'
  | 'goals'
  | 'settings'
  | 'about'
  | 'permit';

const OTHER_DIALOGS = [
  '.shop-backdrop',
  '.npc-dialog-backdrop',
  '.progress-backdrop',
  '.alpha6-overlay',
  '.encounter-backdrop',
  '.alpha9-backdrop',
].join(',');

const GAME_KEYS = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'Space',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'KeyE',
  'KeyF',
  'KeyI',
  'KeyJ',
  'KeyK',
  'KeyB',
  'KeyM',
]);

export function ReleaseCenter() {
  const [mount, setMount] =
    useState<Element | null>(null);

  const [open, setOpen] = useState(
    () => loadTour().status !== 'new'
  );

  const [screen, setScreen] =
    useState<Screen>('home');

  const [goals, setGoals] =
    useState<ReleaseGoal[]>([]);

  const [settings, updateSettings] =
    useState<ReleaseSettings>(getSettings);

  const [finished, setFinished] = useState(
    () =>
      localStorage.getItem(ENDING_KEY) === '1'
  );

  const [message, setMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMount(
      document.querySelector('.game-shell')
    );

    try {
      setSettings(getSettings());
    } catch {
      // Browser storage may be unavailable.
    }

    setGoals(readGoals());
  }, []);

  // Existing App.tsx writes to localStorage.
  // Refresh the endgame checklist periodically.
  useEffect(() => {
    const refresh = () => {
      setGoals(readGoals());

      if (
        localStorage.getItem(ENDING_KEY) === '1'
      ) {
        setFinished(true);
      }
    };

    const id = window.setInterval(
      refresh,
      1500
    );

    window.addEventListener(
      'focus',
      refresh
    );

    return () => {
      window.clearInterval(id);

      window.removeEventListener(
        'focus',
        refresh
      );
    };
  }, []);

  // Release stuck movement keys when the menu opens.
  useEffect(() => {
    if (open) {
      window.dispatchEvent(new Event('blur'));
    }
  }, [open]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (open) {
        if (
          event.code === 'Escape' ||
          event.code === 'KeyP'
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
          setOpen(false);
          return;
        }

        if (
          GAME_KEYS.has(event.code) &&
          !(event.target instanceof HTMLButtonElement)
        ) {
          event.preventDefault();
        }

        // Don't let menu keypresses also trigger game actions.
        // Native keyboard activation of focused buttons still works.
        event.stopImmediatePropagation();
        return;
      }

      if (
        event.code !== 'Escape' &&
        event.code !== 'KeyP'
      ) {
        return;
      }

      if (
        event.repeat ||
        document.querySelector(OTHER_DIALOGS)
      ) {
        return;
      }

      if (
        event.target instanceof HTMLElement &&
        event.target.closest(
          'input,textarea,select'
        )
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      setScreen('home');
      setMessage('');
      setOpen(true);
    };

    window.addEventListener(
      'keydown',
      handler,
      true
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handler,
        true
      );
    };
  }, [open]);

  function toggleSetting(
    key: keyof ReleaseSettings
  ) {
    const next = {
      ...settings,
      [key]: !settings[key],
    };

    updateSettings(next);

    try {
      setSettings(next);
      setMessage('Display preferences saved.');
    } catch {
      setMessage('Browser storage is unavailable.');
    }
  }

  const isReady =
    goals.length === 5 &&
    goals.every(
      (goal) =>
        goal.value >= goal.target
    );

  const done = goals.filter(
    (goal) => goal.value >= goal.target
  ).length;

  function claim() {
    if (!isReady) return;

    try {
      localStorage.setItem(
        ENDING_KEY,
        '1'
      );

      setFinished(true);
      setScreen('permit');

      playGameSound('job');
    } catch {
      setMessage(
        'Unable to save the ending. Check browser storage.'
      );
    }
  }

  async function restore(file?: File) {
    if (!file) return;

    try {
      await importSave(file);
      window.location.reload();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not import save.'
      );
    } finally {
      if (fileInput.current) {
        fileInput.current.value = '';
      }
    }
  }

  async function fullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }

      setMessage('Fullscreen preference updated.');
    } catch {
      setMessage(
        'Fullscreen is not available in this browser.'
      );
    }
  }

  if (!mount) return null;

  return createPortal(
    <>
      {!open && (
        <button
          type="button"
          className="release-menu-button"
          onClick={() => {
            if (
              document.querySelector(OTHER_DIALOGS)
            ) {
              return;
            }

            setScreen('home');
            setOpen(true);
          }}
          title="Open game menu (Esc or P)"
        >
          <span>☰</span>
          {' '}Menu
          <kbd>ESC</kbd>
        </button>
      )}

      {open && (
        <div className="release-backdrop">
          <section
            className="release-menu"
            role="dialog"
            aria-modal="true"
            aria-label="NPC LIFE game menu"
          >
            <header className="release-header">
              <div className="release-logo">
                N<span>!</span>
              </div>

              <div className="release-brand">
                <span className="release-kicker">
                  IDIOT CITY · OFFICIAL BUILD
                </span>

                <h1>NPC LIFE</h1>

                <p>
                  VERSION 1.0 · THE CITY OF IDIOTS
                </p>
              </div>

              <button
                className="release-close"
                onClick={() => setOpen(false)}
                aria-label="Continue playing"
              >
                ×
              </button>
            </header>

            <div
              className="release-tabs"
              role="navigation"
              aria-label="Menu sections"
            >
              {([
                ['home', 'Play'],
                ['goals', 'City Permit'],
                ['settings', 'Settings'],
                ['about', 'About'],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  className={
                    screen === id ? 'active' : ''
                  }
                  onClick={() => {
                    setScreen(id);
                    setMessage('');
                    setConfirmReset(false);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="release-content">
              {screen === 'home' && (
                <>
                  <div className="release-hero">
                    <span>
                      WELCOME, BACKGROUND CHARACTER
                    </span>

                    <h2>
                      YOUR MAIN QUEST IS TO BE
                      SOMEWHAT USEFUL.
                    </h2>

                    <p>
                      Find ridiculous jobs,
                      investigate the city, buy
                      questionable cosmetics,
                      and earn the prestigious
                      Idiot City Permit.
                    </p>

                    <button
                      className="release-primary"
                      onClick={() => {
                        setOpen(false);
                        playGameSound('interact');
                      }}
                    >
                      ▶ Continue playing
                    </button>
                  </div>

                  <div className="release-stats">
                    <div>
                      <strong>
                        {done}/5
                      </strong>

                      <small>
                        PERMIT OBJECTIVES
                      </small>
                    </div>

                    <div>
                      <strong>
                        {finished
                          ? 'ISSUED'
                          : 'PENDING'}
                      </strong>

                      <small>
                        CITY PERMIT
                      </small>
                    </div>
                  </div>

                  <button
                    className="release-secondary release-wide"
                    onClick={() =>
                      setScreen(
                        finished
                          ? 'permit'
                          : 'goals'
                      )
                    }
                  >
                    {finished
                      ? '🏆 View your City Permit'
                      : '🏆 See the final quest'}
                    {' '}→
                  </button>
                </>
              )}

              {screen === 'goals' && (
                <>
                  <h2 className="release-section-title">
                    The Idiot City Permit
                  </h2>

                  <p className="release-muted">
                    Complete every objective to
                    finish NPC LIFE's first story
                    arc. You can still free-roam
                    afterward.
                  </p>

                  <div className="release-goal-list">
                    {goals.map((goal) => {
                      const complete =
                        goal.value >= goal.target;

                      return (
                        <div
                          className={`release-goal ${
                            complete ? 'done' : ''
                          }`}
                          key={goal.id}
                        >
                          <span className="release-check">
                            {complete ? '✓' : '○'}
                          </span>

                          <div>
                            <strong>
                              {goal.title}
                            </strong>

                            <p>
                              {goal.details}
                            </p>

                            <div className="release-track">
                              <span
                                style={{
                                  width: `${
                                    Math.min(
                                      100,
                                      goal.value /
                                        goal.target *
                                        100
                                    )
                                  }%`,
                                }}
                              />
                            </div>
                          </div>

                          <small>
                            {Math.min(
                              goal.value,
                              goal.target
                            )}/{goal.target}
                          </small>
                        </div>
                      );
                    })}
                  </div>

                  {finished ? (
                    <button
                      className="release-primary"
                      onClick={() =>
                        setScreen('permit')
                      }
                    >
                      View earned permit →
                    </button>
                  ) : (
                    <button
                      className="release-primary"
                      disabled={!isReady}
                      onClick={claim}
                    >
                      {isReady
                        ? '🎓 Claim your City Permit'
                        : `Complete all goals (${done}/5)`}
                    </button>
                  )}
                </>
              )}

              {screen === 'permit' && (
                <div className="release-ending">
                  <span className="release-seal">
                    ✦
                  </span>

                  <span className="release-kicker">
                    IDIOT CITY COUNCIL OF NONSENSE
                  </span>

                  <h2>
                    CERTIFICATE OF ULTIMATE
                    UNEMPLOYMENT
                  </h2>

                  <p>
                    Presented to one exceptionally
                    average NPC for surviving
                    absurd jobs, impossible social
                    expectations, and the local
                    pigeon economy.
                  </p>

                  <strong>
                    OFFICIALLY A CITY LEGEND
                  </strong>

                  <small>
                    NPC LIFE v1.0 · YOUR ADVENTURE
                    CONTINUES
                  </small>

                  <button
                    className="release-primary"
                    onClick={() =>
                      setOpen(false)
                    }
                  >
                    Return to Idiot City →
                  </button>
                </div>
              )}

              {screen === 'settings' && (
                <>
                  <h2 className="release-section-title">
                    Game settings
                  </h2>

                  <div className="release-setting">
                    <div>
                      <strong>
                        Reduce UI animations
                      </strong>

                      <small>
                        Calmer menus and interaction
                        effects.
                      </small>
                    </div>

                    <input
                      type="checkbox"
                      checked={
                        settings.reducedMotion
                      }
                      onChange={() =>
                        toggleSetting('reducedMotion')
                      }
                    />
                  </div>

                  <div className="release-setting">
                    <div>
                      <strong>Compact HUD</strong>

                      <small>
                        Smaller quest panel and
                        tighter bottom toolbar.
                      </small>
                    </div>

                    <input
                      type="checkbox"
                      checked={settings.compactHud}
                      onChange={() =>
                        toggleSetting('compactHud')
                      }
                    />
                  </div>

                  <div className="release-setting">
                    <div>
                      <strong>Hide minimap</strong>

                      <small>
                        More space for city
                        exploration.
                      </small>
                    </div>

                    <input
                      type="checkbox"
                      checked={settings.hideMinimap}
                      onChange={() =>
                        toggleSetting('hideMinimap')
                      }
                    />
                  </div>

                  <button
                    className="release-secondary release-wide"
                    onClick={() => {
                      void fullscreen();
                    }}
                  >
                    ⛶ Toggle fullscreen
                  </button>

                  <p className="release-muted">
                    Sound can be toggled from the
                    separate audio control in-game.
                    Display settings are saved in
                    this browser.
                  </p>

                  <h3 className="release-section-title">
                    Your progress
                  </h3>

                  <div className="release-save-actions">
                    <button
                      className="release-secondary"
                      onClick={() => {
                        try {
                          exportSave();
                          setMessage(
                            'Save downloaded.'
                          );
                        } catch {
                          setMessage(
                            'Backup failed.'
                          );
                        }
                      }}
                    >
                      ↓ Export save
                    </button>

                    <button
                      className="release-secondary"
                      onClick={() =>
                        fileInput.current?.click()
                      }
                    >
                      ↑ Import save
                    </button>

                    <input
                      ref={fileInput}
                      type="file"
                      accept="application/json,.json"
                      hidden
                      onChange={(event) => {
                        void restore(
                          event.target.files?.[0]
                        );
                      }}
                    />
                  </div>

                  <p className="release-muted">
                    Importing replaces your NPC
                    LIFE save. Export first if you
                    want to keep a backup. No cloud
                    account or server is required.
                  </p>

                  {!confirmReset ? (
                    <button
                      className="release-danger-outline"
                      onClick={() =>
                        setConfirmReset(true)
                      }
                    >
                      Reset all NPC LIFE progress…
                    </button>
                  ) : (
                    <div className="release-confirm">
                      <strong>
                        Delete all game progress on
                        this browser?
                      </strong>

                      <p>
                        This clears coins, wardrobe,
                        reputation, jobs, minigame
                        records and your permit.
                        This cannot be undone
                        without a backup.
                      </p>

                      <button
                        className="release-danger"
                        onClick={() => {
                          resetSave();
                          window.location.reload();
                        }}
                      >
                        Yes, erase everything
                      </button>

                      <button
                        className="release-secondary"
                        onClick={() =>
                          setConfirmReset(false)
                        }
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}

              {screen === 'about' && (
                <>
                  <h2 className="release-section-title">
                    About NPC LIFE
                  </h2>

                  <p className="release-muted">
                    A free, single-player,
                    browser-based comedy sandbox
                    built with React, TypeScript,
                    Three.js and React Three Fiber.
                    Explore the city, complete jobs,
                    and become the least productive
                    local celebrity.
                  </p>

                  <div className="release-about-grid">
                    <p>
                      <strong>
                        WASD / Arrows
                      </strong>
                      <span>
                        Move · Shift to sprint ·
                        Space to jump
                      </span>
                    </p>

                    <p>
                      <strong>E / F</strong>
                      <span>
                        Interact · Talk to special
                        citizens
                      </span>
                    </p>

                    <p>
                      <strong>I / J / K</strong>
                      <span>
                        Wardrobe · Journal · Daily
                        challenges
                      </span>
                    </p>

                    <p>
                      <strong>M / B / H</strong>
                      <span>
                        Minigame · Wave · Help
                      </span>
                    </p>

                    <p>
                      <strong>ESC / P</strong>
                      <span>
                        Menu and pause player
                        controls
                      </span>
                    </p>

                    <p>
                      <strong>
                        Drag / Scroll
                      </strong>
                      <span>
                        Rotate and zoom the camera
                      </span>
                    </p>
                  </div>

                  <p className="release-muted">
                    Progress is stored on your
                    device, not in an online
                    account. Daily challenges use
                    your device's local date.
                    The game is designed for
                    desktop browsers; some 3D
                    movement controls require
                    a keyboard.
                  </p>

                  <a
                    className="release-external"
                    href="https://github.com/markbrian-hue/npc-life"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Project source on GitHub ↗
                  </a>
                </>
              )}

              {message && (
                <p
                  className="release-message"
                  role="status"
                >
                  {message}
                </p>
              )}
            </div>

            <footer className="release-footer">
              <span>
                NO PAID SERVERS · LOCAL SAVES
              </span>

              <span>
                ESC / P TO CLOSE
              </span>
            </footer>
          </section>
        </div>
      )}
    </>,
    mount
  );
}
