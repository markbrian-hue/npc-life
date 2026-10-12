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

export function blocked(x: number, z: number) {
  if (Math.abs(x) > 42 || Math.abs(z) > 42) return true;
  return BUILDINGS.some(
    (b) => Math.abs(x - b.x) < b.w / 2 + 0.7 && Math.abs(z - b.z) < b.d / 2 + 0.7,
  );
}

export function distance2D(ax: number, az: number, bx: number, bz: number) {
  return Math.hypot(ax - bx, az - bz);
}
