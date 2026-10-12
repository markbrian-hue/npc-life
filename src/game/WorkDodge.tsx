
import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { playGameSound } from './gameAudio';

import {
  BEST_KEY,
  ROUNDS_KEY,
  GRID_SIZE,
  GAME_SECONDS,
  chase,
  readScore,
  sameCell,
  scoreRank,
  spawnCoffee,
  type Cell,
} from './alpha9';

type Board = {
  mode: 'ready' | 'playing' | 'over';
  player: Cell;
  bosses: Cell[];
  coffee: Cell;
  score: number;
  seconds: number;
  message: string;
};

function newBoard(): Board {
  const player = { x: 3, y: 3 };
  const bosses = [{ x: 0, y: 0 }];

  return {
    mode: 'ready',
    player,
    bosses,
    coffee: spawnCoffee([
      player,
      ...bosses,
    ]),
    score: 0,
    seconds: GAME_SECONDS,
    message:
      'Collect coffee. Avoid the managers. This is your career now.',
  };
}

type Props = {
  onClose: () => void;
};

export function WorkDodge({ onClose }: Props) {
  const [board, setBoard] = useState<Board>(
    newBoard
  );

  const boardRef = useRef(board);

  const [best, setBest] = useState(() =>
    readScore(BEST_KEY)
  );

  const [rounds, setRounds] = useState(() =>
    readScore(ROUNDS_KEY)
  );

  const bestRef = useRef(best);
  const roundsRef = useRef(rounds);
  const lastMove = useRef(0);

  const commit = (next: Board) => {
    boardRef.current = next;
    setBoard(next);
  };

  const end = (
    current: Board,
    message: string
  ) => {
    if (current.mode !== 'playing') return;

    const final = {
      ...current,
      mode: 'over' as const,
      message,
    };

    commit(final);

    if (current.score > bestRef.current) {
      bestRef.current = current.score;
      setBest(current.score);

      try {
        localStorage.setItem(
          BEST_KEY,
          String(current.score)
        );
      } catch {
        // Disabled storage.
      }
    }

    const count = roundsRef.current + 1;
    roundsRef.current = count;
    setRounds(count);

    try {
      localStorage.setItem(
        ROUNDS_KEY,
        String(count)
      );
    } catch {
      // Disabled storage.
    }

    playGameSound(
      current.score >= 30 ? 'job' : 'error'
    );
  };

  const start = () => {
    lastMove.current = 0;

    commit({
      ...newBoard(),
      mode: 'playing',
    });

    playGameSound('start');
  };

  const move = (dx: number, dy: number) => {
    const now = performance.now();

    if (
      now - lastMove.current < 85
    ) {
      return;
    }

    const current = boardRef.current;

    if (current.mode !== 'playing') return;

    lastMove.current = now;

    const nextPlayer = {
      x: Math.max(
        0,
        Math.min(
          GRID_SIZE - 1,
          current.player.x + dx
        )
      ),
      y: Math.max(
        0,
        Math.min(
          GRID_SIZE - 1,
          current.player.y + dy
        )
      ),
    };

    if (
      sameCell(nextPlayer, current.player)
    ) {
      return;
    }

    if (
      current.bosses.some((boss) =>
        sameCell(boss, nextPlayer)
      )
    ) {
      end(
        {
          ...current,
          player: nextPlayer,
        },
        'A manager caught you doing something productive. You were fired.'
      );
      return;
    }

    const foundCoffee = sameCell(
      nextPlayer,
      current.coffee
    );

    const nextScore =
      current.score +
      (foundCoffee ? 10 : 0);

    let bosses = current.bosses;

    // Increase difficulty after four coffees.
    if (
      nextScore >= 40 &&
      bosses.length === 1
    ) {
      bosses = [
        ...bosses,
        { x: 6, y: 6 },
      ];

      if (
        sameCell(nextPlayer, bosses[1])
      ) {
        bosses = [
          bosses[0],
          { x: 6, y: 0 },
        ];
      }
    }

    const coffee = foundCoffee
      ? spawnCoffee([
          nextPlayer,
          ...bosses,
        ])
      : current.coffee;

    commit({
      ...current,
      player: nextPlayer,
      bosses,
      coffee,
      score: nextScore,
    });

    if (foundCoffee) {
      playGameSound('coin');
    }
  };

  // Prevent WASD from moving the 3D player
  // while this minigame is open.
  useEffect(() => {
    window.dispatchEvent(
      new Event('blur')
    );

    const keys: Record<
      string,
      [number, number]
    > = {
      KeyW: [0, -1],
      ArrowUp: [0, -1],
      KeyS: [0, 1],
      ArrowDown: [0, 1],
      KeyA: [-1, 0],
      ArrowLeft: [-1, 0],
      KeyD: [1, 0],
      ArrowRight: [1, 0],
    };

    const suppressed = new Set([
      ...Object.keys(keys),
      'Space',
      'KeyE',
      'KeyF',
      'KeyI',
      'KeyJ',
      'KeyK',
      'KeyB',
      'ShiftLeft',
      'ShiftRight',
    ]);

    const onKey = (
      event: KeyboardEvent
    ) => {
      if (event.code === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        onClose();
        return;
      }

      if (!suppressed.has(event.code)) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      if (
        !event.repeat &&
        keys[event.code]
      ) {
        move(...keys[event.code]);
      }
    };

    const onUp = (
      event: KeyboardEvent
    ) => {
      if (
        suppressed.has(event.code)
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener(
      'keydown',
      onKey,
      true
    );

    window.addEventListener(
      'keyup',
      onUp,
      true
    );

    return () => {
      window.removeEventListener(
        'keydown',
        onKey,
        true
      );

      window.removeEventListener(
        'keyup',
        onUp,
        true
      );
    };
  }, []);

  // Countdown timer.
  useEffect(() => {
    const timer = window.setInterval(
      () => {
        const current = boardRef.current;

        if (current.mode !== 'playing') {
          return;
        }

        if (current.seconds <= 1) {
          end(
            {
              ...current,
              seconds: 0,
            },
            'Shift over! You dodged work for 30 whole seconds.'
          );
        } else {
          commit({
            ...current,
            seconds:
              current.seconds - 1,
          });
        }
      },
      1000
    );

    return () =>
      window.clearInterval(timer);
  }, []);

  // Managers chase the player.
  useEffect(() => {
    const timer = window.setInterval(
      () => {
        const current = boardRef.current;

        if (current.mode !== 'playing') {
          return;
        }

        const nextBosses: Cell[] = [];

        for (const boss of current.bosses) {
          nextBosses.push(
            chase(
              boss,
              current.player,
              nextBosses
            )
          );
        }

        if (
          nextBosses.some((boss) =>
            sameCell(
              boss,
              current.player
            )
          )
        ) {
          end(
            {
              ...current,
              bosses: nextBosses,
            },
            'YOUR BOSS FOUND YOU. Apparently coffee is not a job.'
          );
        } else {
          commit({
            ...current,
            bosses: nextBosses,
          });
        }
      },
      board.score >= 60 ? 690 : 970
    );

    return () =>
      window.clearInterval(timer);
  }, [board.score >= 60]);

  return (
    <div
      className="alpha9-backdrop"
      onMouseDown={onClose}
    >
      <section
        className="alpha9-modal alpha9-game"
        role="dialog"
        aria-modal="true"
        aria-label="Unemployment Simulator"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="alpha9-modal-head">
          <div>
            <span className="alpha9-eyebrow">
              IDIOT CITY · POCKET GAME
            </span>

            <h2>
              💼 UNEMPLOYMENT SIMULATOR
            </h2>

            <p>
              Steal coffee ☕. Avoid managers 💼.
              Survive the shift.
            </p>
          </div>

          <button
            type="button"
            className="alpha9-icon-button"
            onClick={onClose}
            aria-label="Close minigame"
          >
            ×
          </button>
        </div>

        <div className="alpha9-stats">
          <span>
            SCORE <strong>{board.score}</strong>
          </span>

          <span>
            TIME <strong>{board.seconds}s</strong>
          </span>

          <span>
            BEST{' '}
            <strong>
              {Math.max(best, board.score)}
            </strong>
          </span>
        </div>

        <div
          className="alpha9-grid"
          role="grid"
          aria-label="Seven by seven survival arena"
        >
          {Array.from(
            {
              length:
                GRID_SIZE * GRID_SIZE,
            },
            (_, index) => {
              const pos = {
                x: index % GRID_SIZE,
                y: Math.floor(
                  index / GRID_SIZE
                ),
              };

              const playerHere =
                sameCell(
                  board.player,
                  pos
                );

              const bossHere =
                board.bosses.some((boss) =>
                  sameCell(boss, pos)
                );

              const coffeeHere =
                sameCell(
                  board.coffee,
                  pos
                );

              return (
                <div
                  key={index}
                  role="gridcell"
                  className={`alpha9-tile ${
                    playerHere
                      ? 'is-player'
                      : ''
                  } ${
                    bossHere
                      ? 'is-boss'
                      : ''
                  }`}
                >
                  {playerHere
                    ? '🧍'
                    : bossHere
                      ? '💼'
                      : coffeeHere
                        ? '☕'
                        : ''}
                </div>
              );
            }
          )}
        </div>

        <div className="alpha9-game-bottom">
          <p aria-live="polite">
            {board.mode === 'ready'
              ? 'Use WASD or arrows. The bosses will chase you.'
              : board.mode === 'playing'
                ? 'KEEP MOVING! Managers are tracking you.'
                : board.message}
          </p>

          {board.mode !== 'playing' && (
            <button
              type="button"
              className="alpha9-primary"
              onClick={start}
            >
              {board.mode === 'over'
                ? 'Play again'
                : 'Start 30-second shift'}
            </button>
          )}
        </div>

        <div
          className="alpha9-touch-controls"
          aria-label="Touch movement controls"
        >
          <button
            type="button"
            aria-label="Move left"
            disabled={board.mode !== 'playing'}
            onClick={() => move(-1, 0)}
          >
            ←
          </button>

          <button
            type="button"
            aria-label="Move up"
            disabled={board.mode !== 'playing'}
            onClick={() => move(0, -1)}
          >
            ↑
          </button>

          <button
            type="button"
            aria-label="Move down"
            disabled={board.mode !== 'playing'}
            onClick={() => move(0, 1)}
          >
            ↓
          </button>

          <button
            type="button"
            aria-label="Move right"
            disabled={board.mode !== 'playing'}
            onClick={() => move(1, 0)}
          >
            →
          </button>
        </div>

        <div className="alpha9-record">
          🏅 {scoreRank(Math.max(best, board.score))}
          {' · '}
          {rounds} completed rounds
          {' · '}
          Scores are saved in this browser.
        </div>
      </section>
    </div>
  );
}
