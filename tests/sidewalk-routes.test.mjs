// QA audit M3 (docs/qa-audit-2026-10.md): pedestrians walk long sidewalk runs
// across the city, never through buildings, props or traffic lanes.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PEDESTRIAN_ROUTES,sidewalkRuns} from '../shared/sidewalkRoutes.mjs';
import {blocked,roadAt} from '../shared/world.mjs';
import {AVATAR_RADIUS} from '../shared/avatarDimensions.mjs';

test('every pedestrian route is clear pavement end to end',()=>{
 assert.ok(PEDESTRIAN_ROUTES.length>=12,`${PEDESTRIAN_ROUTES.length} routes`);
 for(const r of PEDESTRIAN_ROUTES){
  assert.ok(r.length>=40,`${r.id} is ${r.length} m`);
  for(let t=0;t<=1;t+=.5/r.length){
   const x=r.from.x+(r.to.x-r.from.x)*t,z=r.from.z+(r.to.z-r.from.z)*t;
   assert.equal(blocked(x,z,AVATAR_RADIUS),false,`${r.id} blocked at ${x.toFixed(1)},${z.toFixed(1)}`);
   assert.equal(roadAt(x,z),false,`${r.id} enters the road at ${x.toFixed(1)},${z.toFixed(1)}`);
  }
 }
});

test('pedestrians are spread across the old town and the NYC districts',()=>{
 const uptown=PEDESTRIAN_ROUTES.filter(r=>r.mid.z<-214).length,downtown=PEDESTRIAN_ROUTES.filter(r=>r.mid.z>-130).length;
 assert.ok(uptown>=3,`${uptown} uptown routes`);
 assert.ok(downtown>=3,`${downtown} downtown routes`);
 for(let i=0;i<PEDESTRIAN_ROUTES.length;i++)for(let j=i+1;j<PEDESTRIAN_ROUTES.length;j++){
  const a=PEDESTRIAN_ROUTES[i].mid,b=PEDESTRIAN_ROUTES[j].mid;
  assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=45,'routes are spaced apart');
 }
});

test('route generation is deterministic',()=>{
 assert.deepEqual(sidewalkRuns().slice(0,10).map(r=>r.id),sidewalkRuns().slice(0,10).map(r=>r.id));
});
