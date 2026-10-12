import { PARKED_CARS, blocked, onRoad, ROUNDABOUT } from './world.mjs';

export const neutralControls = () => ({ throttle: 0, steer: 0, brake: true });
export function createFleet() { return PARKED_CARS.map(c => ({ ...c, heading: c.rotation, speed: 0, steer: 0, driver: '', braking: true })); }
// A three-circle hull covers the body, with continuous small substeps to prevent tunnelling.
export function hull(car) { return [-1.25, 0, 1.25].map(d => ({ x: car.x + Math.cos(car.heading)*d, z: car.z - Math.sin(car.heading)*d })); }
export function carBlocked(car, fleet = []) {
  return hull(car).some(p => blocked(p.x,p.z,.92) || Math.hypot(p.x,p.z) < ROUNDABOUT.island + .92 || fleet.some(other => other.id !== car.id && hull(other).some(q => Math.hypot(p.x-q.x,p.z-q.z) < 1.84)));
}
export function pedestrianBlocked(x,z,fleet) { return fleet.some(c => hull(c).some(p => Math.hypot(p.x-x,p.z-z)<1.28)); }
export function exitPosition(car, fleet) {
  if (Math.abs(car.speed) > .65) return null;
  for (const [side,back] of [[1,0],[-1,0],[1,-2.8],[-1,-2.8],[1,2.8],[-1,2.8]]) {
    const x=car.x + Math.sin(car.heading)*side*2 + Math.cos(car.heading)*back;
    const z=car.z + Math.cos(car.heading)*side*2 - Math.sin(car.heading)*back;
    if (!blocked(x,z) && !pedestrianBlocked(x,z,fleet)) return {x,z};
  }
  return null;
}
/** Bicycle steering, traction-dependent speed, braking before reversing; server and solo use the same integrator. */
export function stepVehicle(car, input, seconds, fleet = []) {
  let remaining=Math.min(Math.max(seconds,0),.25);
  while(remaining>1e-7) {
    const dt=Math.min(remaining,1/120); remaining-=dt;
    const throttle=Number.isFinite(input.throttle)?Math.max(-1,Math.min(1,input.throttle)):0;
    const steer=Number.isFinite(input.steer)?Math.max(-1,Math.min(1,input.steer)):0;
    car.steer += (steer*.48/(1+Math.abs(car.speed)*.045)-car.steer)*(1-Math.exp(-9*dt));
    car.braking=!!input.brake || throttle*car.speed<-.2;
    const resistance=.65 + Math.abs(car.speed)*.035;
    const deceleration=car.braking ? 13 : resistance;
    if (Math.abs(car.speed)>0) car.speed=Math.sign(car.speed)*Math.max(0,Math.abs(car.speed)-deceleration*dt);
    if (!car.braking) car.speed += throttle*(throttle>0?5.2:3.1)*dt;
    const limit=onRoad(car.x,car.z)?23:7;
    car.speed=Math.max(-5.5, Math.min(limit,car.speed));
    const heading=car.heading + car.speed/2.78*Math.tan(car.steer)*dt;
    const next={...car,heading,x:car.x+Math.cos(heading)*car.speed*dt,z:car.z-Math.sin(heading)*car.speed*dt};
    if (carBlocked(next,fleet)) { car.speed=0; car.braking=true; }
    else { car.x=next.x; car.z=next.z; car.heading=Math.atan2(Math.sin(heading),Math.cos(heading)); }
  }
  return car;
}
