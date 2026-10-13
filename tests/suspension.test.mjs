import {test} from 'node:test';
import assert from 'node:assert/strict';
import {vehicleState,vehicleSpec,stepVehicle,createFleet,carBlocked,stepTraffic} from '../shared/vehicles.mjs';
import {stepSuspension,wheelContacts} from '../shared/vehicleSuspension.mjs';
import {VEHICLE_CATALOG as VEHICLES} from '../shared/vehicleCatalog.mjs';
import {SPEED_TABLES,roadSurfaceHeight,tableHeight} from '../shared/roadSurface.mjs';
import {groundHeight} from '../shared/playerPhysics.mjs';
import {BUILDINGS} from '../shared/world.mjs';
const drive={throttle:1,steer:0,brake:false};
const car=(model='sedan')=>({...vehicleState(model),id:'test',x:-70,z:0,heading:0});

test('all vehicle suspensions settle without idle bob or retained spring energy',()=>{
 for(const v of VEHICLES){const c=car(v.id);for(let i=0;i<1200;i++)stepSuspension(c,v,1/120,0,0,()=>.06);
  assert.ok(Math.abs(c.suspension.heave)<1e-8,v.id);assert.equal(c.pitch,0);assert.equal(c.roll,0);
  assert.ok(c.suspension.velocities.every(n=>Math.abs(n)<1e-8));
  assert.equal(wheelContacts(v).length,v.category==='Motorcycles'?2:4);
 }
});
test('contact patches follow an inclined surface independently and body settles to its plane',()=>{
 for(const id of ['sedan','bus','sport-bike']){const c=car(id),v=vehicleSpec(c);for(let i=0;i<600;i++)stepSuspension(c,v,1/120,0,0,(x,z)=>x*.03+z*.02);
  assert.ok(Math.abs(c.pitch-Math.atan(.03))<1e-6,id);
  if(id!=='sport-bike')assert.ok(Math.abs(c.roll+Math.atan(.02))<1e-6,id);
  const p=wheelContacts(v);p.forEach((w,i)=>assert.ok(Math.abs(c.suspension.wheels[i]-(w.x*.03+w.z*.02))<1e-8));
 }
});
test('acceleration raises the nose, braking loads front springs, and turn load rolls outward',()=>{
 const c=car(),v=vehicleSpec(c);for(let i=0;i<180;i++)stepSuspension(c,v,1/120,6,4,()=>0);
 assert.ok(c.pitch>0);assert.ok(c.roll>0);
 for(let i=0;i<180;i++)stepSuspension(c,v,1/120,-8,0,()=>0);
 assert.ok(c.pitch<0);assert.ok(Math.abs(c.roll)<1e-5);
 for(let i=0;i<600;i++)stepSuspension(c,v,1/120,0,0,()=>0);
 assert.ok(Math.abs(c.pitch)<1e-8);
});
test('curb shocks remain bounded for every class and springs recover',()=>{
 for(const v of VEHICLES){const c=car(v.id);stepSuspension(c,v,1/120,0,0,()=>0);
  for(let i=0;i<240;i++){stepSuspension(c,v,1/120,i<30?-18:0,0,()=>.12);
   assert.ok(Number.isFinite(c.pitch)&&Number.isFinite(c.roll));assert.ok(Math.abs(c.suspension.heave)<=.14+1e-8,v.id);assert.ok(c.suspension.load>=.82&&c.suspension.load<=1);
  }
  assert.ok(Math.abs(c.suspension.heave)<.0001,v.id);
 }
});
test('visible speed tables use the player and vehicle ground profile with smooth ends',()=>{
 for(const t of SPEED_TABLES){assert.equal(groundHeight(t.x,t.z),t.height);assert.equal(roadSurfaceHeight(t.x,t.z),t.height);assert.equal(tableHeight(t,t.length/2,0),0);assert.equal(tableHeight(t,0,t.width/2),0);assert.ok(tableHeight(t,t.length/2-.001,0)<.00001);}
});
test('driving over speed tables excites suspension and remains deterministic across frame rates',()=>{
 const run=fps=>{const c=car();let peak=0;for(let i=0;i<fps*5;i++){stepVehicle(c,drive,1/fps,[c]);peak=Math.max(peak,Math.abs(c.suspension.heave));}return {c,peak};};
 const a=run(30),b=run(144);assert.ok(a.peak>.015);assert.ok(Math.abs(a.c.x-b.c.x)<1e-8);assert.ok(Math.abs(a.c.pitch-b.c.pitch)<1e-8);assert.ok(Math.abs(a.c.suspension.heave-b.c.suspension.heave)<1e-8);
});
test('traffic shares the fixed timestep and rejects invalid elapsed time',()=>{
 const run=fps=>{const c=createFleet()[6];for(let i=0;i<fps*4;i++)stepTraffic(c,1/fps,[c]);return c;};
 const a=run(30),b=run(144);assert.ok(Math.abs(a.x-b.x)<1e-8&&Math.abs(a.z-b.z)<1e-8);
 const before=JSON.stringify(a);for(const dt of [NaN,Infinity,-1])stepTraffic(a,dt,[a]);assert.equal(JSON.stringify(a),before);
});
test('swept stopping reaches contact without overlap, bounce or artificial wheel spin',()=>{
 // Approach an actual city building after the central fountain was removed.
 const target=BUILDINGS.map(b=>({b,x:b.x-b.w/2-5,z:b.z})).find(p=>{
  const probe={...car('hyper'),x:p.x,z:p.z,heading:0};
  return (p.b.rotation||0)===0&&!carBlocked(probe,[probe]);
 });
 assert.ok(target,'a clear collision approach to an existing building is available');
 const c={...car('hyper'),x:target.x,z:target.z,heading:0,speed:40};
 stepVehicle(c,drive,.25,[c]);
 assert.ok(c.speed>=0&&c.speed<40,'impact reduces speed rather than causing a bounce');
 assert.equal(carBlocked(c,[c]),false,'swept contact stops before interpenetration');
 assert.ok(c.impact>0,'contact feedback still fires');
 const x=c.x,distance=c.distance;
 for(let i=0;i<120;i++)stepVehicle(c,{throttle:0,steer:0,brake:true},1/120,[c]);
 assert.equal(c.speed,0,'brakes settle the damaged vehicle after impact');
 assert.ok(c.x>=x-.001&&c.x-x<3,'no reverse bounce or free sliding');
 assert.ok(c.distance-distance<3,'contact and braking travel remains bounded');
 assert.ok(Math.abs(c.pitch)<.1,'suspension settles after impact');
});

