
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

import { ProgressionPanel } from './game/ProgressionPanel';
import { ArcadeKiosk, PigeonPanic } from './game/PigeonPanic';
import { DailyBoard } from './game/DailyBoard';

import { ReactiveCitizens } from './game/ReactiveCitizens';
import { CityEncounters } from './game/CityEncounters';

import {
  ARCADE_POSITION,
  DAILY_CHALLENGES,
  challengeProgress,
  currentDaily,
  loadDaily,
  loadReputation,
  reputationInfo,
  type ChallengeId,
} from './game/alpha6';

import {
  COSMETICS,
  ACHIEVEMENTS,
  isCosmetic,
  isShirt,
  shirtHex,
  cityRank,
  type CosmeticId,
  type ShirtColorId,
} from './game/progression';

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

// Preserve all previous localStorage keys.
const COIN_KEY = 'npc-life:coins-v1';
const INVENTORY_KEY = 'npc-life:inventory-v1';
const EQUIPPED_KEY = 'npc-life:equipped-v1';
const JOBS_KEY = 'npc-life:jobs-v1';
const DISCOVERIES_KEY = 'npc-life:discoveries-v1';
const SHIRT_KEY = 'npc-life:shirt-v1';
const QUEST_KEY = 'npc-life:active-quest-v1';

const DAILY_KEY = 'npc-life:daily-v1';
const REPUTATION_KEY = 'npc-life:reputation-v1';

type QuestState = {
  job: Job;
  caught: number[];
  touched: string[];
};

const emptyQuest = (): QuestState => ({
  job: 'none',
  caught: [],
  touched: [],
});

function readNumber(key: string) {
  try {
    const n = Number(localStorage.getItem(key) ?? '0');

    return Number.isFinite(n) && n >= 0
      ? Math.floor(n)
      : 0;
  } catch {
    return 0;
  }
}

function readString(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function readList(key: string): string[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(key) || '[]'
    );

    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (s): s is string =>
                typeof s === 'string'
            )
          ),
        ]
      : [];
  } catch {
    return [];
  }
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing or disabled storage.
  }
}

function readQuest(): QuestState {
  try {
    const data: unknown = JSON.parse(
      localStorage.getItem(QUEST_KEY) || 'null'
    );

    if (!data || typeof data !== 'object') {
      return emptyQuest();
    }

    const obj = data as Record<string, unknown>;

    if (
      obj.job !== 'pigeon' &&
      obj.job !== 'grass'
    ) {
      return emptyQuest();
    }

    const caught = Array.isArray(obj.caught)
      ? [
          ...new Set(
            obj.caught.filter(
              (n): n is number =>
                Number.isInteger(n) &&
                n >= 0 &&
                n < PIGEONS.length
            )
          ),
        ]
      : [];

    const touched = Array.isArray(obj.touched)
      ? [
          ...new Set(
            obj.touched.filter(
              (id): id is string =>
                typeof id === 'string' &&
                GRASS_SPOTS.some(
                  (p) => p.id === id
                )
            )
          ),
        ]
      : [];

    if (obj.job === 'pigeon') {
      return caught.length < PIGEONS.length
        ? {
            job: 'pigeon',
            caught,
            touched: [],
          }
        : emptyQuest();
    }

    return touched.length < GRASS_SPOTS.length
      ? {
          job: 'grass',
          caught: [],
          touched,
        }
      : emptyQuest();
  } catch {
    return emptyQuest();
  }
}

type Nearby =
  | { kind: 'gary'; label: string }
  | { kind: 'shop'; label: string }
  | { kind: 'citizen'; label: string }
  | {
      kind: 'pigeon';
      index: number;
      label: string;
    }
  | {
      kind: 'grass';
      id: string;
      label: string;
    }
  | {
      kind: 'discovery';
      id: string;
      label: string;
    }
  | { kind: 'arcade'; label: string };

