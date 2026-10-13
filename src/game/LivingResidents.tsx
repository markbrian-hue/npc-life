import {AVATAR_RADIUS} from '../../shared/avatarDimensions.mjs';
import {groundHeight} from '../../shared/playerPhysics.mjs';
import {pedestrianBodies,residentBlocked} from './pedestrianBodies';
import {useEffect,useRef,type MutableRefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import {MathUtils,type Group} from 'three';
import {Character} from './Character';
import {blocked} from './world';
import type {LivingRuntime} from './LivingCity';
import {WorldSign} from './DistrictWorld';
// Market pavement is a connected, collision-tested corridor. Residents have
// different destinations and offsets, rather than traversing buildings to jobs.
const RESIDENTS=[{name:'Decaf Dave',x:31,z:6,shirt:'#78a990'},{name:'Latte Linda',x:60,z:6,shirt:'#c68691'},{name:'Shiftless Sid',x:42,z:6,shirt:'#9a89b5'},{name:'Receipt Ray',x:54,z:6,shirt:'#b5a061'},{name:'Atlas Ada',x:-34,z:-143.5,shirt:'#698fbb'},{name:'Campus Kai',x:-20,z:-143.5,shirt:'#c99266'},{name:'Solar Sam',x:174,z:-36,shirt:'#75977c'},{name:'Wrench Ren',x:174,z:-24,shirt:'#a29ab7'}];
export function LivingResidents({runtime}:{runtime:MutableRefObject<LivingRuntime>}){return <>{RESIDENTS.map((person,index)=><Resident key={person.name} person={person} index={index} runtime={runtime}/>)}</>;}
function Resident({person,index,runtime}:{person:typeof RESIDENTS[number];index:number;runtime:MutableRefObject<LivingRuntime>}) {
 const root=useRef<Group>(null),arm=useRef<Group>(null),left=useRef<Group>(null),right=useRef<Group>(null),cup=useRef<Group>(null),umbrella=useRef<Group>(null),label=useRef<Group>(null);
 useEffect(()=>()=>{pedestrianBodies.delete(person.name);},[person.name]);
 const stage=useRef(''),delay=useRef(index*2),cycle=useRef(0),moving=useRef(0);
 useFrame((_,raw)=>{
  const actor=root.current;if(!actor)return;actor.position.y=groundHeight(actor.position.x,actor.position.z);pedestrianBodies.set(person.name,{x:actor.position.x,z:actor.position.z});const dt=Math.min(raw,.1),e=runtime.current.env;
  const mode=e.minute<360||e.minute>1320?'home':e.rain>.25?'shelter':e.minute>720&&e.minute<900?'lunch':e.minute<690?'coffee':'stroll';
  if(stage.current!==mode){stage.current=mode;delay.current=index*1.5;}
  let x=person.x,z=person.z;
  if(mode==='shelter'||mode==='coffee'){x=55.6+index*1.25;z=6.55;}
  if(mode==='lunch'){x=34.5+index*1.25;z=6.55;}
  if(mode==='stroll')x=person.x+Math.sin(e.seconds/35+index)*2;
  if(person.z< -120){x=person.x+(mode==='home'?0:Math.sin(e.seconds/25+index)*2);z=person.z;}
  if(person.x>130){x=person.x;z=person.z+(mode==='home'?0:Math.sin(e.seconds/25+index)*2);}
  const dx=x-actor.position.x,dz=z-actor.position.z,d=Math.hypot(dx,dz);let walking=false;
  if(delay.current>0)delay.current-=dt;
  else if(d>.12){const speed=(.85+index*.11)*dt,nx=actor.position.x+dx/d*Math.min(d,speed),nz=actor.position.z+dz/d*Math.min(d,speed);if(!blocked(nx,nz,AVATAR_RADIUS)&&!residentBlocked(nx,nz,actor.position.x,actor.position.z,person.name)){actor.position.set(nx,groundHeight(nx,nz),nz);const yaw=Math.atan2(dx,dz);actor.rotation.y+=Math.atan2(Math.sin(yaw-actor.rotation.y),Math.cos(yaw-actor.rotation.y))*(1-Math.exp(-6*dt));walking=true;}}
  moving.current=MathUtils.damp(moving.current,walking?1:0,8,dt);cycle.current+=dt*6;
  if(left.current)left.current.rotation.x=Math.sin(cycle.current)*.4*moving.current;
  if(right.current)right.current.rotation.x=-Math.sin(cycle.current)*.4*moving.current;
  if(arm.current)arm.current.rotation.x=mode==='coffee'&&!walking?-1.1:0;
  if(cup.current)cup.current.visible=mode==='coffee'||mode==='lunch';
  if(umbrella.current)umbrella.current.visible=e.rain>.25&&walking;
  if(label.current)label.current.visible=!walking&&d<.3;
 });
 return <group ref={root} position={[person.x,0,person.z]}>
  <Character shirt={person.shirt} gender={index%2?'woman':'man'} leftLegRef={left} rightLegRef={right} rightArmRef={arm}/>
  <group ref={cup} visible={false} position={[.5,1.85,.35]}><mesh><cylinderGeometry args={[.11,.08,.26,8]}/><meshStandardMaterial color="#eedeb6"/></mesh></group>
  <group ref={umbrella} visible={false} position={[0,3.2,0]}><mesh><coneGeometry args={[1.05,.4,8]}/><meshStandardMaterial color={person.shirt}/></mesh></group>
  <group ref={label} position={[0,3.25,0]}><WorldSign text={person.name} width={2.8}/></group>
 </group>;
}
