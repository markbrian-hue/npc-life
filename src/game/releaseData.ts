import { LIVING_KEY, validateLiving } from '../../shared/livingCity.mjs';
import { LIFE_KEY, validateLife } from '../../shared/residentLife.mjs';
import { CAMPAIGN_KEY, validateCampaign } from './campaign';

import { COSMETICS, isCosmetic, isShirt } from './progression';
import { DISCOVERIES, GRASS_SPOTS } from './interactions';
import { PIGEONS } from './world';
import { STREET_NPCS } from './alpha7';
import { DAILY_CHALLENGES } from './alpha6';

export const RELEASE_KEYS = [
  LIVING_KEY,
  LIFE_KEY,
  CAMPAIGN_KEY,
  'npc-life:coins-v1',
  'npc-life:inventory-v1',
  'npc-life:equipped-v1',
  'npc-life:jobs-v1',
  'npc-life:discoveries-v1',
  'npc-life:shirt-v1',
  'npc-life:active-quest-v1',
  'npc-life:daily-v1',
  'npc-life:reputation-v1',
  'npc-life:encounters-v1',
  'npc-life:orientation-v1',
  'npc-life:work-dodge-best-v1',
  'npc-life:work-dodge-rounds-v1',
  'npc-life:ending-v1',
  'npc-life:release-settings-v1',
] as const;

export const ENDING_KEY = 'npc-life:ending-v1';
export const SETTINGS_KEY = 'npc-life:release-settings-v1';

export type ReleaseSettings = {
  reducedMotion: boolean;
  compactHud: boolean;
  hideMinimap: boolean;
};

export const DEFAULT_SETTINGS: ReleaseSettings = {
  reducedMotion: false,
  compactHud: false,
  hideMinimap: false,
};

type RecordValue = Record<string, unknown>;

const asRecord = (v: unknown): RecordValue | null =>
  !!v && typeof v === 'object' && !Array.isArray(v)
    ? v as RecordValue
    : null;

const parseObject = (v: string): RecordValue | null => {
  try {
    return asRecord(JSON.parse(v));
  } catch {
    return null;
  }
};

const bounded = (n: unknown, max = 1_000_000_000) =>
  typeof n === 'number' && Number.isFinite(n)
    ? Math.min(max, Math.max(0, Math.floor(n)))
    : 0;

const ids = (input: unknown, allowed: readonly string[]) =>
  Array.isArray(input)
    ? [...new Set(input.filter(
        (id): id is string =>
          typeof id === 'string' && allowed.includes(id)
      ))]
    : [];

const num = (key: string) => bounded(Number(readReleaseValue(key) ?? 0));

