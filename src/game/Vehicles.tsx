import type {LivingRuntime} from './LivingCity';
import type {MutableRefObject} from 'react';
import { playGameSound } from './gameAudio';
import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, type Group } from 'three';
import { createFleet, exitPosition, neutralControls, stepTraffic, stepVehicle, vehicleRenderPose, vehicleSpec } from '../../shared/vehicles.mjs';
import type { Multiplayer } from './Multiplayer';
import { SPAWN } from './world';
import { VehicleModel } from './VehicleModels';
import { Character } from './Character';
import { isTyping, useGameUI } from './ui/GameUI';

type Car = ReturnType<typeof createFleet>[number];
export type VehicleRuntime = { player:{x:number;z:number}; cars: Car[]; targets: Car[]; ownedId: string; networked: boolean; controls: ReturnType<typeof neutralControls> };
export function useVehicles(multiplayer: Multiplayer, player: {x:number;z:number}) {
  const {store}=useGameUI();
  const runtime=useRef<VehicleRuntime>({player,cars:createFleet(),targets:[],ownedId:'',networked:false,controls:neutralControls()});
  runtime.current.player=player;
  const [,setRevision]=useState(0);const refresh=()=>setRevision(n=>n+1);
  const [message,setMessage]=useState('');
  const [status,setStatus]=useState({name:'',speed:0,near:''});
  const state=useRef({multiplayer,player}); state.current={multiplayer,player};
  const pending=useRef(false);
  useEffect(()=>{
    if(runtime.current.ownedId) window.dispatchEvent(new CustomEvent('npc-life:relocate',{detail:SPAWN}));
    runtime.current={player,cars:multiplayer.session ? multiplayer.cars.map(c=>({...c})) : createFleet(),targets:[],ownedId:'',networked:!!multiplayer.session,controls:neutralControls()};
    window.dispatchEvent(new CustomEvent('npc-life:driving',{detail:false}));
  },[multiplayer.session?.id]);
  useEffect(()=>{
    if (!multiplayer.session) return;
    const r=runtime.current; r.targets=multiplayer.cars;
    r.ownedId=multiplayer.cars.find(c=>c.driver===multiplayer.session?.id)?.id || '';
    window.dispatchEvent(new CustomEvent('npc-life:driving',{detail:!!r.ownedId}));
  },[multiplayer.cars,multiplayer.session]);
  useEffect(()=>{
    const keys=new Set<string>();
    const reset=()=>{keys.clear();runtime.current.controls=neutralControls();state.current.multiplayer.controls.current=neutralControls();};
    const update=()=>{
      const r=runtime.current;
      r.controls=store.getSnapshot()!==null?neutralControls():{throttle:Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown')),steer:Number(keys.has('KeyA')||keys.has('ArrowLeft'))-Number(keys.has('KeyD')||keys.has('ArrowRight')),brake:keys.has('Space')};
      state.current.multiplayer.controls.current=r.controls;
    };
    const down=async(e:KeyboardEvent)=>{
      if(store.getSnapshot()!==null || isTyping(e.target)) return;
      keys.add(e.code); update();
      if(runtime.current.ownedId && ['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
      if(e.code==='KeyV'&&runtime.current.ownedId&&!e.repeat)playGameSound('horn');
      if(e.code!=='KeyR'||e.repeat||pending.current)return;
      pending.current=true;
      try {
        const r=runtime.current, {multiplayer:m,player:p}=state.current;
        let relocation: {x:number;z:number}|undefined;
        const car=r.cars.find(c=>c.id===r.ownedId);
        if(car){
          if(r.networked) relocation=await m.vehicle('exit');
          else {const exit=exitPosition(car,r.cars);if(!exit)throw new Error('Brake to a stop with clear space beside a door.');relocation=exit;car.driver='';car.speed=0;r.ownedId='';}
        }else{
          const nearest=r.cars.filter(c=>!c.driver&&Math.abs(c.speed)<.65&&Math.hypot(c.x-p.x,c.z-p.z)<4).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
          if(!nearest)throw new Error('Walk beside a parked, unoccupied car.');
          if(r.networked)await m.vehicle('enter',nearest.id);
          else {nearest.driver='local';r.ownedId=nearest.id;}
        }
        reset();setMessage('');
        if(relocation){r.ownedId='';window.dispatchEvent(new CustomEvent('npc-life:relocate',{detail:relocation}));}
        window.dispatchEvent(new CustomEvent('npc-life:driving',{detail:!!r.ownedId}));
      }catch(error){setMessage(error instanceof Error?error.message:'Vehicle unavailable.');}
      finally{pending.current=false;}
    };
    const up=(e:KeyboardEvent)=>{keys.delete(e.code);update();};
    const unsub=store.subscribe(()=>{if(store.getSnapshot()!==null)reset();});
    const timer=window.setInterval(()=>{const r=runtime.current,p=state.current.player,car=r.cars.find(c=>c.id===r.ownedId);const near=r.cars.find(c=>!c.driver&&Math.hypot(c.x-p.x,c.z-p.z)<4);setStatus({name:car?.name||'',speed:Math.round(Math.abs(car?.speed||0)*3.6),near:near?.name||''});},150);
    const position=(e:Event)=>{const p=(e as CustomEvent<{x:number;z:number}>).detail;state.current.player=p;runtime.current.player=p;};
    window.addEventListener('npc-life:position',position);
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',reset);
    return()=>{window.removeEventListener('npc-life:position',position);unsub();clearInterval(timer);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',reset);reset();};
  },[store]);
  return {runtime,status,message,refresh};
}
export type Vehicles = ReturnType<typeof useVehicles>;
function MovingCar({id,vehicles,environment}:{id:string;vehicles:Vehicles;environment:MutableRefObject<LivingRuntime>}) {
  const group=useRef<Group>(null), driver=useRef<Group>(null);
  const car=vehicles.runtime.current.cars.find(c=>c.id===id)!;
  useFrame(()=>{const c=vehicles.runtime.current.cars.find(c=>c.id===id);if(!c||!group.current)return;const p=vehicles.runtime.current.networked?c:vehicleRenderPose(c);group.current.position.set(p.x,0,p.z);group.current.rotation.y=p.heading;if(driver.current)driver.current.visible=!!c.driver&&vehicleSpec(c).category!=='Motorcycles';});
  return <group ref={group}>
    <VehicleModel model={car.model} color={car.color} rim={car.rim} environment={environment} motion={()=>vehicles.runtime.current.cars.find(c=>c.id===id)!} />
    <group ref={driver} position={[-.15,.1,-.4]} rotation={[0,Math.PI/2,0]} scale={Math.min(.49,vehicleSpec(car).height/2.6)}><Character shirt="#d1aa65" /></group>
  </group>;
}
export function VehiclesWorld({vehicles,environment}:{vehicles:Vehicles;environment:MutableRefObject<LivingRuntime>}) {
  useFrame((_,dt)=>{
    const r=vehicles.runtime.current;
    if(r.networked){
      for(const car of r.cars){const t=r.targets.find(c=>c.id===car.id);if(!t)continue;
        car.x=MathUtils.damp(car.x,t.x,16,dt);car.z=MathUtils.damp(car.z,t.z,16,dt);
        car.heading+=Math.atan2(Math.sin(t.heading-car.heading),Math.cos(t.heading-car.heading))*(1-Math.exp(-16*dt));
        car.speed=t.speed;car.driver=t.driver;car.steer=t.steer;car.braking=t.braking;car.lean=t.lean;car.pitch=t.pitch;car.roll=t.roll;car.signal=t.signal;car.rpm=t.rpm;
      }
    }else for(const car of r.cars){if(car.traffic)stepTraffic(car,dt,r.cars,[r.player]);else stepVehicle(car,car.id===r.ownedId?r.controls:neutralControls(),dt,r.cars,environment.current.env.rain);}
  },-2);
  return <>{vehicles.runtime.current.cars.map(car=><MovingCar key={car.id+car.model+car.color+car.rim} id={car.id} vehicles={vehicles} environment={environment}/>)}</>;
}
export function VehicleHUD({vehicles}:{vehicles:Vehicles}) {
  const {status,message}=vehicles;
  if(!status.name&&!status.near&&!message)return null;
  return <aside className="vehicle-hud" role="status">{status.name?<><b>{status.name}</b><strong>{status.speed} <small>KM/H</small></strong><span>W/S accelerate · A/D steer · SPACE brake · V horn · R exit</span></>:<><b>{status.near||'MOTOR POOL'}</b><span>{status.near?'R · Get in and drive':''}</span></>}{message&&<span>{message}</span>}</aside>;
}
