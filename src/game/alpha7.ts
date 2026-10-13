
import { localDay } from './alpha6';

export const STREET_NPCS = [
  {
    id: 'nia',
    name: 'Nia',
    title: 'Unpaid Mayor Intern',
    x: -8,
    z: -25,
    shirt: '#e5a079',
    pants: '#3e536d',
    hair: '#382c39',
    greeting:
      "I have been the mayor's intern for 600 years. Unpaid.",
    question:
      'We found a pothole. It has been promoted to assistant mayor.',
    choices: [
      {
        label: 'Offer to repair it',
        reply:
          'Nia: Wow, a functioning citizen. I will report this anomaly.',
        reputation: 6,
        coins: 0,
      },
      {
        label: 'Sell the pothole naming rights',
        reply:
          'Nia: Brilliant. Welcome to the Idiot City economy.',
        reputation: 0,
        coins: 10,
      },
    ],
  },
  {
    id: 'gus',
    name: 'Gus',
    title: 'Pigeon Defense Attorney',
    x: 17,
    z: -8,
    shirt: '#7fb3aa',
    pants: '#41516a',
    hair: '#473725',
    greeting:
      'My clients plead not guilty. They are pigeons.',
    question:
      'Gary is accusing my clients of financial misconduct.',
    choices: [
      {
        label: 'Defend the pigeons',
        reply:
          'Gus: Finally, a person of legal nonsense. Case dismissed!',
        reputation: 6,
        coins: 0,
      },
      {
        label: 'Charge them a consultation fee',
        reply:
          'Gus: They paid you in imaginary money. Here is a real tip instead.',
        reputation: 0,
        coins: 10,
      },
    ],
  },
  {
    id: 'dot',
    name: 'Dot',
    title: 'Neighborhood Influencer',
    x: 7,
    z: 19,
    shirt: '#bf95bf',
    pants: '#3b526b',
    hair: '#5a342e',
    greeting:
      'I have 12 followers. Eleven are traffic lights.',
    question:
      'I need fresh content. Can you help with a viral city story?',
    choices: [
      {
        label: 'Pose as a local hero',
        reply:
          'Dot: You got three likes, and one was from the giant duck.',
        reputation: 6,
        coins: 0,
      },
      {
        label: 'Sell a fake map to the moon',
        reply:
          'Dot: This is deeply questionable. I love it.',
        reputation: 0,
        coins: 10,
      },
    ],
  },
] as const;

export type StreetNpc = (typeof STREET_NPCS)[number];
export type StreetNpcId = StreetNpc['id'];

export const RUMORS = [
  'Somebody saw the giant duck applying for a parking permit.',
  'The bus stop is considering leaving the city.',
  'A tree requested relocation after meeting the traffic department.',
  'A pigeon has been appointed deputy finance minister.',
  'The mayor claims the crosswalk is New York\'s busiest office.',
  'The city will soon install Wi-Fi for the pigeons only.',
] as const;

export const ENCOUNTER_KEY =
  'npc-life:encounters-v1';

export type EncounterProgress = {
  day: string;
  rewarded: StreetNpcId[];
  visits: number;
};

export function newEncounters(
  day = localDay()
): EncounterProgress {
  return {
    day,
    rewarded: [],
    visits: 0,
  };
}

export function freshEncounters(
  progress: EncounterProgress
): EncounterProgress {
  return progress.day === localDay()
    ? progress
    : newEncounters();
}

export function loadEncounters(): EncounterProgress {
  try {
    const raw: unknown = JSON.parse(
      localStorage.getItem(ENCOUNTER_KEY) ||
        'null'
    );

    if (!raw || typeof raw !== 'object') {
      return newEncounters();
    }

    const value = raw as Record<string, unknown>;

    if (value.day !== localDay()) {
      return newEncounters();
    }

    const rewarded = Array.isArray(value.rewarded)
      ? [...new Set(value.rewarded)].filter(
          (id): id is StreetNpcId =>
            STREET_NPCS.some(
              (npc) => npc.id === id
            )
        )
      : [];

    const visits =
      typeof value.visits === 'number' &&
      Number.isFinite(value.visits)
        ? Math.max(0, Math.floor(value.visits))
        : 0;

    return {
      day: localDay(),
      rewarded,
      visits,
    };
  } catch {
    return newEncounters();
  }
}

export function dailyRumor(
  id: StreetNpcId,
  visits: number
): string {
  const date = localDay().replaceAll('-', '');

  const seed =
    Number(date) +
    id
      .split('')
      .reduce(
        (total, char) =>
          total + char.charCodeAt(0),
        0
      );

  return RUMORS[
    (seed + visits) % RUMORS.length
  ];
}
