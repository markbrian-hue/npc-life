import {roadSurfaceHeight} from './roadSurface.mjs';
import {ROAD_SEGMENTS,roadBounds,inBox,PARK_PATHS,onRoad} from './world.mjs';
import {nearLadder,nearLadderTop,platformsAt,reachableCarLedge} from './verticalTraversal.mjs';
export const PLAYER_STEP=1/120;
/** Highest ledge a grounded body walks up without jumping (curbs, low steps). */
export const STEP_HEIGHT=.4;
/** How far above the feet an airborne body can grab a ledge and pull up (arms overhead). */
export const MANTLE_REACH=.95;
export const LADDER_SPEED=2.5;
/** Highest ledge climbed from standing by walking into it (no jump). */
export const GROUND_CLIMB=.62;
export function groundHeight(x,z){if(onRoad(x,z))return roadSurfaceHeight(x,z);for(const r of ROAD_SEGMENTS){const b=roadBounds(r,2.1);if(inBox(x,z,b)){const road=roadBounds(r),edge=Math.max(Math.abs(x-road.x)-road.w/2,Math.abs(z-road.z)-road.d/2);return Math.min(.06,Math.max(0,edge)*.12);}}if(PARK_PATHS.some(p=>inBox(x,z,p)))return .035;return 0;}
export function surfaceAt(x,z){return onRoad(x,z)?'road':ROAD_SEGMENTS.some(r=>inBox(x,z,roadBounds(r,2.1)))?'pavement':PARK_PATHS.some(p=>inBox(x,z,p))?'gravel':'grass';}
export const freshPlayer=(x,z)=>({x,z,y:groundHeight(x,z),vx:0,vz:0,vy:0,grounded:true,jump:0,coyote:.1,landed:0,support:null,platformPose:null,ladder:null,mantle:null,prevClimb:false});
const smooth=t=>t*t*(3-2*t);
function beginMantle(s,target,duration=.46){
 s.mantle={fromX:s.x,fromZ:s.z,fromY:s.y,toX:target.x,toZ:target.z,toY:target.y,id:target.id,t:0,duration};
 s.ladder=null;s.support=null;s.platformPose=null;s.grounded=false;s.vx=s.vz=s.vy=0;s.jump=0;
}
const vehicleIdOf=support=>support?.startsWith('vehicle:')?support.slice(8).split('#')[0]:null;
function carryByVehicle(s,cars){
 const id=vehicleIdOf(s.support);if(!id)return;
 const car=cars.find(c=>c.id===id),prev=s.platformPose;
 if(!car||!prev||prev.id!==car.id){s.platformPose=null;return;}
 const angle=car.heading-prev.heading,dx=s.x-prev.x,dz=s.z-prev.z;
 s.x=car.x+Math.cos(angle)*dx+Math.sin(angle)*dz;
 s.z=car.z-Math.sin(angle)*dx+Math.cos(angle)*dz;
 s.platformPose={id:car.id,x:car.x,z:car.z,heading:car.heading};
}
function setSupport(s,surface){
 s.y=surface.y;s.vy=0;s.grounded=true;s.support=surface.id;
 const car=surface.vehicle;
 s.platformPose=car?{id:car.id,x:car.x,z:car.z,heading:car.heading}:null;
}
function roofOrGround(s,cars){
 return [{id:'ground',y:groundHeight(s.x,s.z)},...platformsAt(s.x,s.z,cars,groundHeight)].sort((a,b)=>b.y-a.y);
}
/** If a moving vehicle, resident or relocation left the body overlapping a solid,
 * move to the nearest free spot instead of freezing every movement. */
function depenetrate(s,blocked){
 if(!blocked(s.x,s.z,s.y,0))return;
 for(let r=.06;r<=3.001;r+=.06)for(let k=0;k<24;k++){
  const a=k/24*Math.PI*2,x=s.x+Math.cos(a)*r,z=s.z+Math.sin(a)*r;
  if(!blocked(x,z,s.y,0)){s.x=x;s.z=z;s.platformPose=null;return;}
 }
}
/** A walkable top ahead of the body, within arm's reach and with room to stand on it. */
export function findLedge(s,dirX,dirZ,cars,blocked,reach=MANTLE_REACH){
 const length=Math.hypot(dirX,dirZ);if(length<1e-6)return null;
 const ux=dirX/length,uz=dirZ/length;
 for(let d=.2;d<=1.35;d+=.1){
  const x=s.x+ux*d,z=s.z+uz*d;
  for(const top of platformsAt(x,z,cars,groundHeight,.12)){
   if(top.y<=s.y+.05||top.y-s.y>reach)continue;
   if(!blocked(x,z,top.y,0))return {id:top.id,x,z,y:top.y};
  }
 }
 return null;
}
/** A fixed-step kinematic character with actual vertical support, collision height and climbing.
 * `blocked(x,z,feetY,step)` is height-aware; legacy 2D callbacks that ignore the extra
 * arguments remain compatible. Support and blocking use the same footprints, so losing
 * support never leaves the body inside a solid.
 */
