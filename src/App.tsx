
import { Canvas } from '@react-three/fiber';
import { useCallback, useEffect, useState } from 'react';
import { City } from './game/City';
import { CityActivities } from './game/CityActivities';
import {
  CityExtras,
  CITIZEN_POSITION,
  SHOP_POSITION,
} from './game/CityExtras';
import {
  Player,
  type CityEvent,
  type PlayerLocation,
} from './game/Player';
import {
  DISCOVERIES,
  DISCOVERY_REWARD,
  GRASS_REWARD,
  GRASS_SPOTS,
  CITIZEN_LINES,
  randomLine,
  type Job,
} from './game/interactions';
import { playGameSound } from './game/gameAudio';
import { distance2D, GARY, PIGEONS } from './game/world';

const COIN_KEY = 'npc-life:coins-v1';
const INVENTORY_KEY = 'npc-life:inventory-v1';
const EQUIPPED_KEY = 'npc-life:equipped-v1';
const JOBS_KEY = 'npc-life:jobs-v1';
const DISCOVERIES_KEY = 'npc-life:discoveries-v1';

const SHOP_ITEMS = [
  {
    id: 'cone',
    name: 'Traffic Cone Hat',
    description: 'Your head is now road infrastructure.',
    price: 60,
    emoji: '🚧',
  },
  {
    id: 'halo',
    name: 'Suspicious Halo',
    description: 'Looks angelic. Means absolutely nothing.',
    price: 125,
    emoji: '😇',
  },
  {
    id: 'crown',
    name: 'Cardboard Royalty',
    description: 'For people with imaginary kingdoms.',
    price: 200,
    emoji: '👑',
  },
];

function loadNumber(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    const value = raw === null ? 0 : Number(raw);

    return Number.isFinite(value) && value >= 0
      ? Math.floor(value)
      : 0;
  } catch {
    return 0;
  }
}

