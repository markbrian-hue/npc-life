
import { ARCADE_POSITION } from './alpha6';
import { GARY } from './world';

export const TOUR_KEY = 'npc-life:orientation-v1';
export const BEST_KEY = 'npc-life:work-dodge-best-v1';
export const ROUNDS_KEY = 'npc-life:work-dodge-rounds-v1';

export const TOUR_TARGETS = {
  gary: GARY,
  arcade: ARCADE_POSITION,
} as const;

export type TourStatus =
  | 'new'
  | 'started'
  | 'completed'
  | 'skipped';

export type TourProgress = {
  status: TourStatus;
  distance: number;
  visitedGary: boolean;
  visitedArcade: boolean;
};

export function newTour(
  status: TourStatus = 'new'
): TourProgress {
  return {
    status,
    distance: 0,
    visitedGary: false,
    visitedArcade: false,
  };
}

export function loadTour(): TourProgress {
  try {
    const raw: unknown = JSON.parse(
      localStorage.getItem(TOUR_KEY) || 'null'
    );

    if (!raw || typeof raw !== 'object') {
      return newTour();
    }

    const value = raw as Record<string, unknown>;

    const status: TourStatus =
      value.status === 'started' ||
      value.status === 'completed' ||
      value.status === 'skipped'
        ? value.status
        : 'new';

    const distance =
      typeof value.distance === 'number' &&
      Number.isFinite(value.distance)
        ? Math.max(0, Math.min(20, value.distance))
        : 0;

    return {
      status,
      distance,
      visitedGary: value.visitedGary === true,
      visitedArcade: value.visitedArcade === true,
    };
  } catch {
    return newTour();
  }
}

export function readScore(key: string): number {
  try {
    const value = Number(
      localStorage.getItem(key) ?? '0'
    );

    return Number.isFinite(value) && value >= 0
      ? Math.floor(value)
      : 0;
  } catch {
    return 0;
  }
}

export type Cell = {
  x: number;
  y: number;
};

export const GRID_SIZE = 7;
export const GAME_SECONDS = 30;

export const sameCell = (a: Cell, b: Cell) =>
  a.x === b.x && a.y === b.y;

export function spawnCoffee(
  occupied: readonly Cell[]
): Cell {
  const candidates: Cell[] = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const pos = { x, y };

      if (
        !occupied.some((other) =>
          sameCell(other, pos)
        )
      ) {
        candidates.push(pos);
      }
    }
  }

  return (
    candidates[
      Math.floor(
        Math.random() * candidates.length
      )
    ] ?? { x: 3, y: 3 }
  );
}

export function chase(
  boss: Cell,
  player: Cell,
  otherBosses: readonly Cell[]
): Cell {
  const horizontal = {
    x: boss.x + Math.sign(player.x - boss.x),
    y: boss.y,
  };

  const vertical = {
    x: boss.x,
    y: boss.y + Math.sign(player.y - boss.y),
  };

  const dx = Math.abs(player.x - boss.x);
  const dy = Math.abs(player.y - boss.y);

  const options =
    dx >= dy
      ? [horizontal, vertical]
      : [vertical, horizontal];

  for (const option of options) {
    if (sameCell(option, boss)) continue;

    if (
      option.x < 0 ||
      option.x >= GRID_SIZE ||
      option.y < 0 ||
      option.y >= GRID_SIZE
    ) {
      continue;
    }

    if (
      !otherBosses.some((other) =>
        sameCell(other, option)
      )
    ) {
      return option;
    }
  }

  return boss;
}

export function scoreRank(score: number): string {
  if (score >= 100) {
    return 'UNEMPLOYMENT LEGEND';
  }

  if (score >= 60) {
    return 'CERTIFIED WORK DODGER';
  }

  if (score >= 30) {
    return 'PART-TIME ESCAPE ARTIST';
  }

  return 'PROBATIONARY SLACKER';
}