function getNearby(
  player: PlayerLocation,
  quest: QuestState
): Nearby | null {
  const targets: {
    x: number;
    z: number;
    range: number;
    priority: number;
    target: Nearby;
  }[] = [
    {
      ...GARY,
      range: 3,
      priority: 0,
      target: {
        kind: 'gary',
        label: 'Talk to Gary',
      },
    },
    {
      ...SHOP_POSITION,
      range: 3,
      priority: 0,
      target: {
        kind: 'shop',
        label: 'Browse the Stupid Shop',
      },
    },
    {
      ...CITIZEN_POSITION,
      range: 3,
      priority: 0,
      target: {
        kind: 'citizen',
        label: 'Talk to Marty',
      },
    },
    {
      ...ARCADE_POSITION,
      range: 2.9,
      priority: 0,
      target: {
        kind: 'arcade',
        label: 'Play Pigeon Panic',
      },
    },
  ];

  if (quest.job === 'pigeon') {
    PIGEONS.forEach((p, index) => {
      if (!quest.caught.includes(index)) {
        targets.push({
          ...p,
          range: 2.5,
          priority: 0,
          target: {
            kind: 'pigeon',
            index,
            label: 'Catch suspicious pigeon',
          },
        });
      }
    });
  }

  if (quest.job === 'grass') {
    GRASS_SPOTS.forEach((p) => {
      if (!quest.touched.includes(p.id)) {
        targets.push({
          ...p,
          range: 2.25,
          priority: 0,
          target: {
            kind: 'grass',
            id: p.id,
            label: 'Touch suspicious grass',
          },
        });
      }
    });
  }

  DISCOVERIES.forEach((p) => {
    targets.push({
      x: p.x,
      z: p.z,
      range: p.range,
      priority: 1,
      target: {
        kind: 'discovery',
        id: p.id,
        label: p.label,
      },
    });
  });

  const possible = targets
    .map((t) => ({
      ...t,
      distance: distance2D(
        player.x,
        player.z,
        t.x,
        t.z
      ),
    }))
    .filter((t) => t.distance < t.range)
    .sort(
      (a, b) =>
        a.priority - b.priority ||
        a.distance - b.distance
    );

  return possible[0]?.target ?? null;
}

