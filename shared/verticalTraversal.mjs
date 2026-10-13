// Walkable elevated surfaces use the same metres, footprints and vehicle catalog as rendering.
// Kinematic traversal only: no external rigid-body dependency or new save format.
import {BUILDINGS} from './world.mjs';
import {VEHICLE_BY_ID} from './vehicleCatalog.mjs';

const rotateLocal=(dx,dz,yaw)=>({x:Math.cos(yaw)*dx-Math.sin(yaw)*dz,z:Math.sin(yaw)*dx+Math.cos(yaw)*dz});
const fromLocal=(b,x,z)=>({x:b.x+Math.cos(b.rotation||0)*x+Math.sin(b.rotation||0)*z,z:b.z-Math.sin(b.rotation||0)*x+Math.cos(b.rotation||0)*z});

// Only a bounded number of roof accesses are created so the scene remains inexpensive.
export const ROOFTOP_LADDERS=BUILDINGS.map((b,index)=>({b,index})).filter(({b,index})=>b.h>=6&&index%5===0).slice(0,16).map(({b,index},i)=>{
 const localX=b.w*.31;
 const anchor=fromLocal(b,localX,b.d/2+.83);
 const landing=fromLocal(b,localX,b.d/2-1.15);
 return {id:'roof-'+i,index,x:anchor.x,z:anchor.z,roof:b.h+.075,rotation:b.rotation||0,building:b,landing};
});

export function nearLadder(x,z,maxDistance=1.1){
 return ROOFTOP_LADDERS.find(l=>Math.hypot(x-l.x,z-l.z)<maxDistance)||null;
}

function insideOriented(x,z,center,halfX,halfZ,rotation,r=.18){
 const a=rotateLocal(x-center.x,z-center.z,rotation||0);
 return Math.abs(a.x)<=halfX-r&&Math.abs(a.z)<=halfZ-r;
}
export function vehicleRoof(car,ground=()=>0){
 const v=VEHICLE_BY_ID[car.model]||VEHICLE_BY_ID.sedan;
 if(v.category==='Motorcycles')return null;
 const utility=['bus','delivery','ambulance','van'].includes(v.body);
 const back=v.length*(utility?-.34:v.body==='pickup'?-.025:v.body==='suv'?-.34:-.19);
 const front=v.length*(utility?.3:.045);
 // Visual geometry roofPanel is centred at (frontRoof+backRoof)/2 in vehicle-local X.
 const centerShift=(back+front)/2,c=Math.cos(car.heading),s=Math.sin(car.heading);
 return {id:'vehicle:'+car.id,x:car.x+c*centerShift,z:car.z-s*centerShift,
  rotation:car.heading,halfX:Math.max(.35,(front-back)/2),halfZ:v.width*.35,
  y:ground(car.x,car.z)+v.height*.98+.02,vehicle:car};
}
export function platformsAt(x,z,cars=[],ground=()=>0){
 const result=[];
 for(let i=0;i<BUILDINGS.length;i++){
  const b=BUILDINGS[i];
  if(insideOriented(x,z,b,b.w/2,b.d/2,b.rotation,.2))
   result.push({id:'building:'+i,y:b.h+.075});
 }
 for(const car of cars){
  const roof=vehicleRoof(car,ground);
  if(roof&&insideOriented(x,z,roof,roof.halfX,roof.halfZ,roof.rotation,.12))
   result.push({id:roof.id,y:roof.y,vehicle:car});
 }
 return result.sort((a,b)=>b.y-a.y);
}
export function reachableCarLedge(x,z,y,cars=[],ground=()=>0){
 for(const car of cars){
  const roof=vehicleRoof(car,ground);if(!roof)continue;
  if(roof.y-y<-.08||roof.y-y>.7)continue;
  if(insideOriented(x,z,roof,roof.halfX+.75,roof.halfZ+.75,roof.rotation,0))
   return {id:roof.id,x:roof.x,z:roof.z,y:roof.y};
 }
 return null;
}
