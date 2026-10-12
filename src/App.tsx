import { Canvas } from '@react-three/fiber';
import { useCallback, useEffect, useState } from 'react';
import { City } from './game/City';
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
import { distance2D, GARY, PIGEONS } from './game/world';

const COIN_KEY = 'npc-life:coins-v1';
const INVENTORY_KEY = 'npc-life:inventory-v1';
const EQUIPPED_KEY = 'npc-life:equipped-v1';
const JOBS_KEY = 'npc-life:jobs-v1';

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

    if (raw === null) return 0;

    const value = Number(raw);

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

function loadInventory(): string[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(INVENTORY_KEY) || '[]'
    );

    return Array.isArray(value)
      ? value.filter(
          (item): item is string =>
            typeof item === 'string' &&
            SHOP_ITEMS.some(
              (shopItem) => shopItem.id === item
            )
        )
      : [];
  } catch {
    return [];
  }
}

type Nearby =
  | { kind: 'gary' }
  | { kind: 'pigeon'; index: number }
  | { kind: 'shop' }
  | { kind: 'citizen' }
  | null;

const NPC_QUOTES = [
  'I have been standing here since the developers spawned me.',
  'Do you think the sky is just a giant blue texture?',
  'My financial advisor is a pigeon. He is unavailable.',
  'I once worked for five minutes. Never again.',
  'This city has six stores and zero functioning hospitals.',
];

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

  const [player, setPlayer] = useState<PlayerLocation>({
    x: 0,
    z: 0,
  });

  const [working, setWorking] = useState(false);
  const [caught, setCaught] = useState<number[]>([]);
  const [showHelp, setShowHelp] = useState(true);
  const [shopOpen, setShopOpen] = useState(false);
  const [emote, setEmote] = useState(false);

  const [cityEvent, setCityEvent] =
    useState<CityEvent>('none');

  const [toast, setToast] = useState(
    'Find Gary (orange shirt) and press E to get a job.'
  );

  // Preserve Alpha 0.2 saved game data.

  useEffect(() => {
    try {
      localStorage.setItem(COIN_KEY, String(coins));
    } catch {
      // Storage can be disabled.
    }
  }, [coins]);

  useEffect(() => {
    try {
      localStorage.setItem(
        INVENTORY_KEY,
        JSON.stringify(inventory)
      );
    } catch {
      // Storage can be disabled.
    }
  }, [inventory]);

  useEffect(() => {
    try {
      localStorage.setItem(EQUIPPED_KEY, equipped);
    } catch {
      // Storage can be disabled.
    }
  }, [equipped]);

  useEffect(() => {
    try {
      localStorage.setItem(
        JOBS_KEY,
        String(jobsDone)
      );
    } catch {
      // Storage can be disabled.
    }
  }, [jobsDone]);

  // Existing Alpha 0.2 random events.

  useEffect(() => {
    let count = 0;

    let end:
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

      if (end) clearTimeout(end);

      end = setTimeout(() => {
        setCityEvent('none');
      }, 18000);
    };

    const first = setTimeout(startEvent, 35000);
    const cycle = setInterval(startEvent, 80000);

    return () => {
      clearTimeout(first);
      clearInterval(cycle);

      if (end) clearTimeout(end);
    };
  }, []);

  const onMove = useCallback(
    (location: PlayerLocation) => {
      setPlayer(location);
    },
    []
  );

  // Find the nearest interaction.

  let nearby: Nearby = null;

  if (
    distance2D(
      player.x,
      player.z,
      GARY.x,
      GARY.z
    ) < 3
  ) {
    nearby = { kind: 'gary' };
  } else if (
    distance2D(
      player.x,
      player.z,
      SHOP_POSITION.x,
      SHOP_POSITION.z
    ) < 3
  ) {
    nearby = { kind: 'shop' };
  } else if (
    distance2D(
      player.x,
      player.z,
      CITIZEN_POSITION.x,
      CITIZEN_POSITION.z
    ) < 3
  ) {
    nearby = { kind: 'citizen' };
  } else if (working) {
    for (
      let index = 0;
      index < PIGEONS.length;
      index++
    ) {
      if (
        !caught.includes(index) &&
        distance2D(
          player.x,
          player.z,
          PIGEONS[index].x,
          PIGEONS[index].z
        ) < 2.5
      ) {
        nearby = {
          kind: 'pigeon',
          index,
        };

        break;
      }
    }
  }

  const interact = useCallback(() => {
    if (!nearby || shopOpen) return;

    if (nearby.kind === 'shop') {
      setShopOpen(true);
      return;
    }

    if (nearby.kind === 'citizen') {
      const quote =
        NPC_QUOTES[
          Math.floor(
            Math.random() * NPC_QUOTES.length
          )
        ];

      setToast(`Random Citizen: ${quote}`);
      return;
    }

    if (nearby.kind === 'gary') {
      if (working) {
        setToast(
          'Gary: Stop standing here. The pigeons are literally right there.'
        );
      } else {
        setCaught([]);
        setWorking(true);

        setToast(
          'Gary: These three pigeons owe me money. Catch them. Reward: 75 coins.'
        );
      }

      return;
    }

    const next = [...caught, nearby.index];
    setCaught(next);

    if (next.length === PIGEONS.length) {
      setCoins((old) => old + 75);
      setJobsDone((old) => old + 1);
      setWorking(false);

      setToast(
        'JOB COMPLETE: +75 coins! Gary still refuses to explain pigeon debt.'
      );
    } else {
      setToast(
        `Pigeon secured! (${next.length}/${PIGEONS.length}). It seems offended.`
      );
    }
  }, [nearby, working, caught, shopOpen]);

  // Buying and equipping existing cosmetics.

  const buyOrEquip = (
    item: (typeof SHOP_ITEMS)[number]
  ) => {
    if (inventory.includes(item.id)) {
      setEquipped((old) =>
        old === item.id ? 'none' : item.id
      );

      setToast(
        equipped === item.id
          ? `${item.name} unequipped.`
          : `${item.name} equipped. Looking ridiculous!`
      );

      return;
    }

    if (coins < item.price) {
      setToast(
        `You need ${
          item.price - coins
        } more coins. Return to your terrible job.`
      );

      return;
    }

    setCoins((old) => old - item.price);

    setInventory((old) => [
      ...old,
      item.id,
    ]);

    setEquipped(item.id);

    setToast(
      `Purchased ${item.name}! Your financial decisions are questionable.`
    );
  };

  // Existing interaction keyboard shortcuts.

  useEffect(() => {
    const onKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.repeat) return;

      if (event.code === 'Escape') {
        setShopOpen(false);
        return;
      }

      if (shopOpen) return;

      if (event.code === 'KeyE') {
        interact();
      }

      if (event.code === 'KeyH') {
        setShowHelp((old) => !old);
      }

      if (event.code === 'KeyB') {
        setEmote(true);

        setTimeout(() => {
          setEmote(false);
        }, 1600);
      }
    };

    window.addEventListener(
      'keydown',
      onKeyDown
    );

    return () => {
      window.removeEventListener(
        'keydown',
        onKeyDown
      );
    };
  }, [interact, shopOpen]);

  const objective = working
    ? `Catch the pigeons: ${caught.length} / ${PIGEONS.length}`
    : 'Talk to Gary to get a ridiculous job';

  const eventTitle =
    cityEvent === 'low-gravity'
      ? 'LOW GRAVITY'
      : 'GIANT DUCK INVASION';

  return (
    <div className="game-shell">
      {/* 3D WORLD */}

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

        <CityExtras cityEvent={cityEvent} />

        <Player
          onMove={onMove}
          equipped={equipped}
          emote={emote}
          cityEvent={cityEvent}
          inputLocked={shopOpen}
        />
      </Canvas>

      {/* HEADER */}

      <header className="game-header">
        <div className="branding">
          <div className="brand-logo">
            N<span>!</span>
          </div>

          <div>
            <h1>NPC LIFE</h1>

            <p>
              THE CITY OF IDIOTS{' '}
              <span>•</span> ALPHA 0.3A
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

      {/* QUEST TRACKER */}

      <section
        className="quest-panel"
        aria-live="polite"
      >
        <span className="panel-eyebrow">
          CURRENT LIFE PURPOSE
        </span>

        <h2>
          {working
            ? 'Operation: Pigeon Debt'
            : 'Certified Unemployed'}
        </h2>

        <p>{objective}</p>

        <div className="quest-progress">
          <span
            style={{
              width: `${
                working
                  ? (
                      caught.length /
                      PIGEONS.length
                    ) * 100
                  : 0
              }%`,
            }}
          />
        </div>

        <div className="quest-footer">
          <span>JOB REWARD</span>
          <strong>+75 ◆</strong>
        </div>
      </section>

      {/* RANDOM EVENTS */}

      {cityEvent !== 'none' && (
        <div
          className="event-banner"
          role="status"
        >
          ⚠ CITY EVENT: {eventTitle}
        </div>
      )}

      {/* MINIMAP */}

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
            title="Citizen"
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
                    (
                      (player.x + 42) /
                      84
                    ) * 100
                  )
                )
              }%`,
              top: `${
                Math.max(
                  2,
                  Math.min(
                    98,
                    (
                      (player.z + 42) /
                      84
                    ) * 100
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

      {/* GAME MESSAGES */}

      <div
        className="center-message"
        aria-live="polite"
      >
        {toast}
      </div>

      {/* INTERACTION PROMPT */}

      {nearby && !shopOpen && (
        <button
          className="interaction"
          onClick={interact}
        >
          <span className="keycap">
            E
          </span>

          {nearby.kind === 'gary'
            ? 'Talk to Gary'
            : nearby.kind === 'shop'
              ? 'Browse the Stupid Shop'
              : nearby.kind === 'citizen'
                ? 'Talk to Citizen'
                : 'Catch suspicious pigeon'}
        </button>
      )}

      {/* BOTTOM BUTTONS */}

      <div className="bottom-bar">
        <button
          className="help-toggle"
          onClick={() =>
            setShowHelp((old) => !old)
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
          onClick={() => {
            setEmote(true);

            setTimeout(() => {
              setEmote(false);
            }, 1600);
          }}
        >
          👋 Wave <span>B</span>
        </button>
      </div>

      {/* CONTROLS PANEL */}

      {showHelp && (
        <section className="controls-panel">
          <div className="controls-heading">
            <strong>
              HOW TO BE AN NPC
            </strong>

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
            <kbd>D</kbd>{' '}
            Move relative to camera
          </p>

          <p>
            <kbd>SHIFT</kbd>{' '}
            Run from responsibilities
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
            Earn coins with Gary, then visit
            the blue-shirt shopkeeper near
            the plaza. Coins and purchased
            cosmetics save locally.
          </p>
        </section>
      )}

      {/* STUPID SHOP */}

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

                <h2>
                  THE STUPID SHOP
                </h2>

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
              Complete Gary's pigeon job
              repeatedly to earn money.
              Press ESC to leave.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}