import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NYC_EXPANSION_ROADS,NYC_BLOCK_CANDIDATES,NYC_PUBLIC_SPACES,NYC_DISTRICTS,NYC_CROSSINGS,NYC_RIVER,inNYCExpansion} from '../shared/nycExpansion.mjs';
import {ROAD_SEGMENTS,BUILDINGS,WORLD_RADIUS,SPAWN,ACTIVITY_SITES,blocked,roadAt,roadOverlap,footprint,validateWorld,TREES} from '../shared/world.mjs';
import {platformsAt,ROOFTOP_LADDERS} from '../shared/verticalTraversal.mjs';
import {walkingRoute} from './pathing.mjs';

test('connected northern Manhattan grid genuinely increases playable world size',()=>{
 assert.equal(WORLD_RADIUS,340);
 assert.ok(NYC_EXPANSION_ROADS.length>=15);
 assert.ok(ROAD_SEGMENTS.length>=31);
 assert.ok(roadAt(0,-184),'former Northgate approach still joins the city');
 assert.ok(roadAt(0,-195),'Broadway connector joins the old road');
 assert.ok(roadAt(0,-263),'avenue and numbered street connect');
 assert.ok(roadAt(261,-307),'eastern borough opens onto grid');
 assert.ok(roadAt(-146,-307),'westernmost Manhattan blocks join the street grid');
 assert.equal(blocked(0,-263),false,'player can enter Midtown');
 assert.equal(blocked(260,-307),false,'player can reach Brooklyn Row');
 assert.equal(blocked(0,-339),false,'expanded north border is walkable');
 assert.equal(blocked(0,-341),true,'world still has finite physical limits');
 assert.equal(blocked(NYC_RIVER.x,NYC_RIVER.z),true,'deep river is not a walkable field');
 assert.ok(inNYCExpansion(0,-263));
 assert.equal(inNYCExpansion(0,0),false);
});
test('NYC blocks have real building collision and roofs, while existing sites remain reachable',()=>{
 const additions=BUILDINGS.filter(p=>p.z<=-219);
 const proposed=NYC_BLOCK_CANDIDATES.length;
 assert.ok(proposed>=70,'enough proposed town blocks');
 assert.ok(additions.length>=40,'many real new buildings accepted');
 assert.ok(Math.max(...additions.map(p=>p.h))>=50,'Manhattan skyline has towers');
 assert.ok(additions.some(p=>p.kind==='brownstone'),'Brooklyn-scale housing exists');
 for(const p of additions){
  assert.equal(roadOverlap(footprint(p),1.8),false,'no building in a traffic lane');
  assert.equal(blocked(p.x,p.z,.42,0),true,'solid collision on the ground');
  assert.ok(platformsAt(p.x,p.z).some(s=>Math.abs(s.y-p.h-.075)<1e-5),'roofs follow actual rendered height');
 }
 assert.deepEqual(validateWorld(),[],'all base and new placement rules hold');
 assert.equal(blocked(SPAWN.x,SPAWN.z),false);
 for(const site of ACTIVITY_SITES)assert.ok(walkingRoute(SPAWN,site).length,'mission preserved: '+site.id);
});
test('Manhattan plazas, street crossings, water and trees are deterministic and aligned',()=>{
 assert.equal(NYC_PUBLIC_SPACES.length,3);
 assert.ok(NYC_DISTRICTS.length>=5);
 assert.ok(NYC_CROSSINGS.length>=12);
 for(const cross of NYC_CROSSINGS)assert.equal(roadAt(cross.x,cross.z),true,cross.id);
 for(const p of NYC_PUBLIC_SPACES){
  assert.equal(blocked(p.x,p.z),false,'open park/plaza/promenade: '+p.id);
  assert.ok(!BUILDINGS.some(b=>Math.abs(b.x-p.x)<b.w/2&&Math.abs(b.z-p.z)<b.d/2),'unoccupied plaza: '+p.id);
 }
 for(const tree of TREES)assert.equal(roadAt(tree.x,tree.z,2),false,'tree not on road');
 const newLadders=ROOFTOP_LADDERS.filter(l=>l.building.z<-214);
 assert.ok(newLadders.length>=3,'elevated exploration can reach the new blocks');
 for(const ladder of newLadders)assert.equal(blocked(ladder.landing.x,ladder.landing.z,.42,ladder.roof),false);
});
