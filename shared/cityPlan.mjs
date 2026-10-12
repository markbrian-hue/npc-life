// Coordinates are meters. Every rendered road, map and placement rule uses this plan.
export const ROAD_SEGMENTS = [
  { id:'west-avenue', kind:'avenue', axis:'x', x:-65,z:0,length:110,width:8.5 },
  { id:'east-avenue', kind:'avenue', axis:'x', x:65,z:0,length:110,width:8.5 },
  { id:'north-avenue', kind:'avenue', axis:'z', x:0,z:-63,length:106,width:8.5 },
  { id:'dock-avenue', kind:'avenue', axis:'z', x:0,z:41.5,length:63,width:8.5 },
  { id:'grove-local', kind:'local', axis:'z', x:-92,z:-46,length:92,width:7 },
  { id:'north-collector', kind:'collector', axis:'x', x:12,z:-92,length:208,width:8.5 },
  { id:'east-collector', kind:'collector', axis:'z', x:94,z:-23,length:138,width:8.5 },
  { id:'dock-link', kind:'collector', axis:'x', x:47,z:46,length:94,width:8.5 },
  { id:'bypass', kind:'highway', axis:'z', x:116,z:-25,length:182,width:12 },
  { id:'bypass-south-link', kind:'collector', axis:'x', x:105,z:46,length:22,width:8.5 },
];
export const ROUND_ROADS = [
  {id:'fountain',x:0,z:0,inner:5.8,outer:12},
  {id:'grove',x:-92,z:-92,inner:0,outer:12},
];
export const PARK_PATHS = [
  {x:-59,z:-10,w:36,d:2.4}, {x:-59,z:10,w:36,d:2.4},
  {x:-78,z:0,w:2.4,d:22},{x:-40,z:0,w:2.4,d:22},
];
export const ACTIVITY_SITES = [
  {id:'board',name:'Resident bureau',x:6,z:22,kind:'jobs'},
  {id:'coffee',name:'Last Chance Coffee',x:57,z:6,kind:'shop'},
  {id:'garage',name:'Juniper Motor Club',x:-82,z:-71,kind:'garage'},
  {id:'court',name:'Juniper Court',x:-115,z:-48,kind:'activity',radius:12},
  {id:'depot',name:'Dispatch depot',x:8,z:-82,kind:'jobs'},
  {id:'bus',name:'City shuttle',x:21,z:6,kind:'transit'},
];
export function roadBounds(r,margin=0){return {x:r.x,z:r.z,w:(r.axis==='x'?r.length:r.width)+margin*2,d:(r.axis==='z'?r.length:r.width)+margin*2};}
export function inBox(x,z,b,margin=0){return Math.abs(x-b.x)<=b.w/2+margin && Math.abs(z-b.z)<=b.d/2+margin;}
export function footprint(b){const c=Math.abs(Math.cos(b.rotation||0)),s=Math.abs(Math.sin(b.rotation||0));return {x:b.x,z:b.z,w:c*b.w+s*b.d,d:s*b.w+c*b.d};}
export function overlaps(a,b,margin=0){return Math.abs(a.x-b.x)<(a.w+b.w)/2+margin && Math.abs(a.z-b.z)<(a.d+b.d)/2+margin;}
export function roadAt(x,z,margin=0){
  if(ROUND_ROADS.some(r=>Math.hypot(x-r.x,z-r.z)<r.outer+margin && Math.hypot(x-r.x,z-r.z)>Math.max(0,r.inner-margin)))return true;
  return ROAD_SEGMENTS.some(r=>inBox(x,z,roadBounds(r),margin));
}
export function roadOverlap(box,margin=0){
  return ROAD_SEGMENTS.some(r=>overlaps(box,roadBounds(r),margin)) || ROUND_ROADS.some(r=>{
    const dx=Math.max(0,Math.abs(box.x-r.x)-box.w/2),dz=Math.max(0,Math.abs(box.z-r.z)-box.d/2);
    return Math.hypot(dx,dz)<r.outer+margin;
  });
}
export function streetFacing(x,z){
  let nearest={distance:Infinity,x,z};
  for(const r of ROAD_SEGMENTS){const b=roadBounds(r);const px=r.axis==='x'?Math.max(b.x-b.w/2,Math.min(x,b.x+b.w/2)):r.x;const pz=r.axis==='z'?Math.max(b.z-b.d/2,Math.min(z,b.z+b.d/2)):r.z;const d=Math.hypot(x-px,z-pz);if(d<nearest.distance)nearest={distance:d,x:px,z:pz};}
  return Math.atan2(nearest.x-x,nearest.z-z);
}
// Reusable zoning/occupancy gate. Rejected candidates never get rendered or colliders.
export function placeCandidates(candidates,occupied=[],{roadClearance=0,gap=.5}={}){
  const accepted=[];
  for(const item of candidates){const box=footprint(item);if(roadOverlap(box,roadClearance)||[...occupied,...accepted].some(other=>overlaps(box,footprint(other),gap)))continue;accepted.push(item);}
  return accepted;
}
export const PARKING_BAYS = [
  {id:'sedan-1',x:8.4,z:33,w:3.4,d:6,rotation:0},
  {id:'sedan-2',x:-25,z:7.8,w:6,d:3.4,rotation:0},
  {id:'sedan-3',x:-8.5,z:-36,w:3.4,d:6,rotation:0},
  {id:'sedan-4',x:80,z:7.8,w:6,d:3.4,rotation:0},
  {id:'grove-1',x:-87,z:-69,w:3.4,d:6,rotation:0},
  {id:'grove-2',x:-103,z:-84,w:6,d:3.4,rotation:-.7},
];

export const ACTIVITY_ZONES=ACTIVITY_SITES.map(p=>({...p,w:p.id==='court'?17:6,d:p.id==='court'?24:6}));
