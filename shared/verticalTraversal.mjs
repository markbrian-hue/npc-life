// Walkable elevated surfaces use the same metres, footprints and vehicle catalog as rendering.
// Kinematic traversal only: no external rigid-body dependency or new save format.
import {BUILDINGS,blocked,roadAt} from './world.mjs';
import {VEHICLE_BY_ID} from './vehicleCatalog.mjs';
import {supportsAt,vehicleSolids,vehicleForm,SUPPORT_RADIUS} from './solids.mjs';

const rotateLocal=(dx,dz,yaw)=>({x:Math.cos(yaw)*dx-Math.sin(yaw)*dz,z:Math.sin(yaw)*dx+Math.cos(yaw)*dz});
const fromLocal=(b,x,z)=>({x:b.x+Math.cos(b.rotation||0)*x+Math.sin(b.rotation||0)*z,z:b.z-Math.sin(b.rotation||0)*x+Math.cos(b.rotation||0)*z});

// The original 26 authored accesses keep their order and ids (roof-0 … roof-25).
const roofAccess=BUILDINGS.map((b,index)=>({b,index}));
const original=roofAccess.filter(({b,index})=>b.h>=6&&index%5===0).slice(0,16);
const boroughAccess=roofAccess.filter(({b,index})=>['tower','brownstone'].includes(b.kind)&&
  !original.some(l=>l.index===index)).filter(({b})=>b.kind==='brownstone'||b.h<=39);
const uptownAccess=roofAccess.filter(({b,index})=>b.z<-214&&b.h>=10&&b.h<=50&&!original.some(l=>l.index===index));
const authored=[...original,...boroughAccess.filter(({b})=>b.kind==='tower').slice(0,2),
  ...boroughAccess.filter(({b})=>b.kind==='brownstone').slice(0,2),
  ...uptownAccess.filter(({b})=>b.kind==='tower').slice(0,3),
  ...uptownAccess.filter(({b})=>b.kind==='brownstone').slice(0,3)];

function ladderFor(b,index){
 const localX=b.w*.31;
 const anchor=fromLocal(b,localX,b.d/2+.83);
 const landing=fromLocal(b,localX,b.d/2-1.15);
 return {index,x:anchor.x,z:anchor.z,roof:b.h+.075,rotation:b.rotation||0,building:b,landing};
}
// Fire escapes are added to every low and mid-rise building whose ladder base is on
// clear, off-road pavement. Towers above 32 m keep only their authored access.
const MAX_FIRE_ESCAPE_HEIGHT=32,MIN_LADDER_SPACING=3;
function validFireEscape(l,taken){
 if(l.building.d<3||l.building.w<3)return false;
 if(blocked(l.x,l.z,.42,0)||roadAt(l.x,l.z))return false;
 if(!blocked(l.landing.x,l.landing.z,.42,0)||blocked(l.landing.x,l.landing.z,.42,l.roof))return false;
 return taken.every(o=>Math.hypot(o.x-l.x,o.z-l.z)>=MIN_LADDER_SPACING);
}
const authoredLadders=authored.map(({b,index})=>ladderFor(b,index));
const fireEscapes=[];
for(const {b,index} of roofAccess){
 if(authored.some(a=>a.index===index)||b.h>MAX_FIRE_ESCAPE_HEIGHT)continue;
 const candidate=ladderFor(b,index);
 if(validFireEscape(candidate,[...authoredLadders,...fireEscapes]))fireEscapes.push(candidate);
}
export const ROOFTOP_LADDERS=[...authoredLadders,...fireEscapes].map((l,i)=>({id:'roof-'+i,...l}));

export function nearLadder(x,z,maxDistance=1.1){
 return ROOFTOP_LADDERS.find(l=>Math.hypot(x-l.x,z-l.z)<maxDistance)||null;
}
/** A ladder whose rooftop landing is beside a player standing on that roof. */
export function nearLadderTop(x,z,y,maxDistance=1.2){
 return ROOFTOP_LADDERS.find(l=>Math.abs(y-l.roof)<.3&&Math.hypot(x-l.landing.x,z-l.landing.z)<maxDistance)||null;
}

function insideOriented(x,z,center,halfX,halfZ,rotation,r=.18){
 const a=rotateLocal(x-center.x,z-center.z,rotation||0);
 return Math.abs(a.x)<=halfX-r&&Math.abs(a.z)<=halfZ-r;
}
/** The rendered roof panel of a car (null for motorcycles). */
export function vehicleRoof(car,ground=()=>0){
 const v=VEHICLE_BY_ID[car.model]||VEHICLE_BY_ID.sedan;
 if(v.category==='Motorcycles')return null;
 const roof=vehicleSolids(car,ground).find(s=>s.id==='vehicle:'+car.id);
 return {id:roof.id,x:roof.x,z:roof.z,rotation:car.heading,halfX:roof.halfX,halfZ:roof.halfZ,y:roof.top,vehicle:car};
}
export {vehicleForm};
/** All walkable surfaces whose footprint (grown by the avatar radius) contains the point. */
export function platformsAt(x,z,cars=[],ground=()=>0,radius=SUPPORT_RADIUS){
 return supportsAt(x,z,radius,cars,ground);
}
/** Legacy manual mantle target: a car roof just above the feet within arm's reach. */
export function reachableCarLedge(x,z,y,cars=[],ground=()=>0){
 for(const car of cars){
  const roof=vehicleRoof(car,ground);if(!roof)continue;
  if(roof.y-y<-.08||roof.y-y>.7)continue;
  if(insideOriented(x,z,roof,roof.halfX+.75,roof.halfZ+.75,roof.rotation,0))
   return {id:roof.id,x:roof.x,z:roof.z,y:roof.y};
 }
 return null;
}
