import {useMemo,useRef,type MutableRefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import {MathUtils,type PointLight} from 'three';
import {LAMP_POSTS} from './world';
import type {LivingRuntime} from './LivingCity';
/** A bounded pool of actual lights follows the nearest existing lamp posts. */
export function StreetLighting({runtime,quality}:{runtime:MutableRefObject<LivingRuntime>;quality:string}){
 const count=quality==='low'?0:quality==='high'?5:3,lamps=useRef<(PointLight|null)[]>([]),slots=useMemo(()=>Array.from({length:count},(_,i)=>i),[count]);
 useFrame(({camera})=>{const e=runtime.current.env,night=1-MathUtils.smoothstep(e.daylight,0,.23),nearest=[...LAMP_POSTS].sort((a,b)=>Math.hypot(a.x-camera.position.x,a.z-camera.position.z)-Math.hypot(b.x-camera.position.x,b.z-camera.position.z));lamps.current.forEach((light,i)=>{if(!light)return;const p=nearest[i];if(p){light.position.set(p.x+.8,4.5,p.z);light.intensity=night*32;light.visible=night>.025;}else light.intensity=0;});});
 return <>{slots.map(i=><pointLight key={i} ref={l=>{lamps.current[i]=l;}} color="#ffce88" intensity={0} distance={14} decay={2}/>)}</>;
}
