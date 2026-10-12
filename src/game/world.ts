
export type BuildingDef = {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  roof: string;
};

// Preserve the existing city layout.
export const BUILDINGS: BuildingDef[] = [
  { x: -16, z: -17, w: 10, d: 8, h: 10, color: '#e8a67b', roof: '#8c5251' },
  { x: 16, z: -17, w: 10, d: 8, h: 13, color: '#8bc0bc', roof: '#477888' },
  { x: -17, z: 17, w: 11, d: 8, h: 8, color: '#c8adf1', roof: '#796aa8' },
  { x: 17, z: 17, w: 11, d: 8, h: 7, color: '#f2cf82', roof: '#a77f45' },
  { x: -32, z: -17, w: 10, d: 10, h: 7, color: '#e68f93', roof: '#a25e71' },
  { x: 32, z: -17, w: 10, d: 10, h: 9, color: '#a2c9f4', roof: '#6789af' },
  { x: -32, z: 17, w: 10, d: 10, h: 12, color: '#90cda0', roof: '#47745d' },
  { x: 32, z: 17, w: 10, d: 10, h: 8, color: '#f1bba9', roof: '#ab6a70' },
];

export const PIGEONS = [
  { x: -7, z: 6 },
  { x: 9, z: -7 },
  { x: 10, z: 10 },
] as const;

export const GARY = { x: 3, z: 3 };

// Shared procedural prop coordinates.
export const PARKED_CARS = [
  { x: -25, z: 2.5, color: '#db6c60' },
  { x: 25, z: -2.5, color: '#557c9b' },
] as const;

export const BENCHES = [
  { x: -12, z: 9, rotation: 0 },
  { x: 12, z: -9, rotation: Math.PI },
] as const;

export const LAMP_POSTS = [
  { x: -8, z: -12 },
  { x: 8, z: 12 },
  { x: -28, z: 8 },
  { x: 28, z: -8 },
] as const;

const PROP_COLLIDERS = [
  ...PARKED_CARS.map(({ x, z }) => ({
    x,
    z,
    halfX: 2.25,
    halfZ: 1.1,
  })),
  ...BENCHES.map(({ x, z }) => ({
    x,
    z,
    halfX: 1.15,
    halfZ: 0.55,
  })),
  ...LAMP_POSTS.map(({ x, z }) => ({
    x,
    z,
    halfX: 0.2,
    halfZ: 0.2,
  })),
];

export function blocked(x: number, z: number): boolean {
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
      Math.abs(x - prop.x) < prop.halfX + playerRadius &&
      Math.abs(z - prop.z) < prop.halfZ + playerRadius
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
