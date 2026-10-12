
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
const TREE_CANDIDATES = [
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
  if (Math.abs(x) > 41 || Math.abs(z) > 41) return false;

  return !BUILDINGS.some((b) =>
    Math.abs(x - b.x) < b.w / 2 + 2.4 &&
    Math.abs(z - b.z) < b.d / 2 + 2.4
  );
}

export const TREES = TREE_CANDIDATES
  .filter(([x, z]) => safeTree(x, z))
  .map(([x, z]) => ({ x, z }));

const roadProps = [
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
  if (Math.abs(x) > 42 || Math.abs(z) > 42) return true;

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