export function stepPlayer(s,input,dt,blocked,cars=[]){
 const climbPressed=!!input.climb&&!s.prevClimb;s.prevClimb=!!input.climb;
 s.landed=Math.max(0,s.landed-dt);
 if(s.mantle){
  const m=s.mantle;
  m.t=Math.min(1,m.t+dt/m.duration);
  const movement=smooth(m.t);
  s.x=m.fromX+(m.toX-m.fromX)*movement;s.z=m.fromZ+(m.toZ-m.fromZ)*movement;
  s.y=m.fromY+(m.toY-m.fromY)*movement;
  if(m.t>=1){s.mantle=null;const surface=roofOrGround(s,cars).find(p=>p.id===m.id&&Math.abs(p.y-s.y)<.3);if(surface)setSupport(s,surface);else{s.vy=0;s.grounded=false;}}
  return s;
 }
 if(s.ladder){
  const ladder=s.ladder,down=ladder.dir===-1;
  s.vx=s.vz=s.vy=0;s.grounded=false;
  // Approach the ladder gradually, then climb vertically while E is held.
  const t=Math.min(1,dt*8);
  s.x+=(ladder.x-s.x)*t;s.z+=(ladder.z-s.z)*t;
  if(down){
   const floor=groundHeight(s.x,s.z);
   if(input.climb)s.y=Math.max(floor,s.y-LADDER_SPEED*dt);
   if(s.y<=floor+.01){s.ladder=null;setSupport(s,{id:'ground',y:floor});}
   else if(!input.climb){s.ladder=null;s.vy=0;s.grounded=false;}
   return s;
  }
  if(input.climb)s.y=Math.min(ladder.roof+.12,s.y+LADDER_SPEED*dt);
  if(s.y>=ladder.roof+.1){
   beginMantle(s,{id:'building:'+ladder.index,x:ladder.landing.x,z:ladder.landing.z,y:ladder.roof},.55);
  }else if(!input.climb){s.ladder=null;s.vy=0;s.grounded=false;}
  return s;
 }
 const nearby=input.climb?nearLadder(s.x,s.z):null;
 if(nearby&&s.y<nearby.roof-.25&&Math.abs(s.y-groundHeight(s.x,s.z))<.7){
  s.ladder={...nearby,dir:1};s.grounded=false;s.support=null;s.platformPose=null;s.vx=s.vz=s.vy=0;
  return s;
 }
 // A fresh E press beside a rooftop ladder landing climbs back down.
 if(climbPressed&&s.grounded&&s.support?.startsWith('building:')){
  const top=nearLadderTop(s.x,s.z,s.y);
  if(top&&s.support==='building:'+top.index){
   s.ladder={...top,dir:-1};s.grounded=false;s.support=null;s.platformPose=null;s.vx=s.vz=s.vy=0;
   return s;
  }
 }
 const moving=Math.hypot(input.x,input.z)>.01;
 if(input.climb&&!s.grounded){
  const ledge=reachableCarLedge(s.x,s.z,s.y,cars,groundHeight);
  // Never re-grab the surface just walked off: the ledge must be above the feet and not behind the input.
  const toward=ledge&&(!moving||input.x*(ledge.x-s.x)+input.z*(ledge.z-s.z)>=0);
  if(ledge&&toward&&ledge.y>s.y+.1){beginMantle(s,ledge,.36);return s;}
 }
 if(s.grounded&&s.support?.startsWith('vehicle:'))carryByVehicle(s,cars);
 depenetrate(s,blocked);
 const air=s.grounded?1:.45,rate=(moving?12:16)*air;
 s.vx+=(input.x-s.vx)*(1-Math.exp(-rate*dt));s.vz+=(input.z-s.vz)*(1-Math.exp(-rate*dt));
 if(!moving&&Math.hypot(s.vx,s.vz)<.03){s.vx=0;s.vz=0;}
 const step=s.grounded?STEP_HEIGHT:0;
 const distance=Math.hypot(s.vx,s.vz)*dt,steps=Math.max(1,Math.ceil(distance/.12));
 let hit=false;
 for(let i=0;i<steps;i++){
  const nx=s.x+s.vx*dt/steps,nz=s.z+s.vz*dt/steps;
  if(!blocked(nx,s.z,s.y,step))s.x=nx;else{s.vx=0;hit=true;}
  if(!blocked(s.x,nz,s.y,step))s.z=nz;else{s.vz=0;hit=true;}
 }
 // Jumping into a reachable ledge while pushing toward it pulls the body up onto it.
 // On foot, pushing into a knee-to-waist ledge (bench, planter, car hood → roof) climbs it.
 if(moving&&hit){
  const ledge=findLedge(s,input.x,input.z,cars,blocked,s.grounded?GROUND_CLIMB:MANTLE_REACH);
  if(ledge){beginMantle(s,ledge,.28+.22*(ledge.y-s.y));return s;}
 }
 // Grounded bodies follow steps up and down; anything lower than a step is a real fall.
 if(s.grounded){
  const next=roofOrGround(s,cars).find(p=>p.y<=s.y+STEP_HEIGHT+.001);
  if(next&&next.y>=s.y-STEP_HEIGHT)setSupport(s,next);
  else{s.grounded=false;s.vy=0;s.support=null;s.platformPose=null;}
 }
 s.jump=Math.max(0,s.jump-dt);
 s.coyote=s.grounded?.1:Math.max(0,s.coyote-dt);
 if(input.jump)s.jump=.12;
 if(s.jump>0&&s.coyote>0){
  s.vy=input.lowGravity?9:5.6;s.grounded=false;s.coyote=0;s.jump=0;s.support=null;s.platformPose=null;
 }
 const before=s.y;
 if(!s.grounded){s.vy-=(input.lowGravity?6:9.81)*dt;s.y+=s.vy*dt;}
 const surfaces=roofOrGround(s,cars);
 if(!s.grounded&&s.vy<=0){
  const landing=surfaces.find(p=>before>=p.y-.02&&s.y<=p.y);
  if(landing){s.landed=Math.min(.2,Math.abs(s.vy)*.025);setSupport(s,landing);}
 }
 if(!s.grounded&&s.y<groundHeight(s.x,s.z))setSupport(s,{id:'ground',y:groundHeight(s.x,s.z)});
 return s;
}