export default function App() {
  const [coins, setCoins] = useState(
    () => readNumber(COIN_KEY)
  );

  const [inventory, setInventory] = useState<string[]>(
    () => readList(INVENTORY_KEY).filter(isCosmetic)
  );

  const [equipped, setEquipped] = useState(() => {
    const id = readString(EQUIPPED_KEY, 'none');
    const owned = readList(INVENTORY_KEY);

    return isCosmetic(id) && owned.includes(id)
      ? id
      : 'none';
  });

  const [shirt, setShirt] = useState<ShirtColorId>(
    () => {
      const id = readString(
        SHIRT_KEY,
        'classic'
      );

      return isShirt(id) ? id : 'classic';
    }
  );

  const [jobsDone, setJobsDone] = useState(
    () => readNumber(JOBS_KEY)
  );

  const [discovered, setDiscovered] = useState<string[]>(
    () =>
      readList(DISCOVERIES_KEY).filter(
        (id) =>
          DISCOVERIES.some(
            (p) => p.id === id
          )
      )
  );

  const [quest, setQuest] =
    useState<QuestState>(readQuest);

  const [daily, setDaily] = useState(loadDaily);

  const [reputation, setReputation] = useState(
    () => loadReputation(readNumber(JOBS_KEY))
  );

  const [dailyOpen, setDailyOpen] = useState(false);
  const [arcadeOpen, setArcadeOpen] = useState(false);

  // New Alpha 0.7 dialog lock.
  const [encounterOpen, setEncounterOpen] = useState(false);

  const [player, setPlayer] = useState<PlayerLocation>({
    x: 0,
    z: 0,
  });

  const [showHelp, setShowHelp] = useState(true);
  const [shopOpen, setShopOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [profile, setProfile] = useState<
    'wardrobe' | 'achievements' | null
  >(null);

  const [dialogText, setDialogText] = useState(
    () => randomLine(CITIZEN_LINES)
  );

  const [emote, setEmote] = useState(false);
  const [cityEvent, setCityEvent] =
    useState<CityEvent>('none');

  const [toast, setToast] = useState(
    'Find Gary (orange shirt) or Marty (purple shirt) to get a ridiculous job.'
  );

  // Save existing progression without migrating or resetting it.

  useEffect(
    () => save(COIN_KEY, String(coins)),
    [coins]
  );

  useEffect(
    () =>
      save(
        INVENTORY_KEY,
        JSON.stringify(inventory)
      ),
    [inventory]
  );

  useEffect(
    () => save(EQUIPPED_KEY, equipped),
    [equipped]
  );

  useEffect(
    () => save(SHIRT_KEY, shirt),
    [shirt]
  );

  useEffect(
    () => save(JOBS_KEY, String(jobsDone)),
    [jobsDone]
  );

  useEffect(
    () =>
      save(
        DISCOVERIES_KEY,
        JSON.stringify(discovered)
      ),
    [discovered]
  );

  useEffect(
    () =>
      save(
        QUEST_KEY,
        JSON.stringify(quest)
      ),
    [quest]
  );

  useEffect(
    () =>
      save(
        DAILY_KEY,
        JSON.stringify(daily)
      ),
    [daily]
  );

  useEffect(
    () => save(REPUTATION_KEY, String(reputation)),
    [reputation]
  );

  // Daily reset while the tab remains open.

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDaily((state) => currentDaily(state));
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  // Existing random city events.

  useEffect(() => {
    let count = 0;
    let end: ReturnType<typeof setTimeout> | undefined;

    const start = () => {
      count++;

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

      if (end) clearTimeout(end);

      end = setTimeout(
        () => setCityEvent('none'),
        18000
      );
    };

    const first = setTimeout(start, 35000);
    const cycle = setInterval(start, 80000);

    return () => {
      clearTimeout(first);
      clearInterval(cycle);
      if (end) clearTimeout(end);
    };
  }, []);

  const onMove = useCallback(
    (position: PlayerLocation) => setPlayer(position),
    []
  );

  const nearby = getNearby(player, quest);

  const locked =
    shopOpen ||
    dialogOpen ||
    profile !== null ||
    dailyOpen ||
    arcadeOpen ||
    encounterOpen;

  const reputationTier = reputationInfo(reputation);

  function recordJob() {
    setReputation(
      (value) => value + 12
    );

    setDaily((state) => {
      const today = currentDaily(state);

      return {
        ...today,
        jobs: today.jobs + 1,
      };
    });
  }

  function arcadeFinished(won: boolean) {
    if (!won) {
      setToast(
        'PIGEON PANIC: The pigeons won. Try again.'
      );
      return;
    }

    const today = currentDaily(daily);
    const firstWin = today.arcadeWins === 0;

    setDaily({
      ...today,
      arcadeWins: today.arcadeWins + 1,
    });

    if (firstWin) {
      setCoins((value) => value + 20);
      setReputation((value) => value + 8);
    }

    setToast(
      firstWin
        ? 'PIGEON PANIC WIN! +20 Coins and +8 Reputation. Daily arcade reward claimed.'
        : 'PIGEON PANIC WIN! You already earned today’s arcade payout.'
    );
  }

  function claimChallenge(id: ChallengeId) {
    const today = currentDaily(daily);
    const challenge = DAILY_CHALLENGES.find(
      (entry) => entry.id === id
    );

    if (
      !challenge ||
      today.claimed.includes(id) ||
      challengeProgress(today, id) <
        challenge.target
    ) {
      return;
    }

    setDaily({
      ...today,
      claimed: [...today.claimed, id],
    });

    setCoins(
      (value) => value + challenge.coins
    );

    setReputation(
      (value) => value + challenge.reputation
    );

    setToast(
      `DAILY CHALLENGE: ${challenge.title}! +${challenge.coins} Coins, +${challenge.reputation} Reputation.`
    );

    playGameSound('job');
  }

  const stats = {
    jobs: jobsDone,
    discoveries: discovered.length,
    owned: inventory.length,
    totalDiscoveries: DISCOVERIES.length,
  };

  const unlockedCount = ACHIEVEMENTS.filter((a) => {
    const goal =
      a.goal < 0
        ? stats.totalDiscoveries
        : a.goal;

    return stats[a.stat] >= goal;
  }).length;

  // Existing E interactions.

  const interact = useCallback(() => {
    if (!nearby || locked) return;

    if (nearby.kind === 'arcade') {
      setArcadeOpen(true);
      playGameSound('interact');
      return;
    }

    if (nearby.kind === 'shop') {
      playGameSound('interact');
      setShopOpen(true);
      return;
    }

    if (nearby.kind === 'citizen') {
      playGameSound('talk');

      setDialogText(
        reputation >= 100
          ? 'Marty: Even the pigeons know your name. That is not a compliment.'
          : randomLine(CITIZEN_LINES)
      );

      setDialogOpen(true);
      return;
    }

    if (nearby.kind === 'gary') {
      if (quest.job !== 'none') {
        playGameSound('talk');

        setToast(
          quest.job === 'pigeon'
            ? 'Gary: Stop standing here. The pigeons are literally right there.'
            : 'Gary: You are touching grass instead of earning a salary? Respect.'
        );
      } else {
        setQuest({
          job: 'pigeon',
          caught: [],
          touched: [],
        });

        setToast(
          'Gary: Catch these three pigeons. They owe me money. Reward: 75 Coins.'
        );

        playGameSound('interact');
      }

      return;
    }

    if (
      nearby.kind === 'pigeon' &&
      quest.job === 'pigeon'
    ) {
      if (quest.caught.includes(nearby.index)) {
        return;
      }

      const next = [
        ...quest.caught,
        nearby.index,
      ];

      if (next.length === PIGEONS.length) {
        setQuest(emptyQuest());
        setCoins((n) => n + 75);
        setJobsDone((n) => n + 1);
        recordJob();

        setToast(
          'JOB COMPLETE: +75 Coins! Gary still refuses to explain pigeon debt.'
        );

        playGameSound('job');
      } else {
        setQuest({
          ...quest,
          caught: next,
        });

        setToast(
          `Pigeon secured (${next.length}/${PIGEONS.length}). It seems offended.`
        );

        playGameSound('coin');
      }

      return;
    }

    if (
      nearby.kind === 'grass' &&
      quest.job === 'grass'
    ) {
      if (quest.touched.includes(nearby.id)) return;

      const next = [
        ...quest.touched,
        nearby.id,
      ];

      if (next.length === GRASS_SPOTS.length) {
        setQuest(emptyQuest());

        setCoins(
          (n) => n + GRASS_REWARD
        );

        setJobsDone((n) => n + 1);
        recordJob();

        setToast(
          `CERTIFIED GRASS TOUCHER! +${GRASS_REWARD} Coins. You have officially gone outside.`
        );

        playGameSound('job');
      } else {
        setQuest({
          ...quest,
          touched: next,
        });

        setToast(
          `Grass thoroughly touched (${next.length}/${GRASS_SPOTS.length}). Strange career choice.`
        );

        playGameSound('coin');
      }

      return;
    }

    if (nearby.kind === 'discovery') {
      const place = DISCOVERIES.find(
        (p) => p.id === nearby.id
      );

      if (!place) return;

      const first =
        !discovered.includes(place.id);

      setDaily((state) => {
        const today = currentDaily(state);

        return today.inspected.includes(place.id)
          ? today
          : {
              ...today,
              inspected: [
                ...today.inspected,
                place.id,
              ],
            };
      });

      if (first) {
        setDiscovered(
          (old) => [...old, place.id]
        );

        setCoins(
          (n) => n + DISCOVERY_REWARD
        );

        setReputation(
          (n) => n + 3
        );
      }

      playGameSound(
        first ? 'coin' : 'interact'
      );

      setToast(
        `${randomLine(place.lines)}${
          first
            ? ` DISCOVERED! +${DISCOVERY_REWARD} Coins.`
            : ''
        }`
      );
    }
  }, [
    nearby,
    locked,
    quest,
    discovered,
    reputation,
  ]);

  function startGrassJob() {
    if (quest.job !== 'none') {
      playGameSound('error');

      setDialogText(
        'Finish your current job first. We only allow one useless career at a time.'
      );
      return;
    }

    setQuest({
      job: 'grass',
      caught: [],
      touched: [],
    });

    setDialogOpen(false);

    setToast(
      'Marty: Touch three suspicious grass patches. Reward: 45 Coins.'
    );

    playGameSound('interact');
  }

  // Existing shop and wardrobe.

  function buyOrEquip(
    item: (typeof COSMETICS)[number]
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
      playGameSound('error');
      setToast(
        `You need ${item.price - coins} more Coins.`
      );
      return;
    }

    setCoins(
      (old) => old - item.price
    );

    setInventory(
      (old) => [...old, item.id]
    );

    setEquipped(item.id);

    setToast(
      `Purchased ${item.name}! Your financial decisions are questionable.`
    );

    playGameSound('coin');
  }

  function equip(
    id: CosmeticId | 'none'
  ) {
    if (
      id !== 'none' &&
      !inventory.includes(id)
    ) {
      return;
    }

    setEquipped(id);

    setToast(
      id === 'none'
        ? 'Hat removed. Head exposed to society.'
        : `${
            COSMETICS.find(
              (c) => c.id === id
            )?.name
          } equipped!`
    );

    playGameSound('interact');
  }

  function changeShirt(
    id: ShirtColorId
  ) {
    setShirt(id);
    playGameSound('interact');
  }

  const wave = useCallback(() => {
    setEmote(true);
    playGameSound('wave');

    window.setTimeout(
      () => setEmote(false),
      1600
    );
  }, []);

  // Keyboard controls.

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        (
          event.target instanceof HTMLElement &&
          event.target.closest(
            'input, textarea, select, [contenteditable="true"]'
          )
        )
      ) {
        return;
      }

      if (event.code === 'Escape') {
        setShopOpen(false);
        setDialogOpen(false);
        setProfile(null);
        setDailyOpen(false);
        setArcadeOpen(false);
        return;
      }

      if (
        shopOpen ||
        dialogOpen ||
        arcadeOpen ||
        encounterOpen
      ) {
        return;
      }

      if (
        dailyOpen &&
        event.code !== 'KeyK'
      ) {
        return;
      }

      if (
        profile &&
        event.code !== 'KeyI' &&
        event.code !== 'KeyJ'
      ) {
        return;
      }

      if (event.code === 'KeyI') {
        setProfile(
          (p) =>
            p === 'wardrobe'
              ? null
              : 'wardrobe'
        );
        return;
      }

      if (event.code === 'KeyJ') {
        setProfile(
          (p) =>
            p === 'achievements'
              ? null
              : 'achievements'
        );
        return;
      }

      if (event.code === 'KeyK') {
        setDailyOpen(
          (value) => !value
        );
        return;
      }

      if (profile || dailyOpen) return;

      if (event.code === 'KeyE') interact();

      if (event.code === 'KeyH') {
        setShowHelp((old) => !old);
      }

      if (event.code === 'KeyB') wave();
    };

    window.addEventListener('keydown', onKey);

    return () =>
      window.removeEventListener('keydown', onKey);
  }, [
    interact,
    shopOpen,
    dialogOpen,
    profile,
    dailyOpen,
    arcadeOpen,
    encounterOpen,
    wave,
  ]);

  const progress =
    quest.job === 'pigeon'
      ? quest.caught.length / PIGEONS.length
      : quest.job === 'grass'
        ? quest.touched.length / GRASS_SPOTS.length
        : 0;

  const objective =
    quest.job === 'pigeon'
      ? `Catch pigeons: ${quest.caught.length}/${PIGEONS.length}`
      : quest.job === 'grass'
        ? `Touch grass: ${quest.touched.length}/${GRASS_SPOTS.length}`
        : 'Talk to Gary or Marty to get a ridiculous job';

  return (
    <div className="game-shell">
      {/* Existing city + reactive citizens */}
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
        <City caught={quest.caught} />
        <CityActivities touched={quest.touched} />
        <ArcadeKiosk />

        <CityExtras
          cityEvent={cityEvent}
          player={player}
        />

        <ReactiveCitizens
          player={player}
          reputation={reputation}
        />

        <Player
          onMove={onMove}
          equipped={equipped}
          shirtColor={shirtHex(shirt)}
          emote={emote}
          cityEvent={cityEvent}
          inputLocked={locked}
        />
      </Canvas>

      {/* New Alpha 0.7 interaction layer */}
      <CityEncounters
        player={player}
        reputation={reputation}
        disabled={
          shopOpen ||
          dialogOpen ||
          profile !== null ||
          dailyOpen ||
          arcadeOpen
        }
        onModalChange={setEncounterOpen}
        onReward={(
          earnedCoins,
          earnedReputation
        ) => {
          setCoins(
            (value) => value + earnedCoins
          );

          setReputation(
            (value) => value + earnedReputation
          );

          setToast(
            `STREET ENCOUNTER: +${earnedCoins} Coins, +${earnedReputation} REP.`
          );
        }}
      />

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
              <span>•</span> ALPHA 1.0
            </p>
          </div>
        </div>

        <div className="economy">
          <span className="coin-icon">◆</span>
          <div>
            <span>YOUR ENTIRE FORTUNE</span>
            <strong>
              {coins.toLocaleString()}
              <small> COINS</small>
            </strong>
          </div>
        </div>
      </header>

      {/* Reputation HUD */}
      <div className="alpha6-hud">
        <small>NPC REPUTATION</small>
        <strong>{reputationTier.title}</strong>
        <span>
          {reputation} REP · K for daily challenges
        </span>
      </div>

      {/* Quest tracker */}
      <section
        className="quest-panel"
        aria-live="polite"
      >
        <span className="panel-eyebrow">
          CURRENT LIFE PURPOSE
        </span>

        <h2>
          {quest.job === 'pigeon'
            ? 'Operation: Pigeon Debt'
            : quest.job === 'grass'
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
          <strong>
            +{quest.job === 'grass'
              ? GRASS_REWARD
              : 75} ◆
          </strong>
        </div>

        <div className="npc-discovery">
          CITY FINDS: {discovered.length}/
          {DISCOVERIES.length}
          {' · '}
          ACHIEVEMENTS: {unlockedCount}/
          {ACHIEVEMENTS.length}
        </div>
      </section>

      {/* City events */}
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

      {/* Existing minimap */}
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

      {/* Messages and existing interaction */}
      <div
        className="center-message"
        aria-live="polite"
      >
        {toast}
      </div>

      {nearby && !locked && (
        <button
          className="interaction"
          onClick={interact}
        >
          <span className="keycap">E</span>
          {nearby.label}
        </button>
      )}

      {/* Bottom toolbar */}
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
          className="profile-button"
          onClick={() => {
            setProfile('wardrobe');
            playGameSound('interact');
          }}
        >
          👕 Wardrobe <span>I</span>
        </button>

        <button
          className="profile-button"
          onClick={() => {
            setProfile('achievements');
            playGameSound('interact');
          }}
        >
          🏆 Journal <span>J</span>
        </button>

        <button
          className="alpha6-toolbar"
          onClick={() => {
            setDailyOpen(true);
            playGameSound('interact');
          }}
        >
          📋 Dailies <span>K</span>
        </button>

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
              onClick={() => setShowHelp(false)}
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
            <kbd>F</kbd> Talk to special citizens
          </p>
          <p>
            <kbd>B</kbd> Awkward wave
          </p>
          <p>
            <kbd>H</kbd> Toggle help
          </p>
          <p>
            <kbd>I</kbd> Wardrobe
          </p>
          <p>
            <kbd>J</kbd> Achievements
          </p>
          <p>
            <kbd>K</kbd> Daily challenges
          </p>
          <p>
            <kbd>DRAG</kbd> Rotate camera
          </p>
          <p>
            <kbd>SCROLL</kbd> Zoom camera
          </p>

          <p className="muted">
            Talk to Gary for pigeon debt, or Marty
            for grass inspections. Quest progress
            saves locally. Press F near named
            citizens for street encounters.
            Your rank: {cityRank(jobsDone)}.
          </p>
        </section>
      )}

      {/* Daily challenges */}
      {dailyOpen && (
        <DailyBoard
          daily={currentDaily(daily)}
          reputation={reputation}
          onClaim={claimChallenge}
          onClose={() => setDailyOpen(false)}
        />
      )}

      {/* Arcade */}
      {arcadeOpen && (
        <PigeonPanic
          onClose={() => setArcadeOpen(false)}
          onFinish={arcadeFinished}
        />
      )}

      {/* Wardrobe and achievements */}
      {profile && (
        <ProgressionPanel
          key={profile}
          initialTab={profile}
          inventory={inventory}
          equipped={equipped}
          shirt={shirt}
          stats={stats}
          onEquip={equip}
          onShirt={changeShirt}
          onClose={() => setProfile(null)}
        />
      )}

      {/* Marty dialogue */}
      {dialogOpen && (
        <div
          className="npc-dialog-backdrop"
          onClick={() => setDialogOpen(false)}
        >
          <section
            className="npc-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Talk to Marty"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="npc-dialog-label">
              LOCAL CITIZEN • VERY EMPLOYED
            </span>

            <h2>Marty, Grass Inspector</h2>
            <p>{dialogText}</p>

            <div className="npc-dialog-actions">
              <button onClick={startGrassJob}>
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
                onClick={() => setDialogOpen(false)}
              >
                Leave
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Cosmetic shop */}
      {shopOpen && (
        <div
          className="shop-backdrop"
          onClick={() => setShopOpen(false)}
        >
          <section
            className="shop-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Stupid Shop"
            onClick={(e) => e.stopPropagation()}
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
                onClick={() => setShopOpen(false)}
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
              {COSMETICS.map((item) => {
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
                      <strong>{item.name}</strong>
                      <span>{item.description}</span>
                      <small>
                        {owned
                          ? 'OWNED'
                          : `◆ ${item.price}`}
                      </small>
                    </div>

                    <button
                      onClick={() => buyOrEquip(item)}
                      disabled={
                        !owned && coins < item.price
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
              Purchases appear in your Wardrobe
              (I). Press ESC to leave.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
