// One solid model for walking, standing, landing and mantling.
//
// Every solid is an oriented box with a top height. The same expanded footprint
// (box grown by the avatar radius) decides BOTH whether a body is blocked and
// whether it is supported. Because the two tests can never disagree, a player
// who loses support is always outside the solid and can never fall into it.
// Solids that must not be stood on (poles, trees, motorcycles) have an infinite
// top, so a falling body is pushed around them instead of dropping inside.
import {AVATAR_RADIUS} from './avatarDimensions.mjs';
import {VEHICLE_BY_ID} from './vehicleCatalog.mjs';
import {blocked as worldBlocked,collidersNear,WORLD_COLLIDERS} from './world.mjs';

export const SUPPORT_RADIUS=AVATAR_RADIUS;
const EPS=.025;

const UTILITY=['bus','delivery','ambulance','van'];
const SPORT=['supercar','hypercar','roadster','gt','coupe','muscle','tuner'];
const ESTATE=['hatch','tuner','suv','wagon','van','bus','delivery','ambulance'];
const PICKUP=['pickup','service'];
const EXOTIC=['supercar','hypercar'];

/** Mirrors `form()` in src/game/vehicleGeometry.ts so walkable heights match the rendered body. */
export function vehicleForm(v){
 const utility=UTILITY.includes(v.body),sport=SPORT.includes(v.body),pickup=PICKUP.includes(v.body),
  estate=ESTATE.includes(v.body),exotic=EXOTIC.includes(v.body);
 return {
  // The shell's crown sits ~7.5 cm above the belt line.
  hood:v.height*(utility?.47:sport?.56:.59)+.075,
  roof:v.height*.98,
  frontRoof:v.length*(utility?.3:exotic?.07:.045),
  backRoof:-v.length*(pickup?.025:estate?.34:exotic?.19:.19),
 };
}

const box=(id,x,z,halfX,halfZ,rotation,top,standable,extra={})=>({id,x,z,halfX,halfZ,c:Math.cos(rotation),s:Math.sin(rotation),top,standable,...extra});

/** Oriented boxes for one vehicle: the body up to the hood line, plus the cabin up to the roof.
 * Motorcycles are a single solid that can't be stood on. */
export function vehicleSolids(car,ground=()=>0){
 const v=VEHICLE_BY_ID[car.model]||VEHICLE_BY_ID.sedan,base=ground(car.x,car.z);
 if(v.category==='Motorcycles')
  return [box('vehicle:'+car.id+'#body',car.x,car.z,v.length/2,v.width/2,car.heading,Infinity,false,{vehicle:car})];
 const f=vehicleForm(v),c=Math.cos(car.heading),s=Math.sin(car.heading);
 const front=f.frontRoof,back=f.backRoof,shift=(front+back)/2;
 return [
  box('vehicle:'+car.id+'#hood',car.x,car.z,v.length/2,v.width/2,car.heading,base+f.hood,true,{vehicle:car}),
  // The roof keeps the legacy support id so carried-passenger logic and saves stay compatible.
  box('vehicle:'+car.id,car.x+c*shift,car.z-s*shift,Math.max(.35,(front-back)/2),v.width*.35,car.heading,base+f.roof+.02,true,{vehicle:car}),
 ];
}

const inside=(b,x,z,r)=>{const dx=x-b.x,dz=z-b.z;return Math.abs(b.c*dx-b.s*dz)<b.halfX+r&&Math.abs(b.s*dx+b.c*dz)<b.halfZ+r;};

/** Every solid whose radius-expanded footprint contains the point. */
export function solidsAt(x,z,radius=SUPPORT_RADIUS,cars=[],ground=()=>0){
 const result=[];
 collidersNear(x,z,radius,id=>{
  const p=WORLD_COLLIDERS[id];
  if(inside(p,x,z,radius))result.push({id:p.id,top:p.height,standable:p.standable});
 });
 for(const car of cars){
  if(Math.hypot(x-car.x,z-car.z)>(VEHICLE_BY_ID[car.model]?.length||5)/2+radius+1.5)continue;
  for(const b of vehicleSolids(car,ground))if(inside(b,x,z,radius))result.push({id:b.id,top:b.top,standable:b.standable,vehicle:car});
 }
 return result;
}

/** Walkable tops under the point (ground excluded), highest first. */
export function supportsAt(x,z,radius=SUPPORT_RADIUS,cars=[],ground=()=>0){
 return solidsAt(x,z,radius,cars,ground).filter(p=>p.standable&&Number.isFinite(p.top))
  .map(p=>({id:p.id,y:p.top,vehicle:p.vehicle})).sort((a,b)=>b.y-a.y);
}

/** Height-aware blocking against the world AND vehicles. `step` lets a grounded body walk up low ledges. */
export function solidBlocked(x,z,radius,feetY,cars=[],ground=()=>0,step=0){
 const feet=feetY+step;
 if(worldBlocked(x,z,radius,feet))return true;
 for(const car of cars){
  if(Math.hypot(x-car.x,z-car.z)>(VEHICLE_BY_ID[car.model]?.length||5)/2+radius+1.5)continue;
  for(const b of vehicleSolids(car,ground))if(feet<b.top-EPS&&inside(b,x,z,radius))return true;
 }
 return false;
}
