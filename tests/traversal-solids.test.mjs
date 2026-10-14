// Regressions for the October 2026 QA audit (docs/qa-audit-2026-10.md):
// C1/C2 roof walk-off soft-locks, C3 vehicle overlap pinning, H1 jumping onto
// vehicles, H2 invisible 8 m prop walls, H3 rooftop access.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BUILDINGS,WORLD_COLLIDERS,blocked,roadAt} from '../shared/world.mjs';
import {PLAYER_STEP,stepPlayer,freshPlayer,groundHeight} from '../shared/playerPhysics.mjs';
import {solidBlocked,solidsAt,supportsAt,vehicleSolids} from '../shared/solids.mjs';
import {ROOFTOP_LADDERS,vehicleRoof} from '../shared/verticalTraversal.mjs';
import {vehicleState} from '../shared/vehicles.mjs';
import {AVATAR_RADIUS} from '../shared/avatarDimensions.mjs';

// An open 24 m square in the northern grid, verified below.
const SITE={x:-200,z:-364};
const still={x:0,z:0,jump:false,climb:false};
const bodyBlocked=(s,cars)=>(x,z,feet=s.y,step=0)=>solidBlocked(x,z,AVATAR_RADIUS,feet,cars,groundHeight,step);
const run=(s,cars,input,frames)=>{const b=bodyBlocked(s,cars);for(let i=0;i<frames;i++)stepPlayer(s,input,PLAYER_STEP,b,cars);return s;};
const parked=(model,heading=0)=>({id:'test-'+model,x:SITE.x,z:SITE.z,heading,...vehicleState(model)});
const canMove=(s,cars)=>{const b=bodyBlocked(s,cars);return [0,1,2,3,4,5,6,7].some(a=>!b(s.x+Math.cos(a*Math.PI/4)*.1,s.z+Math.sin(a*Math.PI/4)*.1,s.y));};

test('test site is open ground',()=>{
 for(let x=-12;x<=12;x+=.5)for(let z=-12;z<=12;z+=.5)assert.equal(blocked(SITE.x+x,SITE.z+z,.6,0),false);
});

test('C1: walking off any car roof lands beside the car, never inside it',()=>{
 for(const model of ['sedan','coupe','suv','pickup','minivan','bus','hyper'])for(const [dx,dz] of [[0,1],[1,0],[0,-1],[-1,0]]){
  const car=parked(model,.4),cars=[car],roof=vehicleRoof(car,groundHeight);
  const s=freshPlayer(roof.x,roof.z);s.y=roof.y+.3;s.grounded=false;
  run(s,cars,still,60);
  assert.equal(s.support,'vehicle:'+car.id,model+' starts on roof');
  run(s,cars,{...still,x:dx*5.6,z:dz*5.6},360);
  assert.ok(s.y<.1,`${model} reached the street`);
  assert.equal(bodyBlocked(s,cars)(s.x,s.z,s.y),false,`${model} ${dx},${dz} not inside the vehicle`);
  assert.ok(canMove(s,cars),`${model} ${dx},${dz} can keep walking`);
 }
});

test('C2: walking off building roofs never traps the player in the façade',()=>{
 for(const index of [0,1,2,5,40,90,150]){
  const b=BUILDINGS[index];
  for(const angle of [0,Math.PI/2,Math.PI,3*Math.PI/2]){
   const s=freshPlayer(b.x,b.z);s.y=b.h+.4;s.grounded=false;
   run(s,[],still,60);
   assert.equal(s.support,'building:'+index);
   run(s,[],{...still,x:Math.cos(angle)*5.6,z:Math.sin(angle)*5.6},1400);
   assert.equal(bodyBlocked(s,[])(s.x,s.z,s.y),false,`building ${index} angle ${angle}`);
   assert.ok(canMove(s,[]),`building ${index} angle ${angle} free to move`);
  }
 }
});

test('C3: a vehicle overlapping the player pushes them clear instead of pinning them',()=>{
 for(const offset of [0,.6,1.2]){
  const car=parked('sedan'),s=freshPlayer(SITE.x,SITE.z+offset),start=s.z;
  run(s,[car],{...still,z:5.6},240);
  assert.ok(s.z-start>1,'walked away from overlap '+offset);
  assert.equal(bodyBlocked(s,[car])(s.x,s.z,s.y),false);
 }
});

test('H1: running jumps reach car roofs from the side without any extra key',()=>{
 for(const model of ['sedan','coupe','suv','pickup','taxi','minivan','ambulance']){
  let success=0,tries=0;
  for(let at=.6;at<=4.01;at+=.2){
   tries++;
   const car=parked(model),cars=[car],s=freshPlayer(SITE.x,SITE.z+6);let jumped=false,reached=false;
   const b=bodyBlocked(s,cars);
   for(let i=0;i<420;i++){const jump=!jumped&&s.z-SITE.z<=at;if(jump)jumped=true;stepPlayer(s,{...still,z:-5.6,jump},PLAYER_STEP,b,cars);if(s.support==='vehicle:'+car.id)reached=true;}
   if(reached)success++;
  }
  assert.ok(success/tries>=.5,`${model}: ${success}/${tries} jump timings reach the roof`);
 }
});

