
import {
  BENCHES,
  BUS_STOP,
  FOUNTAIN,
  PARKED_CARS,
  PLANTERS,
} from './world';

export const GRASS_SPOTS = [
  {
    id: 'west',
    x: -11,
    z: 24,
    title: 'Suspicious Patch #1',
  },
  {
    id: 'east',
    x: 25,
    z: 10,
    title: 'Suspicious Patch #2',
  },
  {
    id: 'south',
    x: -25,
    z: -10,
    title: 'Suspicious Patch #3',
  },
] as const;

export type Job = 'none' | 'pigeon' | 'grass';

export const DISCOVERIES = [
  {
    id: 'bus',
    kind: 'bus',
    x: BUS_STOP.x,
    z: BUS_STOP.z,
    range: 3.3,
    label: 'Inspect bus stop',
    lines: [
      'The next bus arrives in 3 to 5 business years.',
      'Route 7 has been delayed by vibes.',
      'The timetable just says: eventually.',
    ],
  },
  {
    id: 'fountain',
    kind: 'fountain',
    x: FOUNTAIN.x,
    z: FOUNTAIN.z,
    range: 4.2,
    label: 'Inspect fountain',
    lines: [
      'You wished for a career. The water ignored you.',
      'Do not throw coins in here. Your wallet is fragile.',
      'This fountain has better cash flow than you.',
    ],
  },
  ...BENCHES.map((p, i) => ({
    id: `bench-${i}`,
    kind: 'bench',
    x: p.x,
    z: p.z,
    range: 2.8,
    label: 'Inspect bench',
    lines: [
      'A premium location for doing nothing.',
      'This bench has supported generations of unemployment.',
      'Someone engraved: I peaked in the tutorial.',
    ],
  })),
  ...PARKED_CARS.map((p, i) => ({
    id: `car-${i}`,
    kind: 'car',
    x: p.x,
    z: p.z,
    range: 3.5,
    label: 'Inspect parked car',
    lines: [
      'Nice car. It is definitely not yours.',
      'The dashboard says: please stop touching me.',
      'You have inspected this car harder than a mechanic.',
    ],
  })),
  ...PLANTERS.map((p, i) => ({
    id: `planter-${i}`,
    kind: 'planter',
    x: p.x,
    z: p.z,
    range: 2.4,
    label: 'Inspect planter',
    lines: [
      'A shrub silently judges your decisions.',
      'Certified oxygen producer. Unlike you, it has a job.',
      'A very normal plant with extremely abnormal opinions.',
    ],
  })),
] as const;

export const CITIZEN_LINES = [
  'The mayor has declared Tuesday optional.',
  'I wanted to be the protagonist but the writers said no.',
  'The traffic lights are smarter than the city council.',
  'I have been standing here since the developers spawned me.',
  'A pigeon tried to sell me insurance yesterday.',
  'We have four cars and six traffic accidents per minute. Impressive.',
];

export function randomLine(
  lines: readonly string[]
): string {
  return lines[
    Math.floor(Math.random() * lines.length)
  ];
}

export const DISCOVERY_REWARD = 8;
export const GRASS_REWARD = 45;
