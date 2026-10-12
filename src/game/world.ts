export type BuildingDef = {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  roof: string;
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
  { x: -7, z: 6 },
  { x: 9, z: -7 },
  { x: 10, z: 10 },
] as const;

export const GARY = { x: 3, z: 3 };

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
  { x: -8, z: -12 },
  { x: 8, z: 12 },
  { x: -28, z: 8 },
  { x: 28, z: -8 },
  { x: -8, z: 28 },
  { x: 8, z: -28 },
] as const;

export const PLANTERS = [
  { x: -37, z: 29 },
  { x: 37, z: 29 },
  { x: -37, z: -29 },
  { x: 37, z: -29 },
  { x: -6, z: 11 },
  { x: 6, z: -11 },
] as const;

const PROP_COLLIDERS = [
  ...PARKED_CARS.map(({ x, z }) => ({
    x,
    z,
    halfX: 2.3,
    halfZ: 1.15,
  })),
  ...BENCHES.map(({ x, z }) => ({
    x,
    z,
    halfX: 1.2,
    halfZ: 0.6,
  })),
  ...LAMP_POSTS.map(({ x, z }) => ({
    x,
    z,
    halfX: 0.22,
    halfZ: 0.22,
  })),
  ...PLANTERS.map(({ x, z }) => ({
    x,
    z,
    halfX: 0.75,
    halfZ: 0.75,
  })),
];

export function blocked(
  x: number,
  z: number
): boolean {
  if (Math.abs(x) > 42 || Math.abs(z) > 42) {
    return true;
  }

  if (
    BUILDINGS.some(
      (b) =>
        Math.abs(x - b.x) < b.w / 2 + 0.7 &&
        Math.abs(z - b.z) < b.d / 2 + 0.7
    )
  ) {
    return true;
  }

  const playerRadius = 0.45;

  return PROP_COLLIDERS.some(
    (prop) =>
      Math.abs(x - prop.x) <
        prop.halfX + playerRadius &&
      Math.abs(z - prop.z) <
        prop.halfZ + playerRadius
  );
}

export function distance2D(
  ax: number,
  az: number,
  bx: number,
  bz: number
): number {
  return Math.hypot(ax - bx, az - bz);
}