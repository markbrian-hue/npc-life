import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFleet, carBlocked, stepVehicle, neutralControls, exitPosition, pedestrianBlocked } from '../shared/vehicles.mjs';
import { blocked, SPAWN, onRoad } from '../shared/world.mjs';
const drive = { throttle: 1, steer: 0, brake: false };
test('spawn is safe and all six vehicles have collision-free parking and exits', () => {
  const fleet = createFleet();
  assert.equal(blocked(SPAWN.x, SPAWN.z), false);
  assert.equal(onRoad(SPAWN.x, SPAWN.z), false);
  assert.equal(pedestrianBlocked(SPAWN.x, SPAWN.z, fleet), false);
  for (const car of fleet) { assert.equal(carBlocked(car, fleet), false, car.id); assert.ok(exitPosition(car, fleet), car.id); }
});
test('cars accelerate, brake before reversing, steer and reject moving exits', () => {
  const car = { ...createFleet()[0], x: -50, z: 0, heading: 0 };
  for (let i=0;i<60;i++) stepVehicle(car,drive,1/60,[car]);
  assert.ok(car.speed > 3 && car.x > -49);
  assert.equal(exitPosition(car,[car]),null);
  const x=car.x;
  stepVehicle(car,{throttle:-1,steer:0,brake:false},.1,[car]);
  assert.ok(car.x>x && car.speed>0, 'reverse input first brakes forward motion');
  for(let i=0;i<60;i++)stepVehicle(car,neutralControls(),1/60,[car]);
  assert.equal(car.speed,0);assert.ok(exitPosition(car,[car]));
  for(let i=0;i<30;i++)stepVehicle(car,{...drive,steer:1},1/60,[car]);
  assert.ok(car.heading>0);
});
test('vehicle hull cannot tunnel through fountain island, buildings or other cars', () => {
  for(const [x,z,heading] of [[-13,0,0],[-16,-7,Math.PI/2]]) {
    const car={...createFleet()[0],x,z,heading,speed:23};
    for(let i=0;i<60;i++)stepVehicle(car,drive,.1,[car]);
    assert.equal(carBlocked(car,[car]),false);assert.equal(car.speed,0);
  }
  const car={...createFleet()[0],x:-40,z:0,heading:0,speed:23};
  const other={...createFleet()[1],x:-30,z:0,heading:0};
  for(let i=0;i<20;i++)stepVehicle(car,drive,.1,[car,other]);
  assert.equal(carBlocked(car,[car,other]),false);assert.equal(car.speed,0);
});
test('physics agrees at 30 and 120 FPS', () => {
  const simulate = fps => { const car={...createFleet()[0],x:-60,z:0,heading:0};for(let i=0;i<fps*2;i++)stepVehicle(car,drive,1/fps,[car]);return car; };
  assert.ok(Math.abs(simulate(30).x-simulate(120).x)<.01);
});

test('shared cars enforce one driver, isolate rooms, simulate on server and release on leave', async () => {
  const { createGameServer } = await import('../server/multiplayer.mjs');
  const server=createGameServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  const post=async(path,data,token)=>{const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(data)});return {status:r.status,...await r.json()};};
  const delay=ms=>new Promise(r=>setTimeout(r,ms));
  try {
    const a=await post('/api/join',{name:'Driver'}), b=await post('/api/join',{name:'Guest',code:a.code}), other=await post('/api/join',{name:'Separate'});
    const car=a.cars[0];
    assert.equal((await post('/api/vehicle',{action:'enter',id:car.id},a.token)).status,409,'distant entry rejected');
    await delay(90);
    for(const p of [a,b,other])await post('/api/move',{x:10.4,z:33,y:0,heading:0},p.token);
    const entered=await post('/api/vehicle',{action:'enter',id:car.id},a.token);
    assert.equal(entered.status,200);assert.equal(entered.cars[0].driver,a.id);
    assert.equal((await post('/api/vehicle',{action:'enter',id:car.id},b.token)).status,409);
    assert.equal((await post('/api/vehicle',{action:'enter',id:car.id},other.token)).status,200,'separate room owns separate fleet');
    await delay(90);
    await post('/api/move',{x:100,z:100,y:0,heading:0,controls:drive},a.token);
    await delay(400);
    assert.equal((await post('/api/vehicle',{action:'exit'},a.token)).status,409,'moving exit rejected');
    await post('/api/move',{x:100,z:100,y:0,heading:0,controls:neutralControls()},a.token);
    await delay(400);
    const exited=await post('/api/vehicle',{action:'exit'},a.token);
    assert.equal(exited.status,200);assert.ok(exited.cars[0].z<33);assert.ok(exited.cars[0].x<10,'client cannot teleport owned car');
    assert.equal(exited.cars[0].driver,'');assert.equal(blocked(exited.position.x,exited.position.z),false);
    await post('/api/vehicle',{action:'enter',id:car.id},a.token);
    await post('/api/leave',{},a.token);
    assert.equal((await post('/api/vehicle',{action:'enter',id:car.id},b.token)).status,200,'disconnect frees ownership');
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
