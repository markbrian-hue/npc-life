export const WORLD_RADIUS = 136;
export const SPAWN = { x: 6.4, z: 16 };
export const GROVE = { x: -92, z: -92, radius: 12 };
export const ROUNDABOUT = { x: 0, z: 0, island: 5.5, inner: 6.2, outer: 12, pavement: 14 };

/** @type {Array<{x:number,z:number,w:number,d:number,h:number,color:string,roof:string,rotation?:number,kind?:string}>} */
export const BUILDINGS = [
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

// All facades face the nearest street; Grove homes face their cul-de-sac.
for (const b of BUILDINGS) b.rotation = Math.abs(b.z) > 40 && Math.abs(b.x) < 35 ? (b.x < 0 ? Math.PI / 2 : -Math.PI / 2) : (b.z > 0 ? Math.PI : 0);
/** @type {[number,number,string][]} */
const homes = [
  [-114,-91,'#cbb997'],[-109,-112,'#acb9a8'],[-89,-116,'#d7c2a4'],[-68,-106,'#c1b6a7'],[-69,-85,'#d6b6a2'],[-111,-69,'#b7c7b5'],
];
for (const [x,z,color] of homes) BUILDINGS.push({ x, z, w: 11, d: 8, h: 3.6, color, roof: '#725d50', kind: 'bungalow', rotation: Math.atan2(GROVE.x-x, GROVE.z-z) });

export const PALMS = [[-118,-102],[-100,-118],[-75,-115],[-65,-75],[-105,-62],[-101,-37],[-82,-53]];

export const PIGEONS = [
  { x: -9, z: 20 }, { x: 9, z: -30 }, { x: 9, z: 32 },
];

export const GARY = { x: 8, z: 25 };
export const BUS_STOP = { x: 24, z: 7.4, rotation: Math.PI };

export const FOUNTAIN = { x: 0, z: 0 };

export const PARKED_CARS = [
  { id: 'sedan-1', name: 'Civic Sedan', x: 8.4, z: 33, color: '#7d9b93', rotation: Math.PI / 2 },
  { id: 'sedan-2', name: 'Sunset Coupe', x: -25, z: 7.8, color: '#b76750', rotation: 0 },
  { id: 'sedan-3', name: 'Municipal Wagon', x: -8.5, z: -36, color: '#6c8599', rotation: -Math.PI / 2 },
  { id: 'sedan-4', name: 'Market Cruiser', x: 80, z: 7.8, color: '#bfa576', rotation: Math.PI },
  { id: 'grove-1', name: 'Grove Classic', x: -89, z: -69, color: '#578968', rotation: Math.PI / 2 },
  { id: 'grove-2', name: 'Palm Coupe', x: -103, z: -84, color: '#c7b9a3', rotation: -.7 },
];

export const BENCHES = [
  { x: -14, z: 8, rotation: Math.PI / 2 },
  { x: 14, z: -8, rotation: -Math.PI / 2 },
  { x: -8, z: -14, rotation: 0 },
  { x: 8, z: 14, rotation: Math.PI },
];

export const LAMP_POSTS = [
  { x: -8, z: -12 }, { x: 8, z: 12 }, { x: -28, z: 8 },
  { x: 28, z: -8 }, { x: -8, z: 28 }, { x: 8, z: -28 },
];

export const PLANTERS = [
  { x: -37, z: 29 }, { x: 37, z: 29 },
  { x: -37, z: -29 }, { x: 37, z: -29 },
  { x: -9.3, z: 11.3 }, { x: 9.3, z: -11.3 },
];

// Trees stay in landscaped perimeter strips.
// Validation also protects against future building changes.
const TREE_CANDIDATES = [
  [-121,-76],[-120,-112],[-101,-123],[-73,-123],[-59,-107],[-73,-65],[-111,-47],[-105,-25],[-117,16],[108,-22],[118,22],
  ...[-78, -62, -46, 46, 62, 78].flatMap(x => [-38, 38].map(z => [x, z])),
  ...[-78, -62, -46, 46, 62].flatMap(z => [-38, 38].map(x => [x, z])),
  [-74, -14], [-54, -18], [-46, 17], [-68, 16], [-79, 9],
  [-37, -35], [-26, -35], [-13, -35],
  [13, -35], [26, -35], [37, -35],
  [-37, 35], [-26, 35], [-13, 35],
  [13, 35], [26, 35], [37, 35],
  [-40, -27], [-40, -7.5],
  [-40, 7.5], [-40, 27],
  [40, -27], [40, -7.5],
  [40, 7.5], [40, 27],
];

function safeTree(x, z) {
  if (onRoad(x,z) || Math.abs(x) < 7 || Math.abs(z) < 7) return false;
  if (Math.abs(x) > WORLD_RADIUS - 2 || Math.abs(z) > WORLD_RADIUS - 2) return false;

  return !BUILDINGS.some((b) =>
    Math.abs(x - b.x) < (Math.abs(Math.cos(b.rotation || 0))*b.w + Math.abs(Math.sin(b.rotation || 0))*b.d) / 2 + 2.4 &&
    Math.abs(z - b.z) < (Math.abs(Math.sin(b.rotation || 0))*b.w + Math.abs(Math.cos(b.rotation || 0))*b.d) / 2 + 2.4
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
  ...PALMS.map(([x,z]) => ({x,z,halfX:.4,halfZ:.4})),
  ...TREES.map(({ x, z }) => ({
    x, z, halfX: 0.4, halfZ: 0.4,
  })),
  { x: -8, z: -18, halfX: 1.7, halfZ: .85 },
  { ...BUS_STOP, halfX: 1.75, halfZ: 0.85 },
];

export function blocked(x, z, radius = .42) {
  if (Math.abs(x) + radius > WORLD_RADIUS || Math.abs(z) + radius > WORLD_RADIUS) return true;

  if (z + radius > 93 || (z > 75 && Math.abs(x) + radius > 10)) return true; // Harbor seawall; the center pier remains walkable.

  if (Math.hypot(x, z) < 3.1 + radius) return true;
  if (BUILDINGS.some(b => {
    const c = Math.cos(b.rotation || 0), s = Math.sin(b.rotation || 0), dx = x - b.x, dz = z - b.z;
    return Math.abs(c * dx - s * dz) < b.w / 2 + radius && Math.abs(s * dx + c * dz) < b.d / 2 + radius;
  })) return true;



  return roadProps.some((p) =>
    Math.abs(x - p.x) < p.halfX + radius &&
    Math.abs(z - p.z) < p.halfZ + radius
  );
}

export function distance2D(
  ax, az, bx, bz
) {
  return Math.hypot(ax - bx, az - bz);
}

export function onRoad(x, z) {
  const r = Math.hypot(x, z);
  if (r < ROUNDABOUT.inner) return false;
  return r < ROUNDABOUT.outer || Math.abs(x) < 4.25 || Math.abs(z) < 4.25 ||
    (Math.abs(x - GROVE.x) < 4.25 && z >= GROVE.z && z <= 0) ||
    (Math.abs(z - GROVE.z) < 4.25 && x >= GROVE.x && x <= 0) || Math.hypot(x-GROVE.x,z-GROVE.z) < GROVE.radius;
}
