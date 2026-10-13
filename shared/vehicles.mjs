import {AVATAR_RADIUS} from './avatarDimensions.mjs';
import { PARKED_CARS, blocked, onRoad } from './world.mjs';
import {VEHICLE_BY_ID,GARAGES} from './vehicleCatalog.mjs';
import {suspensionState,stepSuspension} from './vehicleSuspension.mjs';
export const PHYSICS_STEP=1/120;
const simulation=new WeakMap();
export const neutralControls=()=>({throttle:0,steer:0,brake:true});
export function vehicleState(model='sedan'){return {model,speed:0,steer:0,driver:'',braking:true,traffic:false,distance:0,lean:0,pitch:0,roll:0,rpm:900,impact:0,signal:0,rim:'alloy',suspension:suspensionState()};}
export const vehicleSpec=car=>VEHICLE_BY_ID[car.model]||VEHICLE_BY_ID.sedan;
export function createFleet(){return [...PARKED_CARS.map((c,i)=>({...c,...vehicleState(['sedan','coupe','wagon','hatch','sedan','roadster'][i]),heading:c.rotation})),...createTraffic(),
 {id:'club-scooter',name:'Club Scooter',x:-80,z:-59,color:'#b6a76f',rotation:Math.PI/2,heading:Math.PI/2,...vehicleState('scooter')},
 {id:'club-bike',name:'Club Commuter',x:-76,z:-59,color:'#637d91',rotation:Math.PI/2,heading:Math.PI/2,...vehicleState('commuter')}];}
// Variable dimensions: a conservative chain of circles covers each body.
export function hull(car){const v=vehicleSpec(car),r=v.width/2,count=Math.max(2,Math.ceil((v.length-v.width)/Math.max(.35,r)) +1),span=Math.max(0,v.length/2-r);return Array.from({length:count},(_,i)=>{const d=-span+i/(count-1)*span*2;return {x:car.x+Math.cos(car.heading)*d,z:car.z-Math.sin(car.heading)*d,r};});}
export function carBlocked(car,fleet=[]){const circles=hull(car),v=vehicleSpec(car);return circles.some(p=>blocked(p.x,p.z,p.r)||fleet.some(other=>other.id!==car.id&&Math.hypot(other.x-car.x,other.z-car.z)<(v.length+vehicleSpec(other).length)/2+1&&hull(other).some(q=>Math.hypot(p.x-q.x,p.z-q.z)<p.r+q.r)));}
export function pedestrianBlocked(x,z,fleet){return fleet.some(c=>Math.hypot(x-c.x,z-c.z)<vehicleSpec(c).length/2+1&&hull(c).some(p=>Math.hypot(p.x-x,p.z-z)<p.r+AVATAR_RADIUS));}
export function exitPosition(car,fleet){if(Math.abs(car.speed)>.65)return null;const v=vehicleSpec(car),offset=v.width/2+1;
 for(const [side,back]of [[1,0],[-1,0],[1,-v.length*.6],[-1,-v.length*.6],[1,v.length*.6],[-1,v.length*.6]]){const x=car.x+Math.sin(car.heading)*side*offset+Math.cos(car.heading)*back,z=car.z+Math.cos(car.heading)*side*offset-Math.sin(car.heading)*back;if(!blocked(x,z,AVATAR_RADIUS)&&!pedestrianBlocked(x,z,fleet))return {x,z};}return null;}
