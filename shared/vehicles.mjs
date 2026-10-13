import { PARKED_CARS, blocked, onRoad, ROUNDABOUT } from './world.mjs';

export const neutralControls = () => ({ throttle: 0, steer: 0, brake: true });
export function createFleet() { return [...PARKED_CARS.map(c => ({ ...c, heading: c.rotation, speed: 0, steer: 0, driver: '', braking: true, traffic:false, distance:0 })),...createTraffic()]; }
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
export function stepVehicle(car, input, seconds, fleet = [], wetness = 0) {
  if(Math.abs(car.speed)<.001 && !input.throttle && !input.steer){car.speed=0;car.braking=!!input.brake;return car;}
  let remaining=Math.min(Math.max(seconds,0),.25);
  while(remaining>1e-7) {
    const dt=Math.min(remaining,1/120); remaining-=dt;
    const throttle=Number.isFinite(input.throttle)?Math.max(-1,Math.min(1,input.throttle)):0;
    const steer=Number.isFinite(input.steer)?Math.max(-1,Math.min(1,input.steer)):0;
    car.steer += (steer*.48/(1+Math.abs(car.speed)*.045)-car.steer)*(1-Math.exp(-9*dt));
    car.braking=!!input.brake || throttle*car.speed<-.2;
    const resistance=.65 + Math.abs(car.speed)*.035;
    const deceleration=car.braking ? 13*(1-Math.min(1,Math.max(0,wetness))*.1) : resistance;
    if (Math.abs(car.speed)>0) car.speed=Math.sign(car.speed)*Math.max(0,Math.abs(car.speed)-deceleration*dt);
    if (!car.braking) car.speed += throttle*(throttle>0?5.2:3.1)*dt;
    const limit=onRoad(car.x,car.z)?23*(1-Math.min(1,Math.max(0,wetness))*.08):7;
    car.speed=Math.max(-5.5, Math.min(limit,car.speed));
    const heading=car.heading + car.speed/2.78*Math.tan(car.steer)*dt;
    const next={...car,heading,x:car.x+Math.cos(heading)*car.speed*dt,z:car.z-Math.sin(heading)*car.speed*dt};
    if (carBlocked(next,fleet)) { car.speed=0; car.braking=true; }
    else { car.x=next.x; car.z=next.z; car.heading=Math.atan2(Math.sin(heading),Math.cos(heading)); }
  }
  return car;
}

// Closed right-hand traffic circuit on the east collectors and bypass. Rounded
// corners avoid instant heading flips; every proposed pose still uses the hull.
const TRAFFIC_POINTS=[];
for(const [cx,cz,start] of [[97,-89,Math.PI],[113,-89,Math.PI*1.5],[113,43,0],[97,43,Math.PI*.5]]){
  for(let i=0;i<=12;i++){const a=start+i/12*Math.PI/2;TRAFFIC_POINTS.push({x:cx+5*Math.cos(a),z:cz+5*Math.sin(a)});}
}
TRAFFIC_POINTS.reverse();
const routeLengths=TRAFFIC_POINTS.map((p,i)=>Math.hypot(p.x-TRAFFIC_POINTS[(i+1)%TRAFFIC_POINTS.length].x,p.z-TRAFFIC_POINTS[(i+1)%TRAFFIC_POINTS.length].z));
export const TRAFFIC_LENGTH=routeLengths.reduce((a,b)=>a+b,0);
export function trafficPose(distance){let remaining=((distance%TRAFFIC_LENGTH)+TRAFFIC_LENGTH)%TRAFFIC_LENGTH;for(let i=0;i<routeLengths.length;i++){const length=routeLengths[i];if(remaining<=length){const a=TRAFFIC_POINTS[i],b=TRAFFIC_POINTS[(i+1)%TRAFFIC_POINTS.length],t=length?remaining/length:0;return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,heading:Math.atan2(-(b.z-a.z),b.x-a.x)};}remaining-=length;}return {...TRAFFIC_POINTS[0],heading:0};}
export function createTraffic(){return ['#ab9774','#698d81','#8c9fab'].map((color,i)=>({id:`traffic-${i}`,name:'City traffic',color,rotation:0,...trafficPose(i*TRAFFIC_LENGTH/3),speed:0,steer:0,driver:'traffic',braking:false,traffic:true,distance:i*TRAFFIC_LENGTH/3}));}
export function stepTraffic(car,seconds,fleet,people=[]){
  let remaining=Math.min(seconds,.1);
  while(remaining>0){const dt=Math.min(remaining,1/60);remaining-=dt;
    const look=trafficPose(car.distance+4);
    const stopped=people.some(p=>Math.hypot(p.x-look.x,p.z-look.z)<2);
    const speed=stopped?0:Math.min(7,car.speed+3*dt),distance=car.distance+speed*dt,next={...car,...trafficPose(distance)};
    if(stopped||carBlocked(next,fleet)){car.speed=0;car.braking=true;}else{Object.assign(car,next,{distance,speed,braking:false});}
  }
}
