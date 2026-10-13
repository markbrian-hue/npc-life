import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EXPLORER_SITES,EXPLORER_BY_ID,CONTRACTS,CONTRACT_BY_ID,freshExploration,validateExploration,dailyContracts,acceptContract,advanceContract,stampPassport,shuttleDestination,contractTarget} from '../shared/exploration.mjs';
import {blocked,WORLD_COLLIDERS,WORLD_RADIUS,SPAWN,validateWorld} from '../shared/world.mjs';
import {walkingRoute} from './pathing.mjs';
import {AVATAR_RADIUS} from '../shared/avatarDimensions.mjs';
import {blockRig} from '../shared/avatarGeometry.mjs';
import {budgetState,sampleBudget} from '../shared/renderBudget.mjs';
import {freshLiving,validateLiving} from '../shared/livingCity.mjs';
import {vehicleState,carBlocked} from '../shared/vehicles.mjs';

test('expanded destinations connect to the old city and stay outside collisions',()=>{
 assert.equal(WORLD_RADIUS,210);assert.deepEqual(validateWorld(),[]);
 for(const site of EXPLORER_SITES){assert.equal(blocked(site.x,site.z),false,site.name);assert.ok(walkingRoute(SPAWN,site).length,site.name);}
 for(let z=-180;z<=-112;z+=2)assert.equal(carBlocked({...vehicleState('bus'),id:'test',x:1.8,z,heading:Math.PI/2}),false,`campus road ${z}`);
 for(let z=-145;z<=63;z+=2)assert.equal(carBlocked({...vehicleState('sedan'),id:'test',x:166,z,heading:Math.PI/2}),false,`eastbank road ${z}`);
});
test('spatial broadphase preserves the exact rotated collision boundaries',()=>{
 const linear=(x,z,r)=>Math.abs(x)+r>WORLD_RADIUS||Math.abs(z)+r>WORLD_RADIUS||z+r>93||(z>75&&Math.abs(x)+r>10)||Math.hypot(x,z)<3.1+r||WORLD_COLLIDERS.some(p=>{const dx=x-p.x,dz=z-p.z;return Math.abs(p.c*dx-p.s*dz)<p.halfX+r&&Math.abs(p.s*dx+p.c*dz)<p.halfZ+r;});
 let seed=17;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
 for(let i=0;i<18000;i++){const x=random()*440-220,z=random()*340-220,r=[.3,.42,1.2,3][i%4];assert.equal(blocked(x,z,r),linear(x,z,r),`${x},${z},${r}`);}
 for(const [x,z,r]of [[NaN,0,.4],[0,Infinity,1],[1,2,-1]])assert.equal(blocked(x,z,r),true);
});
test('every daily route requires ordered on-foot stops and can pay only once',()=>{
 for(let day=20735;day<20741;day++)for(const c of dailyContracts(day)){
  let s={...freshExploration(),visits:EXPLORER_SITES.map(p=>p.id)};s=acceptContract(s,c.id,day);assert.ok(s);assert.equal(acceptContract(s,c.id,day),null);
  assert.equal(advanceContract(s,{x:999,z:999}),null);assert.equal(advanceContract(s,{x:NaN,z:1}),null);
  for(let i=0;i<c.stops.length;i++){const p=EXPLORER_BY_ID[c.stops[i]];assert.equal(advanceContract(s,p,true).status,'park');assert.equal(s.active.stage,i);const result=advanceContract(s,p);s=result.state;assert.equal(result.coins,i===c.stops.length-1?c.coins:0);s=validateExploration(JSON.parse(JSON.stringify(s)));}
  assert.equal(s.finished,1);assert.equal(s.active,null);assert.equal(acceptContract(s,c.id,day),null);assert.equal(advanceContract(s,EXPLORER_SITES[0]),null);
 }
});
test('rotation keeps unfinished routes, gates advanced commissions and prevents clock rollback replay',()=>{
 let s=freshExploration(),day=20735,c=dailyContracts(day)[0];assert.equal(acceptContract(s,dailyContracts(day)[2].id,day),null);
 s=acceptContract(s,c.id,day);s=advanceContract(s,contractTarget(s)).state;
 assert.equal(acceptContract(s,dailyContracts(day+1)[0].id,day+1),null);
 const restored=validateExploration(JSON.parse(JSON.stringify(s)));assert.equal(restored.active.stage,1);
 while(s.active)s=advanceContract(s,contractTarget(s)).state;
 s=acceptContract(s,dailyContracts(day+1)[0].id,day+1);s={...s,active:null};assert.equal(acceptContract(s,c.id,day),null);
 assert.notDeepEqual(dailyContracts(day),dailyContracts(day+1));
});
test('discovery rewards, full-passport bonus and unlocked shuttles are one-time and persist',()=>{
 let s=freshExploration(),total=0;
 for(const p of EXPLORER_SITES){assert.equal(stampPassport(s,p,true),null);const result=stampPassport(s,p);total+=result.coins;s=result.state;assert.equal(stampPassport(s,p),null);}
 assert.equal(total,EXPLORER_SITES.length*12+120);assert.equal(s.passportRewarded,true);s=validateExploration(s);
 assert.equal(shuttleDestination(s,EXPLORER_BY_ID.civic,'campus').id,'campus');
 for(const options of [{working:true},{driving:true}])assert.equal(shuttleDestination(s,EXPLORER_BY_ID.civic,'campus',options),null);
 assert.equal(shuttleDestination(s,EXPLORER_BY_ID.civic,'civic'),null);assert.equal(shuttleDestination(s,EXPLORER_BY_ID.observatory,'campus'),null);
 const active=acceptContract(s,dailyContracts(20735)[0].id,20735);assert.equal(shuttleDestination(active,EXPLORER_BY_ID.civic,'campus'),null);
});
test('passport validation rejects forged positions, invalid rewards and impossible stages',()=>{
 const s=freshExploration();for(const bad of [null,{...s,visits:['admin']},{...s,passportRewarded:true},{...s,finished:-1},{...s,active:{id:'books',day:20735,stage:99}},{...s,claimed:['0:invalid']},{...s,claimed:['junk'] }])assert.throws(()=>validateExploration(bad));
 assert.equal(CONTRACTS.length,7);assert.ok(Object.values(CONTRACT_BY_ID).every(c=>c.stops.every(id=>EXPLORER_BY_ID[id])));
});
test('block avatar stays under 260 triangles with finite colored geometry and correct foot landmarks',()=>{
 for(const gender of ['man','woman'])for(const style of [0,1,2]){const rig=blockRig({shirt:'#51887b',gender,style});let vertices=0;
 for(const [name,g]of Object.entries(rig)){assert.ok([...g.attributes.position.array].every(Number.isFinite));assert.equal(g.attributes.color.count,g.attributes.position.count);vertices+=g.attributes.position.count*(['arm','leg'].includes(name)?2:1);g.computeBoundingBox();if(name==='arm')assert.ok(Math.hypot(.61+g.boundingBox.max.x,.24)*.72<AVATAR_RADIUS);if(name==='leg')assert.ok(Math.abs(g.boundingBox.min.y+1.16)<.004);g.dispose();}assert.ok(vertices/3+2<260);}
});
test('adaptive resolution responds to sustained load, recovers slowly and leaves old saves intact',()=>{
 let s=budgetState(1.25);for(let i=0;i<500;i++)s=sampleBudget(s,1/30,1.25);assert.equal(s.ratio,.65);
 for(let i=0;i<900;i++)s=sampleBudget(s,1/60,1.25);assert.ok(s.ratio>.65&&s.ratio<1.25);assert.equal(sampleBudget(s,3,1.25),s);let stalled=budgetState(1);for(let i=0;i<20;i++)stalled=sampleBudget(stalled,.4,1);assert.ok(stalled.ratio<1);let zoom=budgetState(.5);for(let i=0;i<100;i++)zoom=sampleBudget(zoom,1/20,.5);assert.ok(zoom.ratio<=.5);
 const migrated=validateLiving({quality:'high',needs:{hunger:42,thirst:53,energy:64},elapsed:123});assert.equal(migrated.autoResolution,true);assert.equal(migrated.cinematic,false);assert.equal(migrated.needs.hunger,42);assert.equal(migrated.elapsed,123);
 assert.equal(validateLiving({...freshLiving(),autoResolution:false,cinematic:true}).cinematic,true);assert.throws(()=>validateLiving({autoResolution:'yes'}));
});

test('room server accepts new districts and keeps the same authentication and world bounds',async()=>{
 const {createGameServer}=await import('../server/multiplayer.mjs');let time=Date.now();const server=createGameServer({now:()=>time});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const post=async(path,data,token)=>{const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(data)});return {status:response.status,...await response.json()};};
 try{const host=await post('/api/join',{name:'Explorer'});for(const p of [EXPLORER_BY_ID.campus,EXPLORER_BY_ID.eastbank,EXPLORER_BY_ID.lookout]){time+=200;assert.equal((await post('/api/move',{x:p.x,z:p.z,y:0,heading:0},host.token)).status,200);}
 const guest=await post('/api/join',{name:'Observer',code:host.code});const remote=guest.players.find(p=>p.id===host.id);assert.equal(remote.x,184);assert.equal(remote.z,42);time+=200;assert.equal((await post('/api/move',{x:211,z:0,y:0,heading:0},host.token)).status,400);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
