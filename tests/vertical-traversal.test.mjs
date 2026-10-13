import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BUILDINGS,blocked} from '../shared/world.mjs';
import {PLAYER_STEP,stepPlayer,freshPlayer,groundHeight} from '../shared/playerPhysics.mjs';
import {ROOFTOP_LADDERS,nearLadder,platformsAt,vehicleRoof,reachableCarLedge} from '../shared/verticalTraversal.mjs';
import {createFleet} from '../shared/vehicles.mjs';
const still={x:0,z:0,climb:false,jump:false};
function step(s,input=still,cars=[]){
 return stepPlayer(s,input,PLAYER_STEP,(x,z)=>blocked(x,z,.42,s.y),cars);
}
test('every authored ladder targets a real building and its walkable roof',()=>{
 assert.ok(ROOFTOP_LADDERS.length>=5);
 for(const l of ROOFTOP_LADDERS){
  const b=BUILDINGS[l.index];
  assert.equal(l.building,b);
  assert.equal(nearLadder(l.x,l.z).id,l.id);
  assert.equal(blocked(l.landing.x,l.landing.z,.42,0),true);
  assert.equal(blocked(l.landing.x,l.landing.z,.42,l.roof),false);
  const surfaces=platformsAt(l.landing.x,l.landing.z);
  assert.ok(surfaces.some(p=>p.id==='building:'+l.index&&Math.abs(p.y-l.roof)<.0001));
 }
});
test('holding E climbs a facade in real fixed steps and mantles onto its roof',()=>{
 const l=ROOFTOP_LADDERS[0],s=freshPlayer(l.x,l.z);
 let maximum=0,started=false,finished=false;
 for(let i=0;i<1800;i++){
  step(s,{...still,climb:true});
  maximum=Math.max(maximum,s.y);
  if(s.ladder)started=true;
  if(s.grounded&&s.support==='building:'+l.index){finished=true;break;}
 }
 assert.ok(started,'ladder activation');
 assert.ok(finished,'standing on authored roof');
 assert.ok(maximum>=l.roof);
 assert.ok(Math.abs(s.y-l.roof)<.06);
 for(let i=0;i<180;i++)step(s);
 assert.equal(s.grounded,true);
 assert.equal(s.support,'building:'+l.index);
});
test('descending feet land on a stationary sedan roof, not road underneath',()=>{
 const car=createFleet().find(c=>c.id==='sedan-1'),roof=vehicleRoof(car,groundHeight);
 assert.ok(roof);
 const s=freshPlayer(roof.x,roof.z);s.y=roof.y+2;s.vy=0;s.grounded=false;
 for(let i=0;i<260;i++){step(s,still,[car]);if(s.grounded)break;}
 assert.equal(s.grounded,true);
 assert.equal(s.support,'vehicle:'+car.id);
 assert.ok(Math.abs(s.y-roof.y)<.04);
 assert.ok(s.y>groundHeight(s.x,s.z)+1);
});
test('a grounded passenger is carried by moving and turning roof without sliding off',()=>{
 const car=createFleet().find(c=>c.id==='sedan-1'),roof=vehicleRoof(car,groundHeight);
 const s=freshPlayer(roof.x,roof.z);s.y=roof.y+1;s.grounded=false;
 for(let i=0;i<260;i++){step(s,still,[car]);if(s.grounded)break;}
 assert.equal(s.support,'vehicle:'+car.id);
 const before={x:s.x,z:s.z};
 car.x+=.25;car.heading+=.08;
 step(s,still,[car]);
 assert.ok(Math.hypot(s.x-before.x,s.z-before.z)>.15);
 assert.equal(s.support,'vehicle:'+car.id);
});
test('falling off a rooftop falls under gravity instead of snapping down',()=>{
 const l=ROOFTOP_LADDERS[0],s=freshPlayer(l.landing.x,l.landing.z);
 s.y=l.roof;s.support='building:'+l.index;s.grounded=true;
 // Move a full building width away in a controlled direction.
 for(let i=0;i<800;i++)step(s,{...still,x:7});
 assert.ok(s.y<l.roof-1);
 assert.ok(s.y>=groundHeight(s.x,s.z)-.001);
});
test('a reachable car ledge mantles over time; motorcycles have no fake flat roofs',()=>{
 const fleet=createFleet(),car=fleet.find(c=>c.id==='sedan-1'),roof=vehicleRoof(car,groundHeight);
 const s=freshPlayer(roof.x+roof.halfX+.4,roof.z);
 s.y=roof.y-.33;s.grounded=false;s.vy=1;
 assert.ok(reachableCarLedge(s.x,s.z,s.y,[car],groundHeight));
 step(s,{...still,climb:true},[car]);
 assert.ok(s.mantle,'mantle begins');
 assert.ok(s.y<roof.y,'no instant teleport');
 for(let i=0;i<80;i++)step(s,still,[car]);
 assert.equal(s.support,'vehicle:'+car.id);
 assert.equal(s.grounded,true);
 assert.equal(vehicleRoof(fleet.find(c=>c.model==='scooter')),null);
});
test('ground-only legacy collision callers remain compatible',()=>{
 const b=BUILDINGS[0];
 assert.equal(blocked(b.x,b.z),true);
 assert.equal(blocked(b.x,b.z,.42,0),true);
 assert.equal(blocked(b.x,b.z,.42,b.h+.1),false);
 assert.equal(blocked(NaN,0),true);
});