test('room snapshots carry authoritative spring state and ignore forged suspension input',async()=>{
 const {createGameServer}=await import('../server/multiplayer.mjs');let time=100000;
 const server=createGameServer({now:()=>time});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const post=async(path,data,token)=>{const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(data)});assert.equal(r.status,200);return r.json();};
 try{
  const a=await post('/api/join',{name:'Spring driver'});time+=100;
  await post('/api/move',{x:10.4,z:33,y:0,heading:0},a.token);
  await post('/api/vehicle',{action:'enter',id:a.cars[0].id},a.token);
  for(let i=0;i<6;i++){time+=100;await post('/api/move',{x:10.4,z:33,y:0,heading:0,controls:drive,suspension:{heave:999,positions:[999,999,999,999]}},a.token);await new Promise(r=>setTimeout(r,20));}
  const b=await post('/api/join',{name:'Spring observer',code:a.code});const c=b.cars[0];
  assert.equal(c.driver,a.id);assert.ok(c.speed>0);assert.equal(c.suspension.initialized,true);assert.ok(c.suspension.positions.every(Number.isFinite));assert.ok(Math.abs(c.suspension.heave)<.14);assert.ok(c.pitch>0);
  const separate=await post('/api/join',{name:'Other room'});assert.equal(separate.cars[0].suspension.initialized,false);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
