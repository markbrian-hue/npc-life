import { GameDialog } from './ui/GameDialog';
import { useGameUI, useMenuState, isTyping } from './ui/GameUI';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { playGameSound } from './gameAudio';

import {
  ENDING_KEY,
  exportSave,
  getSettings,
  importSave,
  readGoals,
  readReleaseValue,
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

export function ReleaseCenter() {
  const [mount, setMount] =
    useState<Element | null>(null);

  const { store } = useGameUI();
  const [open, setOpen] = useMenuState('release');

  const [screen, setScreen] =
    useState<Screen>('home');

  const [goals, setGoals] =
    useState<ReleaseGoal[]>([]);

  const [settings, updateSettings] =
    useState<ReleaseSettings>(getSettings);

  const [finished, setFinished] = useState(
    () =>
      readReleaseValue(ENDING_KEY) === '1'
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
        readReleaseValue(ENDING_KEY) === '1'
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

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.repeat || isTyping(event.target) || store.getSnapshot() !== null) return;
      if (event.code !== 'Escape' && event.code !== 'KeyP') return;
      event.preventDefault();
      setScreen('home');
      setMessage('');
      setOpen(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store, setOpen]);

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
        <GameDialog id="release" className="release-menu" label="NPC LIFE game menu" onClose={() => setOpen(false)} onKeyDown={event => {
          if (event.code === 'KeyP' && !event.repeat && !isTyping(event.target)) setOpen(false);
        }}>
            <header className="release-header">
              <div className="release-logo">
                N<span>!</span>
              </div>

              <div className="release-brand">
                <span className="release-kicker">
                  IDIOT CITY / DEPARTMENT OF DOING NOTHING
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
                      ? 'View your City Permit'
                      : 'See the final quest'}
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
                        ? 'Claim your City Permit'
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

                    <input aria-label="Reduce UI animations"
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

                    <input aria-label="Compact HUD"
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

                    <input aria-label="Hide minimap"
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
                    A free browser comedy sandbox
                    being built for multiplayer.
                    This build runs locally; online
                    sessions are not connected yet.
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
                        Menu / local controls locked
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
                LOCAL BUILD · BROWSER SAVE
              </span>

              <span>
                ESC / P TO CLOSE
              </span>
            </footer>
        </GameDialog>
      )}
    </>,
    mount
  );
}
