export const WORLD_RADIUS = 88;

export type BuildingDef = {
  x: number; z: number; w: number; d: number; h: number;
  color: string; roof: string;
};

export const BUILDINGS: BuildingDef[] = [
  { x: -16, z: -17, w: 10, d: 8, h: 10, color: '#ddb08e', roof: '#8d6159' },
  { x: 16, z: -17, w: 10, d: 8, h: 13, color: '#9fc0c8', roof: '#587d88' },
  { x: -17, z: 17, w: 11, d: 8, h: 8, color: '#cdc0e1', roof: '#7c7397' },
  { x: 17, z: 17, w: 11, d: 8, h: 7, color: '#e3d09f', roof: '#9f7d54' },
  { x: -32, z: -17, w: 10, d: 10, h: 7, color: '#ddb0b5', roof: '#9b6a71' },
  { x: 32, z: -17, w: 10, d: 10, h: 9, color: '#afc9de', roof: '#6c879d' },
  { x: -32, z: 17, w: 10, d: 10, h: 12, color: '#a7c9ab', roof: '#56735e' },
  { x: 32, z: 17, w: 10, d: 10, h: 8, color: '#e7c2b7', roof: '#a36f72' },
];

// Outer neighborhoods frame the roads; every mission remains on a clear sidewalk.
BUILDINGS.push(
  ...[-1, 1].flatMap(side => [
    { x: side * 16, z: -48, w: 12, d: 15, h: 8, color: '#b4a08c', roof: '#596d6b' },
    { x: side * 28, z: -69, w: 12, d: 13, h: 11, color: '#b78363', roof: '#566365' },
    { x: 49, z: side * 17, w: 13, d: 10, h: 8, color: '#dfb388', roof: '#947262' },
    { x: 70, z: side * 20, w: 12, d: 12, h: 10, color: side > 0 ? '#d1a1a6' : '#8bafb6', roof: '#586c79' },
    { x: side * 23, z: 53, w: 12, d: 12, h: 7, color: '#b6c8bd', roof: '#597d7e' },
    { x: -69, z: side * 28, w: 10, d: 10, h: 6, color: '#d6bb92', roof: '#6f8972' },
  ])
);

export const PIGEONS = [
  { x: -7, z: 6 }, { x: 9, z: -7 }, { x: 10, z: 10 },
] as const;

export const GARY = { x: 3, z: 3 };
export const BUS_STOP = { x: 19, z: 6.2 };

// Off-center so the player can spawn at (0, 0) unobstructed.
export const FOUNTAIN = { x: -3.6, z: 3.7 };

export const PARKED_CARS = [
  { x: -25, z: 2.8, color: '#ba5d56', rotation: 0 },
  { x: 25, z: -2.8, color: '#56738d', rotation: Math.PI },
  { x: -2.8, z: -25, color: '#8d945f', rotation: Math.PI / 2 },
  { x: 2.8, z: 25, color: '#b6905f', rotation: -Math.PI / 2 },
] as const;

export const BENCHES = [
  { x: -12, z: 9, rotation: 0 },
  { x: 12, z: -9, rotation: Math.PI },
  { x: -9, z: -12, rotation: Math.PI / 2 },
  { x: 9, z: 12, rotation: -Math.PI / 2 },
] as const;

export const LAMP_POSTS = [
  { x: -8, z: -12 }, { x: 8, z: 12 }, { x: -28, z: 8 },
  { x: 28, z: -8 }, { x: -8, z: 28 }, { x: 8, z: -28 },
] as const;

export const PLANTERS = [
  { x: -37, z: 29 }, { x: 37, z: 29 },
  { x: -37, z: -29 }, { x: 37, z: -29 },
  { x: -9.3, z: 11.3 }, { x: 9.3, z: -11.3 },
] as const;

// Trees stay in landscaped perimeter strips.
// Validation also protects against future building changes.
const TREE_CANDIDATES: readonly (readonly [number, number])[] = [
  ...[-78, -62, -46, 46, 62, 78].flatMap(x => [-38, 38].map(z => [x, z] as const)),
  ...[-78, -62, -46, 46, 62].flatMap(z => [-38, 38].map(x => [x, z] as const)),
  [-74, -14], [-54, -18], [-46, 17], [-68, 16], [-79, 9],
  [-37, -35], [-26, -35], [-13, -35],
  [13, -35], [26, -35], [37, -35],
  [-37, 35], [-26, 35], [-13, 35],
  [13, 35], [26, 35], [37, 35],
  [-40, -27], [-40, -7.5],
  [-40, 7.5], [-40, 27],
  [40, -27], [40, -7.5],
  [40, 7.5], [40, 27],
] as const;