function loadText(
  key: string,
  fallback: string
): string {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function loadList(key: string): string[] {
  try {
    const raw: unknown = JSON.parse(
      localStorage.getItem(key) || '[]'
    );

    return Array.isArray(raw)
      ? raw.filter(
          (item): item is string =>
            typeof item === 'string'
        )
      : [];
  } catch {
    return [];
  }
}

function loadInventory(): string[] {
  return loadList(INVENTORY_KEY).filter((id) =>
    SHOP_ITEMS.some((item) => item.id === id)
  );
}

type Nearby =
  | { kind: 'gary'; label: string }
  | { kind: 'shop'; label: string }
  | { kind: 'citizen'; label: string }
  | { kind: 'pigeon'; index: number; label: string }
  | { kind: 'grass'; id: string; label: string }
  | { kind: 'discovery'; id: string; label: string };

function getNearby(
  player: PlayerLocation,
  job: Job,
  caught: number[],
  touched: string[]
): Nearby | null {
  const candidates: {
    x: number;
    z: number;
    range: number;
    target: Nearby;
    priority: number;
  }[] = [
    {
      ...GARY,
      range: 3,
      target: {
        kind: 'gary',
        label: 'Talk to Gary',
      },
      priority: 0,
    },
    {
      ...SHOP_POSITION,
      range: 3,
      target: {
        kind: 'shop',
        label: 'Browse the Stupid Shop',
      },
      priority: 0,
    },
    {
      ...CITIZEN_POSITION,
      range: 3,
      target: {
        kind: 'citizen',
        label: 'Talk to Marty',
      },
      priority: 0,
    },
  ];

  if (job === 'pigeon') {
    PIGEONS.forEach((point, index) => {
      if (!caught.includes(index)) {
        candidates.push({
          ...point,
          range: 2.5,
          target: {
            kind: 'pigeon',
            index,
            label: 'Catch suspicious pigeon',
          },
          priority: 0,
        });
      }
    });
  }

  if (job === 'grass') {
    GRASS_SPOTS.forEach((spot) => {
      if (!touched.includes(spot.id)) {
        candidates.push({
          ...spot,
          range: 2.25,
          target: {
            kind: 'grass',
            id: spot.id,
            label: 'Touch suspicious grass',
          },
          priority: 0,
        });
      }
    });
  }

  DISCOVERIES.forEach((place) =>
    candidates.push({
      x: place.x,
      z: place.z,
      range: place.range,
      target: {
        kind: 'discovery',
        id: place.id,
        label: place.label,
      },
      priority: 1,
    })
  );

  const valid = candidates
    .map((candidate) => ({
      ...candidate,
      distance: distance2D(
        player.x,
        player.z,
        candidate.x,
        candidate.z
      ),
    }))
    .filter(
      (candidate) =>
        candidate.distance < candidate.range
    )
    .sort(
      (a, b) =>
        a.priority - b.priority ||
        a.distance - b.distance
    );

  return valid[0]?.target || null;
}

export default function App() {
  const [coins, setCoins] = useState(() =>
    loadNumber(COIN_KEY)
  );

  const [inventory, setInventory] =
    useState<string[]>(loadInventory);

  const [equipped, setEquipped] = useState(() =>
    loadText(EQUIPPED_KEY, 'none')
  );

  const [jobsDone, setJobsDone] = useState(() =>
    loadNumber(JOBS_KEY)
  );

  const [discovered, setDiscovered] =
    useState<string[]>(() =>
      loadList(DISCOVERIES_KEY).filter((id) =>
        DISCOVERIES.some(
          (place) => place.id === id
        )
      )
    );

  const [player, setPlayer] =
    useState<PlayerLocation>({
      x: 0,
      z: 0,
    });

  const [job, setJob] = useState<Job>('none');
  const [caught, setCaught] = useState<number[]>([]);
  const [touched, setTouched] = useState<string[]>([]);

  const [showHelp, setShowHelp] = useState(true);
  const [shopOpen, setShopOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [dialogText, setDialogText] = useState(
    randomLine(CITIZEN_LINES)
  );

  const [emote, setEmote] = useState(false);

  const [cityEvent, setCityEvent] =
    useState<CityEvent>('none');

  const [toast, setToast] = useState(
    'Find Gary (orange shirt) and press E to get a job.'
  );

  // Existing save-data keys are preserved.

  useEffect(() => {
    try {
      localStorage.setItem(COIN_KEY, String(coins));
    } catch {
      // Storage may be disabled.
    }
  }, [coins]);

  useEffect(() => {
    try {
      localStorage.setItem(
        INVENTORY_KEY,
        JSON.stringify(inventory)
      );
    } catch {
      // Storage may be disabled.
    }
  }, [inventory]);

  useEffect(() => {
    try {
      localStorage.setItem(EQUIPPED_KEY, equipped);
    } catch {
      // Storage may be disabled.
    }
  }, [equipped]);

  useEffect(() => {
    try {
      localStorage.setItem(
        JOBS_KEY,
        String(jobsDone)
      );
    } catch {
      // Storage may be disabled.
    }
  }, [jobsDone]);

  useEffect(() => {
    try {
      localStorage.setItem(
        DISCOVERIES_KEY,
        JSON.stringify(discovered)
      );
    } catch {
      // Storage may be disabled.
    }
  }, [discovered]);

  // Existing city events, now with sounds.

  useEffect(() => {
    let count = 0;

    let ending:
      | ReturnType<typeof setTimeout>
      | undefined;

    const startEvent = () => {
      count += 1;

      const next: CityEvent =
        count % 2
          ? 'low-gravity'
          : 'duck-invasion';

      setCityEvent(next);

      setToast(
        next === 'low-gravity'
          ? 'CITY ALERT: Gravity has called in sick. Try jumping!'
          : 'CITY ALERT: A very large duck has entered the city.'
      );

      playGameSound('event');

      if (ending) clearTimeout(ending);

      ending = setTimeout(
        () => setCityEvent('none'),
        18000
      );
    };

    const first = setTimeout(startEvent, 35000);
    const cycle = setInterval(startEvent, 80000);

    return () => {
      clearTimeout(first);
      clearInterval(cycle);

      if (ending) clearTimeout(ending);
    };
  }, []);

  const onMove = useCallback(
    (position: PlayerLocation) => {
      setPlayer(position);
    },
    []
  );

  const nearby = getNearby(
    player,
    job,
    caught,
    touched
  );

  // Central interaction handler.

  const interact = useCallback(() => {
    if (!nearby || shopOpen || dialogOpen) return;

    if (nearby.kind === 'shop') {
      playGameSound('interact');
      setShopOpen(true);
      return;
    }

    if (nearby.kind === 'citizen') {
      playGameSound('talk');
      setDialogText(randomLine(CITIZEN_LINES));
      setDialogOpen(true);
      return;
    }

    if (nearby.kind === 'gary') {
      if (job !== 'none') {
        playGameSound('talk');

        setToast(
          job === 'pigeon'
            ? 'Gary: Stop standing here. The pigeons are literally right there.'
            : 'Gary: You are touching grass instead of earning a salary? Respect.'
        );
      } else {
        playGameSound('interact');
        setCaught([]);
        setJob('pigeon');

        setToast(
          'Gary: These three pigeons owe me money. Catch them. Reward: 75 Coins.'
        );
      }

      return;
    }

    // Pigeon Debt collection.

    if (nearby.kind === 'pigeon') {
      const next = [...caught, nearby.index];
      setCaught(next);

      if (next.length === PIGEONS.length) {
        setCoins((value) => value + 75);
        setJobsDone((value) => value + 1);
        setJob('none');

        playGameSound('job');

        setToast(
          'JOB COMPLETE: +75 Coins! Gary refuses to explain pigeon debt.'
        );
      } else {
        playGameSound('coin');

        setToast(
          `Pigeon secured (${next.length}/${PIGEONS.length}). It seems offended.`
        );
      }

      return;
    }

    // New Grass Toucher job.

    if (nearby.kind === 'grass') {
      const next = [...touched, nearby.id];
      setTouched(next);

      if (next.length === GRASS_SPOTS.length) {
        setCoins(
          (value) => value + GRASS_REWARD
        );

        setJobsDone((value) => value + 1);
        setJob('none');

        playGameSound('job');

        setToast(
          `CERTIFIED GRASS TOUCHER! +${GRASS_REWARD} Coins. You have officially gone outside.`
        );
      } else {
        playGameSound('coin');

        setToast(
          `Grass thoroughly touched (${next.length}/${GRASS_SPOTS.length}). Strange career choice.`
        );
      }

      return;
    }

    // Street discoveries: one-time coin rewards.

    const place = DISCOVERIES.find(
      (entry) => entry.id === nearby.id
    );

    if (!place) return;

    const firstTime =
      !discovered.includes(place.id);

    if (firstTime) {
      setDiscovered((items) => [
        ...items,
        place.id,
      ]);

      setCoins(
        (value) => value + DISCOVERY_REWARD
      );

      playGameSound('coin');
    } else {
      playGameSound('interact');
    }

    setToast(
      `${randomLine(place.lines)}${
        firstTime
          ? ` DISCOVERED! +${DISCOVERY_REWARD} Coins.`
          : ''
      }`
    );
  }, [
    nearby,
    shopOpen,
    dialogOpen,
    job,
    caught,
    touched,
    discovered,
  ]);

  function beginGrassJob() {
    if (job !== 'none') {
      playGameSound('error');

      setDialogText(
        'Finish your current job first. We only allow one useless career at a time.'
      );

      return;
    }

    setTouched([]);
    setJob('grass');
    setDialogOpen(false);

    setToast(
      'Marty: Find and touch three suspicious grass patches. Reward: 45 Coins.'
    );

    playGameSound('interact');
  }

  // Existing cosmetic shop.

  function buyOrEquip(
    item: (typeof SHOP_ITEMS)[number]
  ) {
    if (inventory.includes(item.id)) {
      setEquipped(
        (old) =>
          old === item.id ? 'none' : item.id
      );

      setToast(
        equipped === item.id
          ? `${item.name} unequipped.`
          : `${item.name} equipped!`
      );

      playGameSound('interact');
      return;
    }

    if (coins < item.price) {
      setToast(
        `You need ${
          item.price - coins
        } more Coins. Return to your terrible job.`
      );

      playGameSound('error');
      return;
    }

    setCoins(
      (old) => old - item.price
    );

    setInventory((old) => [
      ...old,
      item.id,
    ]);

    setEquipped(item.id);

    setToast(
      `Purchased ${item.name}! Your financial decisions are questionable.`
    );

    playGameSound('coin');
  }

  const wave = useCallback(() => {
    setEmote(true);
    playGameSound('wave');

    window.setTimeout(
      () => setEmote(false),
      1600
    );
  }, []);

  // Keyboard interaction.

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.repeat) return;

      if (event.code === 'Escape') {
        setShopOpen(false);
        setDialogOpen(false);
        return;
      }

      if (shopOpen || dialogOpen) return;

      if (event.code === 'KeyE') interact();

      if (event.code === 'KeyH') {
        setShowHelp(
          (value) => !value
        );
      }

      if (event.code === 'KeyB') wave();
    };

    window.addEventListener('keydown', key);

    return () => {
      window.removeEventListener('keydown', key);
    };
  }, [
    interact,
    shopOpen,
    dialogOpen,
    wave,
  ]);

  const objective =
    job === 'pigeon'
      ? `Catch the pigeons: ${caught.length} / ${PIGEONS.length}`
      : job === 'grass'
        ? `Touch the grass patches: ${touched.length} / ${GRASS_SPOTS.length}`
        : 'Talk to Gary or Marty to get a ridiculous job';

  const progress =
    job === 'pigeon'
      ? caught.length / PIGEONS.length
      : job === 'grass'
        ? touched.length / GRASS_SPOTS.length
        : 0;

  const reward =
    job === 'grass'
      ? GRASS_REWARD
      : 75;

  return (
    <div className="game-shell">
      {/* Existing 3D city plus new activity locations */}

      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{
          position: [9, 10, 13],
          fov: 60,
          near: 0.1,
          far: 170,
        }}
        gl={{ antialias: true }}
      >
        <City caught={caught} />

        <CityActivities touched={touched} />

        <CityExtras
          cityEvent={cityEvent}
          player={player}
        />

        <Player
          onMove={onMove}
          equipped={equipped}
          emote={emote}
          cityEvent={cityEvent}
          inputLocked={shopOpen || dialogOpen}
        />
      </Canvas>

      {/* Header */}

      <header className="game-header">
        <div className="branding">
          <div className="brand-logo">
            N<span>!</span>
          </div>

          <div>
            <h1>NPC LIFE</h1>
            <p>
              THE CITY OF IDIOTS{' '}
              <span>•</span> ALPHA 0.4C
            </p>
          </div>
        </div>

        <div className="economy">
          <span className="coin-icon">◆</span>

          <div>
            <span>
              YOUR ENTIRE FORTUNE
            </span>

            <strong>
              {coins.toLocaleString()}
              <small> COINS</small>
            </strong>
          </div>
        </div>
      </header>

      {/* Quest panel */}

      <section
        className="quest-panel"
        aria-live="polite"
      >
        <span className="panel-eyebrow">
          CURRENT LIFE PURPOSE
        </span>

        <h2>
          {job === 'pigeon'
            ? 'Operation: Pigeon Debt'
            : job === 'grass'
              ? 'Certified Grass Toucher'
              : 'Certified Unemployed'}
        </h2>

        <p>{objective}</p>

        <div className="quest-progress">
          <span
            style={{
              width: `${progress * 100}%`,
            }}
          />
        </div>

        <div className="quest-footer">
          <span>JOB REWARD</span>
          <strong>+{reward} ◆</strong>
        </div>

        <div className="npc-discovery">
          CITY FINDS: {discovered.length}/
          {DISCOVERIES.length}
        </div>
      </section>

      {/* Existing events */}

      {cityEvent !== 'none' && (
        <div
          className="event-banner"
          role="status"
        >
          ⚠ CITY EVENT:{' '}
          {cityEvent === 'low-gravity'
            ? 'LOW GRAVITY'
            : 'GIANT DUCK INVASION'}
        </div>
      )}

      {/* Minimap */}

      <div
        className="minimap"
        aria-label="Map showing your position"
      >
        <div className="map-label">
          IDIOT CITY <span>LIVE</span>
        </div>

        <div className="mini-world">
          <div className="mini-road mini-road-x" />
          <div className="mini-road mini-road-y" />
          <div className="mini-plaza" />

          <div className="mini-building a" />
          <div className="mini-building b" />
          <div className="mini-building c" />
          <div className="mini-building d" />

          <div
            className="mini-pin shop-pin"
            title="Shop"
          >
            S
          </div>

          <div
            className="mini-pin citizen-pin"
            title="Marty"
          >
            ?
          </div>

          <div
            className="mini-player"
            style={{
              left: `${
                Math.max(
                  2,
                  Math.min(
                    98,
                    ((player.x + 42) / 84) * 100
                  )
                )
              }%`,
              top: `${
                Math.max(
                  2,
                  Math.min(
                    98,
                    ((player.z + 42) / 84) * 100
                  )
                )
              }%`,
            }}
          />
        </div>

        <span className="map-coords">
          X {Math.round(player.x)} • Z{' '}
          {Math.round(player.z)}
        </span>
      </div>

      {/* Messages and interaction prompts */}

      <div
        className="center-message"
        aria-live="polite"
      >
        {toast}
      </div>

      {nearby && !shopOpen && !dialogOpen && (
        <button
          className="interaction"
          onClick={interact}
        >
          <span className="keycap">E</span>
          {nearby.label}
        </button>
      )}

      {/* Bottom controls */}

      <div className="bottom-bar">
        <button
          className="help-toggle"
          onClick={() =>
            setShowHelp(
              (value) => !value
            )
          }
        >
          ⓘ Controls <span>H</span>
        </button>

        <span className="jobs-counter">
          JOBS COMPLETED{' '}
          <strong>{jobsDone}</strong>
        </span>

        <button
          className="emote-button"
          onClick={wave}
        >
          👋 Wave <span>B</span>
        </button>
      </div>

      {/* Help panel */}

      {showHelp && (
        <section className="controls-panel">
          <div className="controls-heading">
            <strong>HOW TO BE AN NPC</strong>

            <button
              aria-label="Close help"
              onClick={() =>
                setShowHelp(false)
              }
            >
              ×
            </button>
          </div>

          <p>
            <kbd>W</kbd>
            <kbd>A</kbd>
            <kbd>S</kbd>
            <kbd>D</kbd> Move relative to camera
          </p>

          <p>
            <kbd>SHIFT</kbd> Run from responsibilities
          </p>

          <p>
            <kbd>SPACE</kbd> Jump
          </p>

          <p>
            <kbd>E</kbd> Interact
          </p>

          <p>
            <kbd>B</kbd> Awkward wave
          </p>

          <p>
            <kbd>H</kbd> Toggle help
          </p>

          <p>
            <kbd>DRAG</kbd> Rotate camera
          </p>

          <p>
            <kbd>SCROLL</kbd> Zoom camera
          </p>

          <p className="muted">
            Talk to Gary for pigeon debt.
            Marty (purple shirt) has another
            questionable job. Visit street
            props to earn one-time discovery coins.
          </p>
        </section>
      )}

      {/* New Marty dialogue */}

      {dialogOpen && (
        <div
          className="npc-dialog-backdrop"
          onClick={() =>
            setDialogOpen(false)
          }
        >
          <section
            className="npc-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Talk to Marty"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <span className="npc-dialog-label">
              LOCAL CITIZEN • VERY EMPLOYED
            </span>

            <h2>Marty, Grass Inspector</h2>

            <p>{dialogText}</p>

            <div className="npc-dialog-actions">
              <button onClick={beginGrassJob}>
                Give me a job (+45 ◆)
              </button>

              <button
                className="secondary"
                onClick={() => {
                  setDialogText(
                    randomLine(CITIZEN_LINES)
                  );

                  playGameSound('talk');
                }}
              >
                Say something stupid
              </button>

              <button
                className="secondary"
                onClick={() =>
                  setDialogOpen(false)
                }
              >
                Leave
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Existing cosmetic shop */}

      {shopOpen && (
        <div
          className="shop-backdrop"
          onClick={() =>
            setShopOpen(false)
          }
        >
          <section
            className="shop-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Stupid Shop"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="shop-heading">
              <div>
                <span className="panel-eyebrow">
                  QUESTIONABLE PURCHASES
                </span>

                <h2>THE STUPID SHOP</h2>

                <p>
                  Everything is overpriced.
                  Nothing improves your life.
                </p>
              </div>

              <button
                onClick={() =>
                  setShopOpen(false)
                }
                aria-label="Close shop"
              >
                ×
              </button>
            </div>

            <div className="shop-balance">
              YOUR WALLET

              <strong>
                ◆ {coins.toLocaleString()}
              </strong>
            </div>

            <div className="shop-items">
              {SHOP_ITEMS.map((item) => {
                const owned =
                  inventory.includes(item.id);

                const wearing =
                  equipped === item.id;

                return (
                  <div
                    className="shop-item"
                    key={item.id}
                  >
                    <div className="shop-emoji">
                      {item.emoji}
                    </div>

                    <div className="shop-details">
                      <strong>
                        {item.name}
                      </strong>

                      <span>
                        {item.description}
                      </span>

                      <small>
                        {owned
                          ? 'OWNED'
                          : `◆ ${item.price}`}
                      </small>
                    </div>

                    <button
                      onClick={() =>
                        buyOrEquip(item)
                      }
                      disabled={
                        !owned &&
                        coins < item.price
                      }
                    >
                      {wearing
                        ? 'Remove'
                        : owned
                          ? 'Wear'
                          : 'Buy'}
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="shop-note">
              Complete funny jobs to earn
              money. Press ESC to leave.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
