import {groundHeight} from './playerPhysics.mjs';

// A sprung mass at each contact patch, expressed in world metres. Wheels stay
// on the kinematic road surface; this is not an airborne rigid-body solver.
export function suspensionState(){return {initialized:false,heave:0,wheels:[0,0,0,0],positions:[0,0,0,0],velocities:[0,0,0,0],load:1};}
const contactCache=new WeakMap();
export function wheelContacts(spec){
 const cached=contactCache.get(spec);if(cached)return cached;
 const bike=spec.category==='Motorcycles',track=spec.width/2-(spec.category==='Premium'?.17:.12);
 const contacts=bike?[-1,1].map(a=>({x:a*spec.wheelbase/2,z:0})):
  [-1,1].flatMap(a=>[-1,1].map(s=>({x:a*spec.wheelbase/2,z:s*track})));
 contactCache.set(spec,contacts);return contacts;
}
/** Semi-implicit, damped corner springs. Call only from the fixed-step solver. */
export function stepSuspension(car,spec,dt,acceleration=0,lateral=0,sample=groundHeight){
 const s=car.suspension||(car.suspension=suspensionState()),contacts=wheelContacts(spec);
 const center=sample(car.x,car.z),c=Math.cos(car.heading),sn=Math.sin(car.heading);
 const bike=spec.category==='Motorcycles';
 const frequency=bike?2.4:spec.category==='Performance'||spec.category==='Premium'?2.5:spec.body==='bus'?1.5:1.9;
 const omega=2*Math.PI*frequency,damping=.82;
 const travel=bike?.09:spec.body==='suv'||spec.body==='offroad'?.14:.1;
 let mean=0,front=0,rear=0,left=0,right=0,unload=0;
 for(let i=0;i<contacts.length;i++){
  const p=contacts[i],height=sample(car.x+c*p.x+sn*p.z,car.z-sn*p.x+c*p.z);
  // Acceleration lifts the nose; braking loads the front. Roll loads the
  // outside springs. Limits keep emergency impacts from exploding the rig.
  const transfer=Math.max(-travel*.55,Math.min(travel*.55,acceleration*.004*Math.sign(p.x)-lateral*.003*Math.sign(p.z)));
  const target=height+transfer;
  if(!s.initialized){s.positions[i]=height;s.velocities[i]=0;}
  s.velocities[i]+=(omega*omega*(target-s.positions[i])-2*damping*omega*s.velocities[i])*dt;
  s.positions[i]+=s.velocities[i]*dt;
  const bounded=Math.max(height-travel,Math.min(height+travel,s.positions[i]));
  if(bounded!==s.positions[i])s.velocities[i]=0;
  s.positions[i]=bounded;s.wheels[i]=height-center;
  mean+=bounded;if(p.x>0)front+=bounded;else rear+=bounded;
  if(p.z<0)left+=bounded;else if(p.z>0)right+=bounded;
  unload+=Math.abs(s.velocities[i]);
 }
 s.initialized=true;s.heave=mean/contacts.length-center;
 car.pitch=Math.atan2((front-rear)/(bike?1:2),spec.wheelbase);
 car.roll=bike?0:Math.atan2((left-right)/2,Math.abs(contacts[0].z)*2);
 // Small, bounded grip loss while the sprung mass is moving over a curb.
 s.load=Math.max(.82,1-unload/contacts.length*.2);
 return s;
}
