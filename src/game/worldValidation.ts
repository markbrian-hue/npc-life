import {
  BUILDINGS,
  GARY,
  PARKED_CARS,
  TREES,
  blocked,
} from './world';
import { CURRENT_ROADS, inWorldBounds, PLAYER_SPAWN } from './worldConfig';

export type WorldIssue = {
  severity: 'error' | 'warning';
  code:
    | 'OUT_OF_BOUNDS'
    | 'BUILDING_OVERLAP'
    | 'BUILDING_IN_ROAD'
    | 'TREE_IN_ROAD'
    | 'TREE_IN_BUILDING'
    | 'CAR_IN_BUILDING'
    | 'UNSAFE_PLAYER_SPAWN'
    | 'UNSAFE_NPC_SPAWN';
  subject: string;
  message: string;
};

type Rect = {
  x: number;
  z: number;
  halfX: number;
  halfZ: number;
};

function overlapping(a: Rect, b: Rect, padding = 0): boolean {
  return Math.abs(a.x - b.x) < a.halfX + b.halfX + padding &&
    Math.abs(a.z - b.z) < a.halfZ + b.halfZ + padding;
}

function buildingRect(building: typeof BUILDINGS[number]): Rect {
  return {
    x: building.x,
    z: building.z,
    halfX: building.w / 2,
    halfZ: building.d / 2,
  };
}

function inRoad(rect: Rect): boolean {
  return CURRENT_ROADS.some(road =>
    road.axis === 'x'
      ? Math.abs(rect.z - road.center) < rect.halfZ + road.width / 2
      : Math.abs(rect.x - road.center) < rect.halfX + road.width / 2
  );
}

/**
 * Static-placement diagnostics; does not pretend to validate NPC waypoint
 * connectivity, traffic paths, orientation, or dynamic vehicle physics.
 */
export function validateWorld(): WorldIssue[] {
  const issues: WorldIssue[] = [];
  const buildingRects = BUILDINGS.map(buildingRect);

  BUILDINGS.forEach((building, index) => {
    const rect = buildingRects[index];
    const id = `building-${index}`;
    if (!inWorldBounds(rect.x - rect.halfX, rect.z - rect.halfZ) ||
        !inWorldBounds(rect.x + rect.halfX, rect.z + rect.halfZ)) {
      issues.push({severity: 'error', code: 'OUT_OF_BOUNDS', subject: id,
        message: `${id} extends outside the playable world`});
    }
    if (inRoad(rect)) {
      issues.push({severity: 'error', code: 'BUILDING_IN_ROAD', subject: id,
        message: `${id} overlaps the current crossroad`});
    }
    for (let j = index + 1; j < buildingRects.length; j += 1) {
      if (overlapping(rect, buildingRects[j])) {
        issues.push({severity: 'error', code: 'BUILDING_OVERLAP', subject: id,
          message: `${id} overlaps building-${j}`});
      }
    }
  });

  TREES.forEach((tree, index) => {
    const id = `tree-${index}`;
    const footprint = { ...tree, halfX: 0.75, halfZ: 0.75 };
    if (!inWorldBounds(tree.x, tree.z)) {
      issues.push({severity: 'error', code: 'OUT_OF_BOUNDS', subject: id,
        message: `${id} is outside playable world bounds`});
    }
    if (inRoad(footprint)) {
      issues.push({severity: 'error', code: 'TREE_IN_ROAD', subject: id,
        message: `${id} overlaps a road`});
    }
    if (buildingRects.some(rect => overlapping(footprint, rect))) {
      issues.push({severity: 'error', code: 'TREE_IN_BUILDING', subject: id,
        message: `${id} overlaps a building`});
    }
  });

  PARKED_CARS.forEach((car, index) => {
    const horizontal = Math.abs(Math.cos(car.rotation)) > 0.5;
    const footprint: Rect = {
      x: car.x, z: car.z,
      halfX: horizontal ? 2.3 : 1.15,
      halfZ: horizontal ? 1.15 : 2.3,
    };
    if (buildingRects.some(rect => overlapping(footprint, rect))) {
      issues.push({severity: 'error', code: 'CAR_IN_BUILDING',
        subject: `parked-car-${index}`,
        message: `parked-car-${index} overlaps a building`});
    }
  });

  if (blocked(PLAYER_SPAWN.x, PLAYER_SPAWN.z)) {
    issues.push({severity: 'error', code: 'UNSAFE_PLAYER_SPAWN',
      subject: 'player', message: 'Initial player spawn is blocked'});
  }

  if (blocked(GARY.x, GARY.z)) {
    issues.push({severity: 'warning', code: 'UNSAFE_NPC_SPAWN',
      subject: 'gary', message: 'Gary is placed inside a static collider'});
  }

  return issues;
}
