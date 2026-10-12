
import { BUILDINGS } from './world';

type Vec3 = {
  x: number;
  y: number;
  z: number;
};

type Bounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
};

const PADDING = 0.30;

// Create collision boxes once instead of every frame.
const BUILDING_BOXES: Bounds[] = BUILDINGS.map((building) => ({
  minX: building.x - building.w / 2 - PADDING,
  maxX: building.x + building.w / 2 + PADDING,
  minY: -0.2,
  maxY: building.h + 0.85,
  minZ: building.z - building.d / 2 - PADDING,
  maxZ: building.z + building.d / 2 + PADDING,
}));

/**
 * Returns a safe camera distance along a normalized
 * direction vector, stopping in front of buildings.
 */
export function safeCameraDistance(
  origin: Vec3,
  direction: Vec3,
  wantedDistance: number
): number {
  let nearestHit = Infinity;

  for (const box of BUILDING_BOXES) {
    let enter = -Infinity;
    let exit = Infinity;
    let misses = false;

    const slabs: [number, number, number, number][] = [
      [origin.x, direction.x, box.minX, box.maxX],
      [origin.y, direction.y, box.minY, box.maxY],
      [origin.z, direction.z, box.minZ, box.maxZ],
    ];

    for (const [coordinate, component, min, max] of slabs) {
      if (Math.abs(component) < 1e-8) {
        if (coordinate < min || coordinate > max) {
          misses = true;
          break;
        }
      } else {
        const a = (min - coordinate) / component;
        const b = (max - coordinate) / component;

        enter = Math.max(enter, Math.min(a, b));
        exit = Math.min(exit, Math.max(a, b));

        if (enter > exit) {
          misses = true;
          break;
        }
      }
    }

    // Ignore a box if the smoothed focus is inside it.
    if (
      !misses &&
      enter > 0 &&
      exit >= enter &&
      enter < nearestHit
    ) {
      nearestHit = enter;
    }
  }

  // Keep the camera in front of the wall surface.
  return Number.isFinite(nearestHit)
    ? Math.max(
        0.35,
        Math.min(wantedDistance, nearestHit - 0.48)
      )
    : wantedDistance;
}