export function readReleaseValue(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export type ReleaseGoal = {
  id: string;
  title: string;
  details: string;
  value: number;
  target: number;
};

export function readGoals(): ReleaseGoal[] {
  const uniqueFinds = ids(
    safeJson('npc-life:discoveries-v1'),
    DISCOVERIES.map(p => p.id)
  ).length;

  const wardrobe = ids(
    safeJson('npc-life:inventory-v1'),
    COSMETICS.map(c => c.id)
  ).length;

  return [
    {
      id: 'jobs',
      title: 'Become Employed (Briefly)',
      details: 'Finish 3 jobs for Gary or Marty.',
      value: num('npc-life:jobs-v1'),
      target: 3,
    },
    {
      id: 'finds',
      title: 'Know Your Neighborhood',
      details: 'Inspect 5 different city objects.',
      value: uniqueFinds,
      target: 5,
    },
    {
      id: 'fashion',
      title: 'Questionable Fashion',
      details: 'Own at least 1 cosmetic accessory.',
      value: wardrobe,
      target: 1,
    },
    {
      id: 'fame',
      title: 'Local Public Nuisance',
      details: 'Earn 60 reputation points.',
      value: num('npc-life:reputation-v1'),
      target: 60,
    },
    {
      id: 'dodge',
      title: 'Career Avoidance Expert',
      details: 'Score 20 in Unemployment Simulator (M).',
      value: num('npc-life:work-dodge-best-v1'),
      target: 20,
    },
  ];
}

function safeJson(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

export function getSettings(): ReleaseSettings {
  const value = asRecord(safeJson(SETTINGS_KEY));

  return {
    reducedMotion: value?.reducedMotion === true,
    compactHud: value?.compactHud === true,
    hideMinimap: value?.hideMinimap === true,
  };
}

export function setSettings(value: ReleaseSettings): void {
  document.documentElement.classList.toggle(
    'npc-reduce-motion',
    value.reducedMotion
  );

  document.documentElement.classList.toggle(
    'npc-compact-hud',
    value.compactHud
  );

  document.documentElement.classList.toggle(
    'npc-hide-minimap',
    value.hideMinimap
  );

  // Preferences still apply for this session if persistent storage is blocked.
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(value));
}

export function exportSave(): void {
  const data: Record<string, string> = {};

  for (const key of RELEASE_KEYS) {
    const value = localStorage.getItem(key);

    if (value !== null) {
      data[key] = value;
    }
  }

  const file = new Blob([
    JSON.stringify({
      format: 'npc-life-save',
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
    }, null, 2),
  ], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(file);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'npc-life-save.json';

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function validateValue(key: string, raw: string): string {
  if(key===LIVING_KEY) return JSON.stringify(validateLiving(JSON.parse(raw)));
  if(key===LIFE_KEY) return JSON.stringify(validateLife(JSON.parse(raw)));
  if (key === CAMPAIGN_KEY) return JSON.stringify(validateCampaign(JSON.parse(raw)));
  if ([
    'npc-life:coins-v1',
    'npc-life:jobs-v1',
    'npc-life:reputation-v1',
    'npc-life:work-dodge-best-v1',
    'npc-life:work-dodge-rounds-v1',
  ].includes(key)) {
    const n = Number(raw);

    if (!Number.isFinite(n) || n < 0) {
      throw new Error(`Invalid ${key}`);
    }

    return String(bounded(n));
  }

  if (key === 'npc-life:inventory-v1') {
    const value: unknown = JSON.parse(raw);

    if (!Array.isArray(value)) {
      throw new Error('Invalid inventory');
    }

    return JSON.stringify(ids(
      value,
      COSMETICS.map(c => c.id)
    ));
  }

  if (key === 'npc-life:discoveries-v1') {
    const value: unknown = JSON.parse(raw);

    if (!Array.isArray(value)) {
      throw new Error('Invalid discoveries');
    }

    return JSON.stringify(ids(
      value,
      DISCOVERIES.map(d => d.id)
    ));
  }

  if (key === 'npc-life:equipped-v1') {
    if (raw !== 'none' && !isCosmetic(raw)) {
      throw new Error('Invalid equipped cosmetic');
    }

    return raw;
  }

  if (key === 'npc-life:shirt-v1') {
    if (!isShirt(raw)) {
      throw new Error('Invalid shirt color');
    }

    return raw;
  }

  if (key === ENDING_KEY) {
    if (raw !== '1') {
      throw new Error('Invalid ending');
    }

    return '1';
  }

  const value = parseObject(raw);

  if (!value) {
    throw new Error(`Invalid saved data for ${key}`);
  }

  if (key === SETTINGS_KEY) {
    return JSON.stringify({
      reducedMotion: value.reducedMotion === true,
      compactHud: value.compactHud === true,
      hideMinimap: value.hideMinimap === true,
    });
  }

  if (key === 'npc-life:active-quest-v1') {
    const job =
      value.job === 'grass' || value.job === 'pigeon'
        ? value.job
        : 'none';

    return JSON.stringify({
      job,
      caught: Array.isArray(value.caught)
        ? [...new Set(value.caught.filter(
            (n): n is number =>
              typeof n === 'number' &&
              Number.isInteger(n) &&
              n >= 0 &&
              n < PIGEONS.length
          ))]
        : [],
      touched: ids(
        value.touched,
        GRASS_SPOTS.map(p => p.id)
      ),
    });
  }

  if (key === 'npc-life:daily-v1') {
    return JSON.stringify({
      day:
        typeof value.day === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(value.day)
          ? value.day
          : '',
      jobs: bounded(value.jobs, 100000),
      inspected: ids(
        value.inspected,
        DISCOVERIES.map(p => p.id)
      ),
      arcadeWins: bounded(value.arcadeWins, 100000),
      claimed: ids(
        value.claimed,
        DAILY_CHALLENGES.map(c => c.id)
      ),
    });
  }

  if (key === 'npc-life:encounters-v1') {
    return JSON.stringify({
      day:
        typeof value.day === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(value.day)
          ? value.day
          : '',
      rewarded: ids(
        value.rewarded,
        STREET_NPCS.map(n => n.id)
      ),
      visits: bounded(value.visits, 100000),
    });
  }

  if (key === 'npc-life:orientation-v1') {
    return JSON.stringify({
      status: [
        'new',
        'started',
        'completed',
        'skipped',
      ].includes(String(value.status))
        ? value.status
        : 'new',
      distance: bounded(value.distance, 20),
      visitedGary: value.visitedGary === true,
      visitedArcade: value.visitedArcade === true,
    });
  }

  throw new Error(`Unexpected key ${key}`);
}

export async function importSave(file: File): Promise<void> {
  if (file.size > 256 * 1024) {
    throw new Error('File is too large (256 KB limit).');
  }

  const root = asRecord(
    JSON.parse(await file.text())
  );

  if (
    root?.format !== 'npc-life-save' ||
    root.version !== 1
  ) {
    throw new Error('Not a supported NPC LIFE save file.');
  }

  const input = asRecord(root.data);

  if (!input) {
    throw new Error('Save file has no data.');
  }

  const validated: Record<string, string> = {};

  for (const key of RELEASE_KEYS) {
    const raw = input[key];

    if (raw !== undefined) {
      if (typeof raw !== 'string') {
        throw new Error(`Invalid value: ${key}`);
      }

      validated[key] = validateValue(key, raw);
    }
  }

  if (!Object.keys(validated).length) {
    throw new Error('Save file is empty.');
  }

  // Ensure the equipped cosmetic is owned.
  const inventory = validated['npc-life:inventory-v1'];
  const equipped = validated['npc-life:equipped-v1'];

  if (
    equipped &&
    equipped !== 'none' &&
    (!inventory || !JSON.parse(inventory).includes(equipped))
  ) {
    validated['npc-life:equipped-v1'] = 'none';
  }

  // Keep a rollback snapshot if storage fails.
  const before = new Map(
    RELEASE_KEYS.map(key => [
      key,
      localStorage.getItem(key),
    ])
  );

  try {
    for (const key of RELEASE_KEYS) {
      localStorage.removeItem(key);
    }

    for (const [key, value] of Object.entries(validated)) {
      localStorage.setItem(key, value);
    }
  } catch (error) {
    for (const key of RELEASE_KEYS) {
      const prior = before.get(key);

      if (prior === null || prior === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, prior);
      }
    }

    throw error;
  }
}

export function resetSave(): void {
  for (const key of RELEASE_KEYS) {
    localStorage.removeItem(key);
  }
}