export function vehicleRenderPose(car){const state=simulation.get(car),alpha=state?state.accumulator/PHYSICS_STEP:1,prev=state?.previous||car;return {x:prev.x+(car.x-prev.x)*alpha,z:prev.z+(car.z-prev.z)*alpha,heading:prev.heading+Math.atan2(Math.sin(car.heading-prev.heading),Math.cos(car.heading-prev.heading))*alpha};}
function integrate(car,input,dt,fleet,wetness){const v=vehicleSpec(car),wet=Math.min(1,Math.max(0,wetness)),bike=v.category==='Motorcycles';
 const throttle=Number.isFinite(input.throttle)?Math.max(-1,Math.min(1,input.throttle)):0,steer=Number.isFinite(input.steer)?Math.max(-1,Math.min(1,input.steer)):0;
 const before=car.speed,surface=onRoad(car.x,car.z)?1:v.body==='offroad'?.8:.56;
 const grip=v.grip*surface*(car.suspension?.load??1)*(1-wet*(bike?.32:.25));
 car.steer+=(steer*v.steering/(1+Math.abs(car.speed)*.045)-car.steer)*(1-Math.exp(-Math.max(4,8*1400/v.mass)*dt));
 car.braking=!!input.brake||throttle*car.speed<-.2;
 const deceleration=car.braking?v.brake*(1-wet*.24):.65+Math.abs(car.speed)*.035;
 car.speed=Math.sign(car.speed)*Math.max(0,Math.abs(car.speed)-deceleration*dt);
 if(!car.braking)car.speed+=throttle*(throttle>0?v.power:2.8)*(1-Math.min(.65,Math.abs(car.speed)/v.maxSpeed*.5))*dt;
 const limit=onRoad(car.x,car.z)?v.maxSpeed*(1-wet*.08):v.body==='offroad'?12:7;
 car.speed=Math.max(-4.5,Math.min(limit,car.speed));
 const requested=car.speed/v.wheelbase*Math.tan(car.steer),yaw=Math.sign(requested)*Math.min(Math.abs(requested),Math.abs(car.speed)>.5?grip*7.5/Math.abs(car.speed):2);
 const heading=car.heading+yaw*dt,next={...car,heading,x:car.x+Math.cos(heading)*car.speed*dt,z:car.z-Math.sin(heading)*car.speed*dt};
 car.impact=Math.max(0,car.impact-dt*3);
 if(carBlocked(next,fleet)){
  // Sweep to the last clear contact pose instead of stopping a whole step
  // short. No restitution: walls cannot launch or bounce a vehicle.
  let low=0,high=1;
  for(let i=0;i<10;i++){const t=(low+high)/2,probe={...car,x:car.x+(next.x-car.x)*t,z:car.z+(next.z-car.z)*t,heading:car.heading+yaw*dt*t};if(carBlocked(probe,fleet))high=t;else low=t;}
  const traveled=Math.hypot(next.x-car.x,next.z-car.z)*low;
  car.x+=(next.x-car.x)*low;car.z+=(next.z-car.z)*low;car.heading+=yaw*dt*low;car.distance+=traveled;
  car.impact=Math.max(car.impact,Math.min(1,Math.abs(car.speed)/15));car.speed=0;car.braking=true;
 }
 else{car.x=next.x;car.z=next.z;car.heading=Math.atan2(Math.sin(heading),Math.cos(heading));car.distance+=Math.abs(car.speed)*dt;}
 const accel=(car.speed-before)/dt,lean=bike?Math.max(-.48,Math.min(.48,-Math.atan(car.speed*yaw/9.81))):0;
 car.lean+=(lean-car.lean)*(1-Math.exp(-6*dt));stepSuspension(car,v,dt,Math.max(-18,Math.min(12,accel)),yaw*car.speed);car.rpm=900+Math.abs(car.speed)/v.maxSpeed*5500;car.signal=Math.abs(steer)>.25?Math.sign(steer):0;
}
/** Exact fixed steps with an accumulator; identical integrator in solo and rooms. */
export function stepVehicle(car,input,seconds,fleet=[],wetness=0){let state=simulation.get(car);if(!state){state={accumulator:0,previous:{x:car.x,z:car.z,heading:car.heading}};simulation.set(car,state);}state.accumulator+=Math.min(.25,Math.max(0,Number.isFinite(seconds)?seconds:0));
 while(state.accumulator+1e-9>=PHYSICS_STEP){state.previous={x:car.x,z:car.z,heading:car.heading};integrate(car,input,PHYSICS_STEP,fleet,wetness);state.accumulator=Math.max(0,state.accumulator-PHYSICS_STEP);}return car;}
