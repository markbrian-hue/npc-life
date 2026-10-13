import {memo,useRef,type ReactNode} from 'react';
import {useFrame} from '@react-three/fiber';
import type {Group} from 'three';
import {EXPLORER_SITES} from '../../shared/exploration.mjs';
import {WorldSign} from './DistrictWorld';
import type {Exploration} from './Exploration';
function Nearby({x,z,children}:{x:number;z:number;children:ReactNode}){const root=useRef<Group>(null);useFrame(({camera})=>{if(root.current)root.current.visible=Math.hypot(camera.position.x-x,camera.position.z-z)<170;});return <group ref={root} position={[x,0,z]}>{children}</group>;}
const Landmarks=memo(function Landmarks(){return <>
 <Nearby x={-65} z={-185}>
  <mesh position={[0,2.25,0]} castShadow receiveShadow><cylinderGeometry args={[5.6,6,4.5,24]}/><meshStandardMaterial color="#d5cec0" roughness={.9}/></mesh>
  <mesh position={[0,4.5,0]} castShadow><sphereGeometry args={[5.65,24,12,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color="#769b9e" metalness={.55} roughness={.35}/></mesh>
  <mesh position={[0,9.5,2.5]} rotation={[.9,0,0]}><cylinderGeometry args={[.7,.6,5,16]}/><meshStandardMaterial color="#e4dfcc" metalness={.3} roughness={.45}/></mesh>
  <mesh position={[0,4.5,0]}><sphereGeometry args={[5.67,12,12,Math.PI/2-.09,.18,0,Math.PI/2]}/><meshStandardMaterial color="#2c444d" roughness={.6}/></mesh>
  <mesh position={[0,11.08,4.48]} rotation={[.9,0,0]}><cylinderGeometry args={[.57,.57,.04,16]}/><meshStandardMaterial color="#182f3c" metalness={.7} roughness={.12}/></mesh>
  <mesh position={[0,1.6,5.85]}><boxGeometry args={[3.4,3.2,.45]}/><meshStandardMaterial color="#9daea7"/></mesh>
  <mesh position={[0,1.4,6.10]}><boxGeometry args={[1.9,2.8,.15]}/><meshStandardMaterial color="#485b60"/></mesh>
  <group position={[0,3.35,5.6]}><WorldSign text="HILLTOP OBSERVATORY" width={7}/></group>
 </Nearby>
 <Nearby x={184} z={-115}>
  <mesh position={[0,.07,0]} receiveShadow><boxGeometry args={[21,.1,11]}/><meshStandardMaterial color="#a7aa8c"/></mesh>
  {[-7,0,7].flatMap(x=>[-2.7,2.7].map(z=><group key={`${x},${z}`} position={[x,1.3,z]}><mesh castShadow rotation={[-.28,0,0]}><boxGeometry args={[5.8,.15,3.7]}/><meshStandardMaterial color="#294a6a" metalness={.55} roughness={.22}/></mesh><mesh position={[0,-.6,0]}><boxGeometry args={[.16,1.2,.16]}/><meshStandardMaterial color="#8a9690"/></mesh>{[-1.9,0,1.9].map(k=><mesh key={k} position={[k,.09,0]} rotation={[-.28,0,0]}><boxGeometry args={[.025,.03,3.7]}/><meshStandardMaterial color="#99b8be"/></mesh>)}</group>))}
 </Nearby>
 <Nearby x={157} z={-43}>
  <mesh position={[0,.5,0]} castShadow><boxGeometry args={[4,1,2]}/><meshStandardMaterial color="#879f91"/></mesh>
  <mesh position={[0,2.7,0]} castShadow><boxGeometry args={[5.5,.18,3.5]}/><meshStandardMaterial color="#5a807f"/></mesh>
  {[-2,2].map(x=><mesh key={x} position={[x,1.8,0]}><boxGeometry args={[.1,1.8,.1]}/><meshStandardMaterial color="#4c6564"/></mesh>)}
  <group position={[0,3.1,.2]}><WorldSign text="EASTBANK / IDEAS AT WORK" width={7}/></group>
 </Nearby>
 <Nearby x={184} z={48}>
  <mesh position={[0,.025,0]} receiveShadow><boxGeometry args={[20,.05,10]}/><meshStandardMaterial color="#b6a07c" roughness={.9}/></mesh>
  <mesh position={[0,.54,0]} castShadow><boxGeometry args={[5,.15,1.2]}/><meshStandardMaterial color="#a38b65"/></mesh>
  <mesh position={[0,1,-.5]}><boxGeometry args={[5,.7,.14]}/><meshStandardMaterial color="#a38b65"/></mesh>
  {[-1.8,1.8].map(x=><mesh key={x} position={[x,.25,0]}><boxGeometry args={[.12,.5,1]}/><meshStandardMaterial color="#546968"/></mesh>)}
  <mesh position={[0,1.1,4]}><boxGeometry args={[20,.07,.1]}/><meshStandardMaterial color="#5f7775"/></mesh>
  {[-10,-5,0,5,10].map(x=><mesh key={x} position={[x,.58,4]}><boxGeometry args={[.1,1.2,.1]}/><meshStandardMaterial color="#5f7775"/></mesh>)}
 </Nearby>
</>;});
export function ExplorerWorld({explore}:{explore:Exploration}){return <><Landmarks/>{EXPLORER_SITES.map((site,i)=><Nearby key={site.id} x={site.x} z={site.z}>
 <mesh position={[0,.077,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.05,1.18,32]}/><meshBasicMaterial color={explore.record.visits.includes(site.id)?'#b6dfc5':'#e2c67c'}/></mesh>
 <mesh position={[1.9,.9,-.5]}><boxGeometry args={[.11,1.8,.11]}/><meshStandardMaterial color="#557970"/></mesh>
 <group position={[1.9,2.1,-.5]}><WorldSign text={`${String(i+1).padStart(2,'0')} / ${site.name.toUpperCase()}`} width={site.name.length>16?5.2:4.5} color="#3f776d"/></group>
 <group position={[1.9,1.6,-.5]}><WorldSign text={site.station?'Z / DISCOVER   X / SHUTTLE':'Z / COLLECT PASSPORT STAMP'} width={4.2}/></group>
</Nearby>)}{explore.target&&<group position={[explore.target.x,2.5,explore.target.z]}><mesh rotation={[0,0,Math.PI/4]}><boxGeometry args={[.45,.45,.1]}/><meshBasicMaterial color="#99f2ca"/></mesh><group position={[0,.75,0]}><WorldSign text="CONTRACT / Z" width={2.8} color="#417d6c"/></group></group>}</>;}
