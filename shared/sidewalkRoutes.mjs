// Long pedestrian routes derived from the road plan: each runs along the pavement
// band beside a street, is sampled every metre against real world collision, and
// never touches the roadway. Deterministic, so every client sees the same crowd.
import {ROAD_SEGMENTS,blocked,roadAt} from './world.mjs';
import {AVATAR_RADIUS} from './avatarDimensions.mjs';

export const SIDEWALK_OFFSET=1.35; // metres beyond the kerb
const SAMPLE=1;

/** Contiguous clear stretches of pavement beside every road, longest first. */
export function sidewalkRuns({radius=AVATAR_RADIUS,minLength=24}={}){
 const runs=[];
 for(const road of ROAD_SEGMENTS){
  for(const side of [-1,1]){
   const offset=road.width/2+SIDEWALK_OFFSET;
   const at=t=>road.axis==='x'?{x:road.x-road.length/2+t,z:road.z+side*offset}:{x:road.x+side*offset,z:road.z-road.length/2+t};
   let start=null,last=null;
   const close=()=>{if(start&&last){const length=Math.hypot(last.x-start.x,last.z-start.z);if(length>=minLength)runs.push({id:`${road.id}:${side>0?'b':'a'}:${runs.length}`,road:road.id,from:start,to:last,length});}start=last=null;};
   for(let t=0;t<=road.length;t+=SAMPLE){
    const p=at(t);
    if(!blocked(p.x,p.z,radius)&&!roadAt(p.x,p.z)){if(!start)start=p;last=p;}
    else close();
   }
   close();
  }
 }
 return runs.sort((a,b)=>b.length-a.length);
}

/** A spread-out selection of long routes so pedestrians appear across every district. */
export function pedestrianRoutes({count=18,spacing=45}={}){
 const chosen=[];
 for(const run of sidewalkRuns()){
  const mid={x:(run.from.x+run.to.x)/2,z:(run.from.z+run.to.z)/2};
  if(chosen.every(c=>Math.hypot(c.mid.x-mid.x,c.mid.z-mid.z)>=spacing))chosen.push({...run,mid});
  if(chosen.length>=count)break;
 }
 return chosen;
}
export const PEDESTRIAN_ROUTES=pedestrianRoutes();
