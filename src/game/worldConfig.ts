/**
 * NPC LIFE's current world dimensions, shared by collision, rendering and map UI.
 * This keeps the existing playable area exactly as it is during the foundation pass.
 * Future district expansion should update this model before any scene coordinates.
 */
export const WORLD = {
  minX: -42,
  maxX: 42,
  minZ: -42,
  maxZ: 42,
  groundSize: 95,
  roadWidth: 8.5,
  plazaRadius: 8.3,
} as const;

export const PLAYER_SPAWN = { x: 0, z: 0 } as const;
export const MAP_PIXELS = 336;

export type WorldPoint = { x: number; z: number };

export function inWorldBounds(x: number, z: number): boolean {
  return Number.isFinite(x) && Number.isFinite(z) &&
    x >= WORLD.minX && x <= WORLD.maxX &&
    z >= WORLD.minZ && z <= WORLD.maxZ;
}

export function worldToMap(point: WorldPoint): WorldPoint {
  return {
    x: ((point.x - WORLD.minX) / (WORLD.maxX - WORLD.minX)) * MAP_PIXELS,
    z: ((point.z - WORLD.minZ) / (WORLD.maxZ - WORLD.minZ)) * MAP_PIXELS,
  };
}

export function worldWidthToMap(width: number): number {
  return (width / (WORLD.maxX - WORLD.minX)) * MAP_PIXELS;
}

export function worldDepthToMap(depth: number): number {
  return (depth / (WORLD.maxZ - WORLD.minZ)) * MAP_PIXELS;
}

export function mapToWorld(point: WorldPoint): WorldPoint {
  return {
    x: WORLD.minX + (point.x / MAP_PIXELS) * (WORLD.maxX - WORLD.minX),
    z: WORLD.minZ + (point.z / MAP_PIXELS) * (WORLD.maxZ - WORLD.minZ),
  };
}

export type CurrentRoad = {
  id: 'east-west' | 'north-south';
  axis: 'x' | 'z';
  center: number;
  width: number;
};

/** Current crossroad representation, not a future lane-graph implementation. */
export const CURRENT_ROADS: readonly CurrentRoad[] = [
  { id: 'east-west', axis: 'x', center: 0, width: WORLD.roadWidth },
  { id: 'north-south', axis: 'z', center: 0, width: WORLD.roadWidth },
];
