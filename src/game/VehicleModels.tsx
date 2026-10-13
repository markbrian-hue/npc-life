import {StaticVehicleBody} from './StaticVehicleBody';
import {memo,useMemo,useRef,useEffect,type MutableRefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import {MathUtils,Vector3,type Group,type MeshStandardMaterial} from 'three';
import {VEHICLE_BY_ID} from '../../shared/vehicleCatalog.mjs';
import {rounded,tube,bodyShell,glasshouse,roofPanel,vehicleTrim,archTrim,wheelGeometry,distantWheels,form,type Point} from './vehicleGeometry';
import type {LivingRuntime} from './LivingCity';
import {Character} from './Character';
type Motion={speed:number;steer:number;braking:boolean;lean:number;pitch:number;roll:number;signal:number;driver:string;suspension?:{heave:number;wheels:number[]}};
function Part({at,size,color,metal=0,rough=.45,radius=.035}:{at:Point;size:Point;color:string;metal?:number;rough?:number;radius?:number}){return <mesh geometry={rounded(size,radius)} position={at} castShadow receiveShadow><meshStandardMaterial color={color} metalness={metal} roughness={rough}/></mesh>;}
function Pipe({points,color='#b0b4b6',radius=.016}:{points:Point[];color?:string;radius?:number}){const g=useMemo(()=>tube(points,radius),[JSON.stringify(points),radius]);useEffect(()=>()=>g.dispose(),[g]);return <mesh geometry={g} castShadow><meshStandardMaterial color={color} metalness={.7} roughness={.25}/></mesh>;}
function Wheel({x,z,r,steered,motion,rim,widthScale=1,index=0,bike=false}:{x:number;z:number;r:number;steered:boolean;motion:()=>Motion;rim:string;widthScale?:number;index?:number;bike?:boolean}){
 const turn=useRef<Group>(null),spin=useRef<Group>(null),geometry=useMemo(()=>wheelGeometry(r),[r]);
 useFrame((_,dt)=>{const c=motion();if(turn.current){turn.current.rotation.y=steered?c.steer:0;turn.current.rotation.x=bike?c.lean:0;turn.current.position.y=r+(c.suspension?.wheels[index]||0);}if(spin.current)spin.current.rotation.z-=c.speed*Math.min(dt,.1)/r;});
 const color=rim==='gold'?'#aa8b47':rim==='dark'?'#363d44':'#bec6cc';
 return <group name={`wheel:${index}`} position={[x,r,z]} ref={turn}><group ref={spin} scale={[1,1,widthScale]}><mesh geometry={geometry.tire} castShadow receiveShadow><meshStandardMaterial color="#1d2023" roughness={.87}/></mesh><mesh geometry={geometry.rim} castShadow><meshStandardMaterial color={color} metalness={.86} roughness={.22}/></mesh><mesh geometry={geometry.disc}><meshStandardMaterial color="#53595c" metalness={.7} roughness={.46}/></mesh></group></group>;
}
export const VehicleModel=memo(function VehicleModel({model,color,rim='alloy',motion,environment}:{model:string;color:string;rim?:string;motion:()=>Motion;environment:MutableRefObject<LivingRuntime>}){
 const v=VEHICLE_BY_ID[model]||VEHICLE_BY_ID.sedan,root=useRef<Group>(null),near=useRef<Group>(null),far=useRef<Group>(null),world=useMemo(()=>new Vector3(),[]);
 useFrame(({camera})=>{if(!root.current||!near.current||!far.current)return;root.current.getWorldPosition(world);const close=camera.position.distanceToSquared(world)<38*38;near.current.visible=close;far.current.visible=!close;});
 useEffect(()=>{const group=root.current;return()=>{const mats=new Set<MeshStandardMaterial>();group?.traverse(o=>{const m=(o as import('three').Mesh).material;if(m)for(const mat of Array.isArray(m)?m:[m])mats.add(mat as MeshStandardMaterial);});mats.forEach(m=>m.dispose());};},[]);
 return <group ref={root} dispose={null}><group ref={near} name="vehicle-detail">{v.category==='Motorcycles'?<Motorcycle v={v} color={color} rim={rim} motion={motion} environment={environment}/>:<Automobile v={v} color={color} rim={rim} motion={motion} environment={environment}/>}</group><group ref={far} name="vehicle-distant" visible={false}><DistantVehicle v={v} color={color}/></group></group>;
});
function DistantVehicle({v,color}:{v:typeof VEHICLE_BY_ID[string];color:string}){const bike=v.category==='Motorcycles';return <><mesh geometry={bike?rounded([v.wheelbase,.28,.3],.09):bodyShell(v)} position={bike?[0,.72,0]:[0,0,0]} castShadow receiveShadow><meshStandardMaterial color={color} metalness={.4} roughness={.32}/></mesh>{!bike&&<mesh geometry={glasshouse(v)} castShadow><meshStandardMaterial color="#263b46" metalness={.3} roughness={.1}/></mesh>}<mesh geometry={distantWheels(v)} castShadow><meshStandardMaterial color="#22272b" roughness={.85}/></mesh></>;}
type ModelProps={v:typeof VEHICLE_BY_ID[string];color:string;rim:string;motion:()=>Motion;environment:MutableRefObject<LivingRuntime>};
function Automobile({v,color,rim,motion,environment}:ModelProps){
 const chassis=useRef<Group>(null),head=useRef<(MeshStandardMaterial|null)[]>([]),tail=useRef<(MeshStandardMaterial|null)[]>([]),signals=useRef<(MeshStandardMaterial|null)[]>([]);
 const f=form(v),open=v.body==='roadster',L=v.length,W=v.width,H=v.height;
 useFrame(({clock},dt)=>{const c=motion(),night=environment.current.env.night;if(chassis.current){chassis.current.rotation.z=MathUtils.damp(chassis.current.rotation.z,c.pitch||0,12,dt);chassis.current.rotation.x=MathUtils.damp(chassis.current.rotation.x,c.roll||0,12,dt);chassis.current.position.y=MathUtils.damp(chassis.current.position.y,c.suspension?.heave||0,18,dt);}head.current.forEach(m=>{if(m)m.emissiveIntensity=.7+night*2;});tail.current.forEach(m=>{if(m)m.emissiveIntensity=c.braking?3:.2+night*.7;});signals.current.forEach((m,i)=>{if(m)m.emissiveIntensity=c.signal===(i%2?1:-1)&&Math.sin(clock.elapsedTime*10)>0?3:.02;});});
 return <group>
  {[-1,1].flatMap(a=>[-1,1].map(s=><Wheel key={`${a}${s}`} x={a*v.wheelbase/2} z={s*(W/2-(v.category==='Premium'?.17:.12))} r={f.r} steered={a>0} motion={motion} rim={rim} index={(a>0?2:0)+(s>0?1:0)} widthScale={v.category==='Premium'?1.8:1.25}/>))}
  <StaticVehicleBody target={chassis}>
   <mesh name="sculpted-body" geometry={bodyShell(v)} castShadow receiveShadow><meshPhysicalMaterial color={color} metalness={.55} roughness={.27} clearcoat={1} clearcoatRoughness={.18} envMapIntensity={1.35}/></mesh>
   <Part at={[0,.24,0]} size={[v.wheelbase-.8,.09,W*.64]} color="#171c20"/>
   <mesh geometry={archTrim(v)} castShadow><meshStandardMaterial color={f.exotic?color:'#343c40'} metalness={.35} roughness={.44}/></mesh>
   {!open&&<><mesh name="glazing" geometry={glasshouse(v)} castShadow><meshPhysicalMaterial color="#263b46" metalness={.3} roughness={.065} clearcoat={1} envMapIntensity={1.8}/></mesh><mesh geometry={roofPanel(v)} position={[(f.frontRoof+f.backRoof)/2,f.roof-.015,0]} castShadow><meshPhysicalMaterial color={color} metalness={.55} roughness={.26} clearcoat={1}/></mesh></>}
   <mesh geometry={vehicleTrim(v)} castShadow><meshStandardMaterial color={v.body==='luxury'?'#9fa9ad':color} metalness={.6} roughness={.25}/></mesh>
   <Part at={[L*.485,.37,0]} size={[.12,.2,W*.87]} color={color} metal={.45} radius={.065}/>
   <Part at={[-L*.49,.36,0]} size={[.12,.18,W*.88]} color={color} metal={.4} radius={.06}/>
   <Part at={[L*.50,.34,0]} size={[.035,.14,W*.48]} color="#11191f" radius={.015}/>
   <Part at={[L*.486,f.belt*.7,0]} size={[.065,f.exotic?.1:.22,W*.42]} color="#151c23" radius={.035}/>
   {Array.from({length:v.body==='luxury'?11:4},(_,i)=><Part key={i} at={[L*.501,f.belt*.7+(v.body==='luxury'?0:(i-1.5)*.044),v.body==='luxury'?(i-5)*W*.032:0]} size={v.body==='luxury'?[.018,.20,.014]:[.018,.012,W*.37]} color="#86949a" metal={.9} radius={.004}/>)}
   <Part at={[-L*.497,.28,0]} size={[.065,.15,W*.6]} color="#20282e" radius={.025}/>
   {[L*.506,-L*.501].map(x=><Part key={x} at={[x,.435,0]} size={[.017,.105,.36]} color="#deddd1" radius={.01}/>)}
   {[-1,1].map((s,i)=><group key={s}>
    <Part at={[f.frontBase-.18,f.belt+.11,s*W*.52]} size={[.24,.105,.17]} color={color} metal={.5} radius={.05}/>
    <Part at={[f.frontBase-.285,f.belt+.115,s*W*.52]} size={[.016,.07,.125]} color="#94a7ad" metal={.95} rough={.06}/>
    <Part at={[f.frontBase-.15,f.belt+.04,s*W*.455]} size={[.1,.035,.17]} color="#20292f" radius={.012}/>
    <Part at={[-.19,f.belt-.03,s*W*.498]} size={[.18,.038,.025]} color={v.category==='Premium'?'#bbc2c4':color} metal={.6} radius={.015}/>
    <Pipe points={[[f.frontBase-.14,.37,s*W*.49],[f.frontBase-.18,f.belt-.05,s*W*.499],[f.frontBase-.25,f.belt+.015,s*W*.46]]} color="#354149" radius={.006}/>
    <Pipe points={[[-L*.11,.3,s*W*.49],[-L*.12,f.belt-.02,s*W*.5]]} color="#354149" radius={.005}/>
    <Part at={[0,.285,s*W*.495]} size={[v.wheelbase-.8,.08,.06]} color={f.sport?'#263139':color} metal={.35}/>
    <Part at={[L*.465,f.belt*.9,s*W*.33]} size={[.13,f.exotic?.095:.16,W*.26]} color="#17262f" radius={.045}/>
    <mesh position={[L*.499,f.belt*.91,s*W*.33]} geometry={rounded([.035,.035,W*.225],.015)}><meshStandardMaterial ref={m=>{head.current[i]=m;}} color="#eff9fb" emissive="#dceffc" toneMapped={false}/></mesh>
    <Part at={[-L*.501,f.belt*.92,s*W*.30]} size={[.04,.13,W*.29]} color="#272d32" radius={.025}/>
    <mesh name={`tail-lamp:${i}`} position={[-L*.512,f.belt*.92,s*W*.30]} geometry={rounded([.035,.07,W*.27],.025)}><meshStandardMaterial ref={m=>{tail.current[i]=m;}} color="#871e27" emissive="#f53436"/></mesh>
    <mesh position={[L*.48,f.belt*.78,s*W*.43]} geometry={rounded([.045,.03,.085],.01)}><meshStandardMaterial ref={m=>{signals.current[i]=m;}} color="#8c6f36" emissive="#ffb633"/></mesh>
    <Part at={[L*.466,.34,s*W*.345]} size={[.11,.15,W*.145]} color="#172127" radius={.025}/>
    <Pipe points={[[L*.49,.27,s*W*.43],[L*.48,.24,s*W*.18]]} color="#263038" radius={.022}/>
    <mesh position={[-L*.505,.29,s*W*.31]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.042,.05,.10,12,1,true]}/><meshStandardMaterial color="#c1c5c4" metalness={.85} roughness={.2}/></mesh>
   </group>)}
   {f.pickup&&<><Part at={[-L*.31,f.belt+.1,0]} size={[L*.27,.08,W*.8]} color="#2e3438"/>{[-1,1].map(s=><Part key={s} at={[-L*.31,f.belt+.21,s*W*.43]} size={[L*.28,.22,.09]} color={color} metal={.4}/>)}<Part at={[-L*.448,f.belt+.16,0]} size={[.07,.3,W*.84]} color={color}/></>}
   {f.utility&&Array.from({length:v.body==='bus'?5:2},(_,j)=>[-1,1].map(s=><Part key={`${j}${s}`} at={[-L*.3+j*L*(v.body==='bus'?.13:.22),H*.7,s*W*.37]} size={[.07,H*.48,.055]} color={color}/>))}
   {open&&<><mesh position={[f.frontBase-.23,H*.83,0]} rotation={[0,0,.35]} geometry={rounded([.06,.36,W*.72],.02)}><meshPhysicalMaterial color="#809aa6" metalness={.5} roughness={.04}/></mesh><Part at={[-.2,.60,0]} size={[1.35,.10,W*.72]} color="#22292c"/>{[-1,1].map(s=><group key={s}><Part at={[-.36,.75,s*.36]} size={[.24,.38,.42]} color="#785449" radius={.06}/><Pipe points={[[-.57,.72,s*.36-.17],[-.57,.95,s*.36-.17],[-.57,1.03,s*.36],[-.57,.95,s*.36+.17],[-.57,.72,s*.36+.17]]} radius={.035}/></group>)}</>}
   {['tuner','supercar','hypercar'].includes(v.body)&&<><Part at={[-L*.35,f.belt+.25,0]} size={[.27,.055,W*.85]} color={color} metal={.5}/>{[-1,1].map(s=><Part key={s} at={[-L*.35,f.belt+.14,s*.49]} size={[.04,.2,.04]} color="#272d32"/>)}</>}
   {['taxi','police','ambulance','service'].includes(v.body)&&<Part at={[0,H+.055,0]} size={[.65,.11,.28]} color={v.body==='taxi'?'#e1bc55':v.body==='service'?'#b98430':'#6285a5'} radius={.04}/>}
   {['police','ambulance'].includes(v.body)&&[-1,1].map(s=><Part key={s} at={[0,f.belt*.83,s*W*.5]} size={[v.wheelbase-.5,.14,.012]} color={v.body==='police'?'#233746':'#973d3a'} radius={.004}/>)}
  </StaticVehicleBody>
 </group>;
}
function Motorcycle({v,color,rim,motion,environment}:ModelProps){
 const body=useRef<Group>(null),rider=useRef<Group>(null),light=useRef<MeshStandardMaterial>(null),tail=useRef<MeshStandardMaterial>(null);
 const sporty=['sportbike','naked','offroad'].includes(v.body),scooter=v.body==='scooter',cruiser=v.body==='cruiser',r=cruiser?.32:v.body==='offroad'?.4:.34;
 useFrame((_,dt)=>{const c=motion();if(body.current){body.current.rotation.x=MathUtils.damp(body.current.rotation.x,c.lean||0,7,dt);body.current.rotation.z=c.pitch||0;body.current.position.y=c.suspension?.heave||0;}if(rider.current)rider.current.visible=!!c.driver;if(light.current)light.current.emissiveIntensity=.15+environment.current.env.night*2;if(tail.current)tail.current.emissiveIntensity=c.braking?2.5:.2;});
 return <group>
  {[-1,1].map(s=><Wheel key={s} x={s*v.wheelbase/2} z={0} r={r} steered={s>0} motion={motion} rim={rim} index={s>0?1:0} bike widthScale={.85}/>)}
  <group name="sprung-body" ref={body}>
  {[-1,1].map(s=><group key={`frame${s}`}><Pipe points={[[-v.wheelbase*.42,.37,s*.10],[-.3,.86,s*.12],[v.wheelbase*.37,1.1,s*.09],[.2,.43,s*.13],[-v.wheelbase*.42,.37,s*.10]]} color="#303c43" radius={.034}/><Pipe points={[[.2,.5,s*.2],[-.05,.37,s*.23],[-v.wheelbase*.43,.3,s*.23]]} color="#a1a8a6" radius={.032}/><Part at={[-.6,.38,s*.22]} size={[.48,.11,.12]} color="#b6bcba" metal={.85} rough={.22} radius={.05}/></group>)}
  <Part at={[0,.5,0]} size={[v.wheelbase,.1,.17]} color="#343c40" metal={.7}/>
  <mesh position={[-.07,.58,0]}><cylinderGeometry args={[.23,.23,.32,10]}/><meshStandardMaterial color="#889292" metalness={.8} roughness={.28}/></mesh>
  {[0,1,2].map(i=><Part key={i} at={[-.08,.49+i*.07,0]} size={[.43,.025,.36]} color="#afb4b2" metal={.8}/>)}
  <mesh position={[.15,scooter?.72:.95,0]} scale={[.38,.2,.22]}><sphereGeometry args={[1,24,16]}/><meshPhysicalMaterial color={color} metalness={.45} roughness={.3} clearcoat={.7}/></mesh>
  <Part at={[-.32,.9,0]} size={[scooter?.65:.55,.1,.3]} color="#313238"/>
  <group position={[v.wheelbase/2-.08,.7,0]} rotation={[0,0,cruiser?-.35:-.17]}>{[-1,1].map(s=><mesh key={s} position={[0,0,s*.1]}><cylinderGeometry args={[.035,.035,.7,8]}/><meshStandardMaterial color="#b5b9b7" metalness={.8}/></mesh>)}</group>
  <Part at={[v.wheelbase/2-.18,sporty?1.12:1.28,0]} size={[.08,.05,.68]} color="#aeb8ba" metal={.7}/>
  {[-1,1].map(s=><Part key={s} at={[v.wheelbase/2-.24,1.4,s*.37]} size={[.13,.1,.08]} color="#606f77" metal={.3}/>)}
  <mesh position={[v.wheelbase/2-.03,1.1,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.1,.12,.08,12]}/><meshStandardMaterial ref={light} color="#dee7dc" emissive="#e8ebcd"/></mesh>
  <mesh position={[-v.wheelbase/2,.9,0]}><boxGeometry args={[.05,.07,.22]}/><meshStandardMaterial ref={tail} color="#c35b4f" emissive="#ed4036"/></mesh>
  {(sporty||scooter)&&<mesh position={[.5,.85,0]} scale={[.2,scooter?.5:.3,.28]}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color={color} metalness={.25} roughness={.35}/></mesh>}
  {['touring','cruiser'].includes(v.body)&&[-1,1].map(s=><Part key={s} at={[-.62,.72,s*.33]} size={[.5,.38,.22]} color={color}/>) }
  {v.body==='touring'&&<Part at={[.56,1.4,0]} size={[.06,.38,.38]} color="#8daab3" rough={.15}/>} 
  <group ref={rider} visible={false} position={[-.17,.29,0]} rotation={[0,Math.PI/2,0]} scale={.68}><Character shirt="#6a777b" riding={sporty?'sport':'upright'}/><mesh position={[0,1.82,0]} scale={[.22,.225,.23]}><sphereGeometry args={[1,24,16]}/><meshPhysicalMaterial color="#303b43" metalness={.4} roughness={.25} clearcoat={1}/></mesh><mesh position={[0,1.81,.19]} geometry={rounded([.34,.10,.07],.04)}><meshPhysicalMaterial color="#202e36" metalness={.55} roughness={.07}/></mesh></group>
  </group>
 </group>;
}
