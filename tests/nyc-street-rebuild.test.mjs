import {test} from 'node:test';
import assert from 'node:assert/strict';
import {REBUILT_CIVIC_ROADS,EXTENDED_NYC_ROADS,CITY_CROSSINGS,URBAN_GROUND_ZONES,generateStreetInfill} from '../shared/nycStreetRevamp.mjs';
import {WORLD_RADIUS,ROUND_ROADS,BUILDINGS,CITY_SIGNAL_POSTS,ROAD_SEGMENTS,
 blocked,onRoad,roadAt,roadOverlap,footprint,validateWorld,SPAWN} from '../shared/world.mjs';
import {JOBS} from '../shared/residentLife.mjs';
import {createFleet,carBlocked} from '../shared/vehicles.mjs';
import {walkingRoute} from './pathing.mjs';

test('old downtown fountain is physically removed and Broadway is a drivable crossing',()=>{
 assert.equal(ROUND_ROADS.some(r=>r.id==='fountain'),false);
 assert.equal(roadAt(0,0),true,'street asphalt replaces central fountain island');
 assert.equal(blocked(0,0),false,'walkable crossing, not invisible center collider');
 for(const [x,z] of [[0,0],[-8,0],[8,0],[0,-8],[0,8]])
  assert.equal(roadAt(x,z),true,'both streets connect at Broadway');
 const vehicle={...createFleet()[0],id:'crossing-probe',x:0,z:0,heading:0};
 assert.equal(carBlocked(vehicle,[]),false,'cars can drive directly through former fountain');
 assert.ok(REBUILT_CIVIC_ROADS.length>=6);
});

test('new uptown extension is a physically continuous city, not decorative terrain',()=>{
 assert.equal(WORLD_RADIUS,460);
 assert.ok(ROAD_SEGMENTS.length>=60);
 assert.ok(EXTENDED_NYC_ROADS.length>=17);
 for(const x of [-235,-190,-146,-100,-51,0,50,116,168,217,261]){
  for(const z of [-362,-400,-438])
   assert.equal(roadAt(x,z),true,'avenue and cross street connect: '+x+'/'+z);
 }
 for(const point of [{x:-235,z:-427},{x:0,z:-440},{x:261,z:-432}]){
  assert.equal(blocked(point.x,point.z),false,'actual accessible extended roadway');
  assert.ok(walkingRoute(SPAWN,point).length,'pathable extension '+JSON.stringify(point));
 }
 assert.equal(blocked(0,-461),true,'real outer world boundary');
 assert.ok(URBAN_GROUND_ZONES.some(z=>z.z<-350),'northern urban pavement included');
});
test('empty street corridors receive real collidable buildings and safe crossing signals',()=>{
 assert.ok(generateStreetInfill(ROAD_SEGMENTS).length>100,'substantial proposed frontage');
 const added=BUILDINGS.filter(p=>p.z<-338);
 assert.ok(added.length>=10,'new northern neighborhoods have real lots');
 assert.ok(added.some(p=>p.h>=25),'skyline architecture extends north');
 for(const b of added){
  assert.equal(roadOverlap(footprint(b),1.8),false,'lot has sidewalk clearance');
  assert.equal(blocked(b.x,b.z),true,'rendered lot has same collision');
 }
 assert.ok(CITY_SIGNAL_POSTS.length>=5,'accepted intersection lights');
 for(const p of CITY_SIGNAL_POSTS){
  assert.equal(blocked(p.x,p.z,.08),true,'signal post is solid');
  assert.equal(onRoad(p.x,p.z),false,'post stays off drivable lanes');
 }
 assert.ok(CITY_CROSSINGS.length>=35);
 for(const p of CITY_CROSSINGS)assert.equal(roadAt(p.x,p.z),true,p.id);
});
test('revamp keeps jobs and garages usable without rewriting old save positions',()=>{
 assert.deepEqual(validateWorld(),[]);
 for(const job of JOBS)for(const p of job.stops){
  assert.equal(blocked(p.x,p.z),false,'old job point clear: '+job.id+' '+p.action);
  assert.ok(walkingRoute(SPAWN,p).length,'walk to '+job.id+' '+p.action);
 }
 assert.equal(blocked(SPAWN.x,SPAWN.z),false);
});
