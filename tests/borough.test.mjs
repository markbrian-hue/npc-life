import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BOROUGHS,BOROUGH_PARCELS,boroughAt} from '../shared/boroughPlan.mjs';
import {BUILDINGS,SPAWN,TREES,blocked,validateWorld,roadOverlap,footprint,ACTIVITY_SITES} from '../shared/world.mjs';
import {ROOFTOP_LADDERS,platformsAt} from '../shared/verticalTraversal.mjs';
import {walkingRoute} from './pathing.mjs';

test('named Midtown and Eastbank districts have dense distinct authentic building types',()=>{
 const towers=BUILDINGS.filter(p=>p.kind==='tower'),rows=BUILDINGS.filter(p=>p.kind==='brownstone');
 assert.equal(BOROUGHS.length,2);
 assert.ok(towers.length>=4,'Midtown towers exist');
 assert.ok(rows.length>=4,'Brooklyn-style brownstone blocks exist');
 assert.ok(Math.max(...towers.map(p=>p.h))>=30,'actual skyline increases above former neighborhood');
 assert.ok(rows.every(p=>p.h>=10&&p.h<=17),'brownstones stay human scale');
 assert.equal(boroughAt(18,-168)?.id,'midtown');
 assert.equal(boroughAt(166,-46)?.id,'brownstone');
 assert.equal(boroughAt(0,0),null);
 // Optional infill is filtered using the existing collision-safe placement gate.
 assert.ok(BOROUGH_PARCELS.length>=12);
});
test('infill never alters old travel, occupied garages or civic destinations',()=>{
 assert.deepEqual(validateWorld(),[],'district placement validation');
 assert.equal(blocked(SPAWN.x,SPAWN.z),false);
 for(const p of ACTIVITY_SITES){assert.equal(blocked(p.x,p.z),false,p.name);assert.ok(walkingRoute(SPAWN,p).length,p.name);}
 for(const b of BUILDINGS)assert.equal(roadOverlap(footprint(b),1.8),false,'sidewalk clearance');
 for(const t of TREES)assert.equal(BUILDINGS.some(b=>Math.hypot(b.x-t.x,b.z-t.z)<1),false);
});
test('higher façades and foot-level world collision share exactly the same height',()=>{
 for(const b of BUILDINGS.filter(b=>b.kind==='tower').slice(0,6)){
  const roof=platformsAt(b.x,b.z).find(p=>Math.abs(p.y-(b.h+.075))<.0001);
  assert.ok(roof,'tower has a supported roof');
  assert.equal(blocked(b.x,b.z,.42,0),true);
  assert.equal(blocked(b.x,b.z,.42,b.h+.1),false);
 }
 const boroughLadders=ROOFTOP_LADDERS.filter(l=>['tower','brownstone'].includes(l.building.kind));
 assert.ok(boroughLadders.some(l=>l.building.kind==='tower'),'accessible Midtown rooftops');
 assert.ok(boroughLadders.some(l=>l.building.kind==='brownstone'),'accessible Eastbank rooftops');
 for(const l of boroughLadders){
  assert.equal(blocked(l.landing.x,l.landing.z,.42,l.roof),false,'walkable ladder landing');
  assert.ok(platformsAt(l.landing.x,l.landing.z).some(p=>p.id==='building:'+l.index));
 }
});