export function garageSpawn(model,garageId,fleet,color='#678e85',rim='alloy'){const v=VEHICLE_BY_ID[model],g=GARAGES.find(g=>g.id===garageId);if(!v||!g)return null;for(const p of g.pads){const car={...vehicleState(model),id:'personal-vehicle',name:v.name,...p,rotation:p.heading,color,rim};if(!carBlocked(car,fleet))return car;}return null;}

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
// A separate rounded NYC grid circuit; no changes to the original east-bypass route.
// Every corner follows the *real* connecting avenue/street asphalt union.
const NYC_TRAFFIC_POINTS=[];
function nycArc(cx,cz,start,end){
 for(let i=0;i<=12;i++){
  const angle=start+(end-start)*i/12;
  NYC_TRAFFIC_POINTS.push({x:cx+4*Math.cos(angle),z:cz+4*Math.sin(angle)});
 }
}
nycArc(4,-223,Math.PI,Math.PI/2);
nycArc(164,-223,Math.PI/2,0);
nycArc(164,-303,0,-Math.PI/2);
nycArc(4,-303,-Math.PI/2,-Math.PI);
const nycLengths=NYC_TRAFFIC_POINTS.map((p,i)=>{
 const q=NYC_TRAFFIC_POINTS[(i+1)%NYC_TRAFFIC_POINTS.length];
 return Math.hypot(q.x-p.x,q.z-p.z);
});
export const NYC_TRAFFIC_LENGTH=nycLengths.reduce((a,n)=>a+n,0);
export function nycTrafficPose(distance){
 let remaining=((distance%NYC_TRAFFIC_LENGTH)+NYC_TRAFFIC_LENGTH)%NYC_TRAFFIC_LENGTH;
 for(let i=0;i<nycLengths.length;i++){
  const length=nycLengths[i];
  if(remaining<=length){
   const a=NYC_TRAFFIC_POINTS[i],b=NYC_TRAFFIC_POINTS[(i+1)%NYC_TRAFFIC_POINTS.length],t=length?remaining/length:0;
   return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,heading:Math.atan2(-(b.z-a.z),b.x-a.x)};
  }
  remaining-=length;
 }
 return {...NYC_TRAFFIC_POINTS[0],heading:0};
}
export function createTraffic(){
 const old=['#ab9774','#698d81','#8c9fab'].map((color,i)=>({
   id:`traffic-${i}`,name:'City traffic',color,rotation:0,...trafficPose(i*TRAFFIC_LENGTH/3),
   ...vehicleState(['sedan','taxi','delivery'][i]),speed:0,steer:0,driver:'traffic',
   braking:false,traffic:true,distance:i*TRAFFIC_LENGTH/3
 }));
 const uptown=['#e8c77e','#7f9eaf','#b55d62','#b6aca0','#d0a65b'].map((color,i)=>({
   id:`nyc-traffic-${i}`,name:i%2===0?'NYC yellow taxi':'Uptown traffic',color,
   rotation:0,...nycTrafficPose(i*NYC_TRAFFIC_LENGTH/5),
   ...vehicleState(i%2===0?'taxi':'sedan'),speed:0,steer:0,driver:'traffic',
   braking:false,traffic:true,route:'nyc',distance:i*NYC_TRAFFIC_LENGTH/5
 }));
 return [...old,...uptown];
}
export function stepTraffic(car,seconds,fleet,people=[]){
  let state=simulation.get(car);if(!state){state={accumulator:0,previous:{x:car.x,z:car.z,heading:car.heading}};simulation.set(car,state);}
  state.accumulator+=Math.min(.25,Math.max(0,Number.isFinite(seconds)?seconds:0));
  while(state.accumulator+1e-9>=PHYSICS_STEP){const dt=PHYSICS_STEP;state.accumulator=Math.max(0,state.accumulator-dt);state.previous={x:car.x,z:car.z,heading:car.heading};
    const before=car.speed,previousHeading=car.heading;
    const pose=car.route==='nyc'?nycTrafficPose:trafficPose;
    const look=pose(car.distance+4);
    const stopped=people.some(p=>Math.hypot(p.x-look.x,p.z-look.z)<2);
    const speed=stopped?0:Math.min(7,car.speed+3*dt),distance=car.distance+speed*dt,next={...car,...pose(distance)};
    if(stopped||carBlocked(next,fleet)){car.speed=0;car.braking=true;}else{Object.assign(car,next,{distance,speed,braking:false});}
    const yaw=Math.atan2(Math.sin(car.heading-previousHeading),Math.cos(car.heading-previousHeading))/dt;
    stepSuspension(car,vehicleSpec(car),dt,Math.max(-18,Math.min(12,(car.speed-before)/dt)),yaw*car.speed);
  }
}