test('H1: end-on approach jumps onto the hood then climbs onto the roof by walking',()=>{
 const car=parked('sedan'),cars=[car],s=freshPlayer(SITE.x+8,SITE.z),b=bodyBlocked(s,cars);
 let jumped=false;const seen=new Set();
 for(let i=0;i<300;i++){const jump=!jumped&&s.x-SITE.x<=3.2;if(jump)jumped=true;stepPlayer(s,{...still,x:-5.6,jump},PLAYER_STEP,b,cars);if(s.support)seen.add(s.support);}
 assert.ok(seen.has('vehicle:'+car.id+'#hood'),'stood on hood');
 assert.ok(seen.has('vehicle:'+car.id),'climbed onto roof');
});

test('holding E while stepping off a roof does not snap the player back onto it',()=>{
 const car=parked('sedan'),cars=[car],roof=vehicleRoof(car,groundHeight);
 const s=freshPlayer(roof.x,roof.z);s.y=roof.y+.2;s.grounded=false;
 run(s,cars,still,40);
 run(s,cars,{...still,z:5.6,climb:true},240);
 assert.ok(s.y<.1,'reached the ground while holding E');
 assert.ok(Math.abs(s.z-SITE.z)>1.5);
});

test('support and blocking footprints agree for every vehicle solid',()=>{
 let random=42;const next=()=>(random=(random*16807)%2147483647)/2147483647;
 for(const model of ['sedan','suv','bus','coupe','pickup']){
  const car=parked(model,1.1);
  for(let i=0;i<1500;i++){
   const x=SITE.x+(next()-.5)*8,z=SITE.z+(next()-.5)*8;
   for(const solid of solidsAt(x,z,AVATAR_RADIUS,[car],groundHeight)){
    if(!solid.standable)continue;
    assert.equal(solidBlocked(x,z,AVATAR_RADIUS,solid.top-.1,[car],groundHeight),true,'blocks just below its top');
    assert.ok(supportsAt(x,z,AVATAR_RADIUS,[car],groundHeight).some(p=>p.id===solid.id),'supports wherever it blocks');
   }
  }
 }
 assert.deepEqual(vehicleSolids(parked('scooter'),groundHeight).map(s=>s.standable),[false],'motorcycles are not platforms');
});

test('H2: props have rendered heights; poles and trees block at every height',()=>{
 assert.ok(WORLD_COLLIDERS.every(c=>c.height!==8),'no defaulted 8 m props');
 const byKind=kind=>WORLD_COLLIDERS.filter(c=>c.kind===kind);
 for(const bench of byKind('bench')){assert.ok(bench.standable);assert.ok(Math.abs(bench.height-.58)<1e-9);}
 for(const planter of byKind('planter'))assert.ok(planter.standable&&planter.height<1);
 assert.ok(byKind('bus-stop')[0].standable);
 for(const kind of ['tree','lamp','signal','sign','kiosk'])for(const c of byKind(kind)){
  assert.equal(c.standable,false,kind);
  assert.equal(blocked(c.x,c.z,.3,500),true,kind+' blocks even from above');
 }
 const bench=byKind('bench')[0];
 assert.ok(supportsAt(bench.x,bench.z).some(p=>Math.abs(p.y-.58)<1e-9),'bench seat is walkable');
});

test('H3: fire escapes give most buildings roof access from clear pavement',()=>{
 assert.ok(ROOFTOP_LADDERS.length>=100,`${ROOFTOP_LADDERS.length} ladders`);
 const ids=new Set(ROOFTOP_LADDERS.map(l=>l.id));assert.equal(ids.size,ROOFTOP_LADDERS.length);
 for(const [i,l] of ROOFTOP_LADDERS.entries()){
  assert.equal(blocked(l.x,l.z,.42,0),false,l.id+' base clear');
  if(i>=26)assert.equal(roadAt(l.x,l.z),false,l.id+' off road');
  for(const o of ROOFTOP_LADDERS.slice(i+1))assert.ok(Math.hypot(o.x-l.x,o.z-l.z)>=1.1,'ladders distinct');
 }
});

test('a rooftop ladder can be climbed down again with a fresh E press',()=>{
 const l=ROOFTOP_LADDERS[0],s=freshPlayer(l.x,l.z),b=(x,z,feet=s.y,step=0)=>solidBlocked(x,z,AVATAR_RADIUS,feet,[],groundHeight,step);
 for(let i=0;i<2400&&s.support!=='building:'+l.index;i++)stepPlayer(s,{...still,climb:true},PLAYER_STEP,b,[]);
 assert.equal(s.support,'building:'+l.index,'reached the roof');
 for(let i=0;i<30;i++)stepPlayer(s,{...still,climb:true},PLAYER_STEP,b,[]);
 assert.equal(s.support,'building:'+l.index,'holding E after arriving does not descend');
 stepPlayer(s,still,PLAYER_STEP,b,[]);
 for(let i=0;i<2400&&!(s.grounded&&s.support==='ground');i++)stepPlayer(s,{...still,climb:true},PLAYER_STEP,b,[]);
 assert.equal(s.support,'ground','back on the street');
 assert.ok(Math.hypot(s.x-l.x,s.z-l.z)<.3,'at the ladder base');
});
