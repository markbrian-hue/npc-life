// QA audit M7 (docs/qa-audit-2026-10.md): vehicle classes corner differently.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {stepVehicle,vehicleState,PHYSICS_STEP} from '../shared/vehicles.mjs';
import {VEHICLE_BY_ID,BODY_GRIP} from '../shared/vehicleCatalog.mjs';

// Wide open asphalt is not needed: the probe never checks collisions far from origin.
function lateralG(model){
 const car={id:'probe',x:-200,z:-364,heading:0,...vehicleState(model)};car.speed=Math.min(16,VEHICLE_BY_ID[model].maxSpeed*.8);car.braking=false;
 let heading=car.heading,yaw=0,samples=0;
 for(let i=0;i<180;i++){
  const before=car.heading;
  stepVehicle(car,{throttle:0,steer:1,brake:false},PHYSICS_STEP,[car],0);
  if(i>90){yaw+=Math.abs(car.heading-before)/PHYSICS_STEP*Math.abs(car.speed);samples++;}
 }
 return yaw/samples/9.81;
}
test('every body class has an explicit grip value',()=>{
 for(const v of Object.values(VEHICLE_BY_ID))assert.ok(v.body in BODY_GRIP,v.id);
});
test('sports and exotic cars hold more cornering load than SUVs, and SUVs more than buses',()=>{
 const g=Object.fromEntries(['hyper','exotic','coupe','sedan','suv','bus'].map(m=>[m,lateralG(m)]));
 assert.ok(g.hyper>g.sedan&&g.exotic>g.sedan&&g.coupe>g.sedan,JSON.stringify(g));
 assert.ok(g.sedan>g.suv,JSON.stringify(g));
 assert.ok(g.suv>g.bus,JSON.stringify(g));
});
