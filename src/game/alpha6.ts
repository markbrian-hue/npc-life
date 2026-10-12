
export const ARCADE_POSITION = { x: 9, z: 7.8 } as const;

export const DAILY_CHALLENGES = [
  {
    id: 'jobs',
    icon: '💼',
    title: 'Double Shift',
    description: 'Finish two NPC jobs today.',
    target: 2,
    coins: 35,
    reputation: 12,
  },
  {
    id: 'inspect',
    icon: '🔍',
    title: 'Neighborhood Nosy',
    description: 'Inspect three different city objects today.',
    target: 3,
    coins: 25,
    reputation: 10,
  },
  {
    id: 'arcade',
    icon: '🐦',
    title: 'Pigeon Athlete',
    description: 'Win one round of Pigeon Panic today.',
    target: 1,
    coins: 30,
    reputation: 12,
  },
] as const;

export type ChallengeId =
  (typeof DAILY_CHALLENGES)[number]['id'];

export type DailyProgress = {
  day: string;
  jobs: number;
  inspected: string[];
  arcadeWins: number;
  claimed: ChallengeId[];
};

export function localDay(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function newDaily(day = localDay()): DailyProgress {
  return {
    day,
    jobs: 0,
    inspected: [],
    arcadeWins: 0,
    claimed: [],
  };
}

export function currentDaily(
  value: DailyProgress
): DailyProgress {
  return value.day === localDay() ? value : newDaily();
}

export function loadDaily(): DailyProgress {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem('npc-life:daily-v1') || 'null'
    );

    if (!value || typeof value !== 'object') {
      return newDaily();
    }

    const data = value as Record<string, unknown>;

    if (data.day !== localDay()) {
      return newDaily();
    }

    const validNumber = (n: unknown) =>
      typeof n === 'number' &&
      Number.isFinite(n) &&
      n >= 0
        ? Math.floor(n)
        : 0;

    const inspected = Array.isArray(data.inspected)
      ? [
          ...new Set(
            data.inspected.filter(
              (s): s is string =>
                typeof s === 'string'
            )
          ),
        ]
      : [];

    const claimed = Array.isArray(data.claimed)
      ? (
          [...new Set(data.claimed)] as unknown[]
        ).filter(
          (id): id is ChallengeId =>
            DAILY_CHALLENGES.some(
              (entry) => entry.id === id
            )
        )
      : [];

    return {
      day: localDay(),
      jobs: validNumber(data.jobs),
      inspected,
      arcadeWins: validNumber(data.arcadeWins),
      claimed,
    };
  } catch {
    return newDaily();
  }
}

export function challengeProgress(
  daily: DailyProgress,
  id: ChallengeId
): number {
  const state = currentDaily(daily);

  switch (id) {
    case 'jobs':
      return state.jobs;
    case 'inspect':
      return state.inspected.length;
    case 'arcade':
      return state.arcadeWins;
  }
}

export function loadReputation(
  existingJobs: number
): number {
  try {
    const raw = localStorage.getItem(
      'npc-life:reputation-v1'
    );

    if (raw === null) {
      return existingJobs * 12;
    }

    const value = Number(raw);

    return Number.isFinite(value) && value >= 0
      ? Math.floor(value)
      : existingJobs * 12;
  } catch {
    return existingJobs * 12;
  }
}

const REPUTATION_LEVELS = [
  {
    minimum: 0,
    title: 'Unknown Background NPC',
  },
  {
    minimum: 40,
    title: 'Somewhat Recognizable',
  },
  {
    minimum: 100,
    title: 'Local Public Nuisance',
  },
  {
    minimum: 200,
    title: 'Neighborhood Celebrity',
  },
  {
    minimum: 350,
    title: 'Idiot City Legend',
  },
] as const;

export function reputationInfo(points: number) {
  const level = REPUTATION_LEVELS.reduce(
    (best, current) =>
      points >= current.minimum ? current : best,
    REPUTATION_LEVELS[0]
  );

  const next = REPUTATION_LEVELS.find(
    (entry) => entry.minimum > points
  );

  return {
    title: level.title,
    points,
    next: next?.minimum ?? null,
    progress: next
      ? (points - level.minimum) /
        (next.minimum - level.minimum)
      : 1,
  };
}
