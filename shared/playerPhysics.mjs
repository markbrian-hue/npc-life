import {roadSurfaceHeight} from './roadSurface.mjs';
import {ROAD_SEGMENTS,roadBounds,inBox,PARK_PATHS,onRoad} from './world.mjs';
export const PLAYER_STEP=1/120;
export function groundHeight(x,z){if(onRoad(x,z))return roadSurfaceHeight(x,z);for(const r of ROAD_SEGMENTS){const b=roadBounds(r,2.1);if(inBox(x,z,b)){const road=roadBounds(r),edge=Math.max(Math.abs(x-road.x)-road.w/2,Math.abs(z-road.z)-road.d/2);return Math.min(.06,Math.max(0,edge)*.12);}}if(PARK_PATHS.some(p=>inBox(x,z,p)))return .035;return 0;}
export function surfaceAt(x,z){return onRoad(x,z)?'road':ROAD_SEGMENTS.some(r=>inBox(x,z,roadBounds(r,2.1)))?'pavement':PARK_PATHS.some(p=>inBox(x,z,p))?'gravel':'grass';}
export const freshPlayer=(x,z)=>({x,z,y:groundHeight(x,z),vx:0,vz:0,vy:0,grounded:true,jump:0,coyote:.1,landed:0});
/** Responsive kinematic controller: fixed steps, swept substeps, buffered jump. */
export function stepPlayer(s,input,dt,blocked){const moving=Math.hypot(input.x,input.z)>.01,air=s.grounded?1:.45,rate=(moving?12:16)*air;s.vx+=(input.x-s.vx)*(1-Math.exp(-rate*dt));s.vz+=(input.z-s.vz)*(1-Math.exp(-rate*dt));
 if(!moving&&Math.hypot(s.vx,s.vz)<.03){s.vx=0;s.vz=0;}
 const distance=Math.hypot(s.vx,s.vz)*dt,steps=Math.max(1,Math.ceil(distance/.12));
 for(let i=0;i<steps;i++){const nx=s.x+s.vx*dt/steps,nz=s.z+s.vz*dt/steps;if(!blocked(nx,s.z))s.x=nx;else s.vx=0;if(!blocked(s.x,nz))s.z=nz;else s.vz=0;}
 s.jump=Math.max(0,s.jump-dt);s.coyote=s.grounded?.1:Math.max(0,s.coyote-dt);
 if(input.jump)s.jump=.12;
 if(s.jump>0&&s.coyote>0){s.vy=input.lowGravity?9:4.8;s.grounded=false;s.coyote=0;s.jump=0;}
 if(!s.grounded){s.vy-=(input.lowGravity?6:9.81)*dt;s.y+=s.vy*dt;}
 const ground=groundHeight(s.x,s.z);s.landed=Math.max(0,s.landed-dt);
 if(s.y<=ground&&s.vy<=0){if(!s.grounded)s.landed=Math.min(.2,Math.abs(s.vy)*.025);s.y=ground;s.vy=0;s.grounded=true;}
 else if(s.grounded)s.y=ground;
 return s;
}
