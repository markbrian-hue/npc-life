import {roadSurfaceHeight} from './roadSurface.mjs';
import {ROAD_SEGMENTS,roadBounds,inBox,PARK_PATHS,onRoad} from './world.mjs';
import {nearLadder,platformsAt,reachableCarLedge} from './verticalTraversal.mjs';
export const PLAYER_STEP=1/120;
export function groundHeight(x,z){if(onRoad(x,z))return roadSurfaceHeight(x,z);for(const r of ROAD_SEGMENTS){const b=roadBounds(r,2.1);if(inBox(x,z,b)){const road=roadBounds(r),edge=Math.max(Math.abs(x-road.x)-road.w/2,Math.abs(z-road.z)-road.d/2);return Math.min(.06,Math.max(0,edge)*.12);}}if(PARK_PATHS.some(p=>inBox(x,z,p)))return .035;return 0;}
export function surfaceAt(x,z){return onRoad(x,z)?'road':ROAD_SEGMENTS.some(r=>inBox(x,z,roadBounds(r,2.1)))?'pavement':PARK_PATHS.some(p=>inBox(x,z,p))?'gravel':'grass';}
export const freshPlayer=(x,z)=>({x,z,y:groundHeight(x,z),vx:0,vz:0,vy:0,grounded:true,jump:0,coyote:.1,landed:0,support:null,platformPose:null,ladder:null,mantle:null});
const smooth=t=>t*t*(3-2*t);
function beginMantle(s,target,duration=.46){
 s.mantle={fromX:s.x,fromZ:s.z,fromY:s.y,toX:target.x,toZ:target.z,toY:target.y,id:target.id,t:0,duration};
 s.ladder=null;s.support=null;s.platformPose=null;s.grounded=false;s.vx=s.vz=s.vy=0;s.jump=0;
}
function carryByVehicle(s,cars){
 if(!s.support?.startsWith('vehicle:'))return;
 const car=cars.find(c=>'vehicle:'+c.id===s.support),prev=s.platformPose;
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
/** A fixed-step kinematic character with actual vertical support, collision height and climbing.
 * The fourth argument remains the existing 2D blocking callback; the UI supplies a
 * height-aware closure. Vehicle roofs and roofs only support feet crossing from above.
 */
export function stepPlayer(s,input,dt,blocked,cars=[]){
 const jumpHeld=!!input.jumpHeld;
 s.landed=Math.max(0,s.landed-dt);
 if(s.mantle){
  const m=s.mantle,movement=smooth(Math.min(1,m.t+dt/m.duration));
  m.t=Math.min(1,m.t+dt/m.duration);
  s.x=m.fromX+(m.toX-m.fromX)*movement;s.z=m.fromZ+(m.toZ-m.fromZ)*movement;
  s.y=m.fromY+(m.toY-m.fromY)*movement;
  if(m.t>=1){s.mantle=null;const surface=roofOrGround(s,cars).find(p=>p.id===m.id&&Math.abs(p.y-s.y)<.3);if(surface)setSupport(s,surface);else{s.vy=0;s.grounded=false;}}
  return s;
 }
 if(s.ladder){
  const ladder=s.ladder;
  s.vx=s.vz=s.vy=0;s.grounded=false;
  // Approach the ladder gradually, then climb vertically while E is held.
  const t=Math.min(1,dt*8);
  s.x+=(ladder.x-s.x)*t;s.z+=(ladder.z-s.z)*t;
  if(input.climb)s.y=Math.min(ladder.roof+.12,s.y+2.5*dt);
  if(s.y>=ladder.roof+.1){
   beginMantle(s,{id:'building:'+ladder.index,x:ladder.landing.x,z:ladder.landing.z,y:ladder.roof},.55);
  }else if(!input.climb){s.ladder=null;s.vy=0;s.grounded=false;}
  return s;
 }
 const nearby=input.climb?nearLadder(s.x,s.z):null;
 if(nearby&&s.y<nearby.roof-.25&&Math.abs(s.y-groundHeight(s.x,s.z))<.7){
  s.ladder={...nearby};s.grounded=false;s.support=null;s.platformPose=null;s.vx=s.vz=s.vy=0;
  return s;
 }
 if(input.climb&&!s.grounded){
  const ledge=reachableCarLedge(s.x,s.z,s.y,cars,groundHeight);
  if(ledge){beginMantle(s,ledge,.36);return s;}
 }
 if(s.grounded&&s.support?.startsWith('vehicle:'))carryByVehicle(s,cars);
 const moving=Math.hypot(input.x,input.z)>.01,air=s.grounded?1:.45,rate=(moving?12:16)*air;
 s.vx+=(input.x-s.vx)*(1-Math.exp(-rate*dt));s.vz+=(input.z-s.vz)*(1-Math.exp(-rate*dt));
 if(!moving&&Math.hypot(s.vx,s.vz)<.03){s.vx=0;s.vz=0;}
 const distance=Math.hypot(s.vx,s.vz)*dt,steps=Math.max(1,Math.ceil(distance/.12));
 for(let i=0;i<steps;i++){
  const nx=s.x+s.vx*dt/steps,nz=s.z+s.vz*dt/steps;
  if(!blocked(nx,s.z))s.x=nx;else s.vx=0;
  if(!blocked(s.x,nz))s.z=nz;else s.vz=0;
 }
 // Loss of a platform is a real fall, rather than snapping to terrain beneath it.
 if(s.grounded&&s.support){
  const support=roofOrGround(s,cars).find(p=>p.id===s.support&&Math.abs(p.y-s.y)<.38);
  if(support)setSupport(s,support);
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
 if(s.grounded&&!s.support)s.y=groundHeight(s.x,s.z);
 if(!s.grounded&&s.y<groundHeight(s.x,s.z))setSupport(s,{id:'ground',y:groundHeight(s.x,s.z)});
 return s;
}