function safeTree(x: number, z: number): boolean {
  if (Math.abs(x) < 7 || Math.abs(z) < 7) return false;
  if (Math.abs(x) > WORLD_RADIUS - 2 || Math.abs(z) > WORLD_RADIUS - 2) return false;

  return !BUILDINGS.some((b) =>
    Math.abs(x - b.x) < b.w / 2 + 2.4 &&
    Math.abs(z - b.z) < b.d / 2 + 2.4
  );
}

export const TREES = TREE_CANDIDATES
  .filter(([x, z]) => safeTree(x, z))
  .map(([x, z]) => ({ x, z }));

export const DISTRICT_COLLIDERS = [
  ...[48, 60, 72].map(x => ({ x, z: 10, halfX: 2.5, halfZ: 1 })),
  ...[-6, 0, 6].map(x => ({ x, z: -73, halfX: 1.5, halfZ: 1.5 })),
  { x: 6, z: -62, halfX: .9, halfZ: .4 },
  { x: 6, z: -13, halfX: 1.25, halfZ: .6 },
  { x: 10, z: 70, halfX: 1.1, halfZ: 1.1 },
  { x: -19, z: -32, halfX: 6.5, halfZ: 3 },
  ...[-62, -44, 44, 62].flatMap(v => [{ x: v, z: 8, halfX: .22, halfZ: .22 }, { x: -8, z: v, halfX: .22, halfZ: .22 }]),
  ...[-56, -64].map(x => ({ x, z: 10, halfX: 1.2, halfZ: .6 })),
  { x: 17, z: 68, halfX: 1.2, halfZ: .6 },
  { x: -7, z: -47.7, halfX: .6, halfZ: .6 },
  { x: -6, z: 59.3, halfX: .6, halfZ: .6 },
  { x: 70, z: -7.7, halfX: .6, halfZ: .6 },
];

const roadProps = [
  ...DISTRICT_COLLIDERS,
  ...PARKED_CARS.map(({ x, z, rotation }) => ({
    x, z,
    halfX: Math.abs(Math.cos(rotation)) > 0.5 ? 2.3 : 1.15,
    halfZ: Math.abs(Math.cos(rotation)) > 0.5 ? 1.15 : 2.3,
  })),
  ...BENCHES.map(({ x, z, rotation }) => ({
    x, z,
    halfX: Math.abs(Math.cos(rotation)) > 0.5 ? 1.2 : 0.6,
    halfZ: Math.abs(Math.cos(rotation)) > 0.5 ? 0.6 : 1.2,
  })),
  ...LAMP_POSTS.map(({ x, z }) => ({
    x, z, halfX: 0.22, halfZ: 0.22,
  })),
  ...PLANTERS.map(({ x, z }) => ({
    x, z, halfX: 0.75, halfZ: 0.75,
  })),
  ...TREES.map(({ x, z }) => ({
    x, z, halfX: 0.4, halfZ: 0.4,
  })),
  { ...FOUNTAIN, halfX: 2.15, halfZ: 2.15 },
  { ...BUS_STOP, halfX: 1.75, halfZ: 0.85 },
];

export function blocked(x: number, z: number): boolean {
  if (Math.abs(x) > WORLD_RADIUS || Math.abs(z) > WORLD_RADIUS) return true;

  if (z > 75 && Math.abs(x) > 10) return true; // Harbor seawall; the center pier remains walkable.

  if (BUILDINGS.some((b) =>
    Math.abs(x - b.x) < b.w / 2 + 0.7 &&
    Math.abs(z - b.z) < b.d / 2 + 0.7
  )) return true;

  const radius = 0.42;

  return roadProps.some((p) =>
    Math.abs(x - p.x) < p.halfX + radius &&
    Math.abs(z - p.z) < p.halfZ + radius
  );
}

export function distance2D(
  ax: number, az: number, bx: number, bz: number
): number {
  return Math.hypot(ax - bx, az - bz);
}
