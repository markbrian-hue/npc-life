import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {memo,useMemo,useRef,type MutableRefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import {BufferGeometry,Float32BufferAttribute,MathUtils,BoxGeometry,CylinderGeometry,TorusGeometry,type Group,type MeshStandardMaterial} from 'three';
import {VEHICLE_BY_ID} from '../../shared/vehicleCatalog.mjs';
import type {LivingRuntime} from './LivingCity';
import {Character} from './Character';

type Motion={speed:number;steer:number;braking:boolean;lean:number;pitch:number;roll:number;signal:number;driver:string};
const geometryCache=new Map<string,BufferGeometry>();
/** Sculpted cross-sections, shared for every instance of a model. Local forward is +X. */
function loft(key:string,sections:number[][]){const cached=geometryCache.get(key);if(cached)return cached;const positions:number[]=[];const ring=(s:number[])=>[[s[0],s[1],-s[3]],[s[0],s[2],-s[3]*.91],[s[0],s[2],s[3]*.91],[s[0],s[1],s[3]]];const triangle=(a:number[],b:number[],c:number[])=>positions.push(...a,...b,...c);for(let i=0;i<sections.length-1;i++){const a=ring(sections[i]),b=ring(sections[i+1]);for(let j=0;j<4;j++){const n=(j+1)%4;triangle(a[j],b[n],b[j]);triangle(a[j],a[n],b[n]);}}const a=ring(sections[0]),b=ring(sections.at(-1)!);triangle(a[0],a[2],a[1]);triangle(a[0],a[3],a[2]);triangle(b[0],b[1],b[2]);triangle(b[0],b[2],b[3]);const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.computeVertexNormals();geometryCache.set(key,g);return g;}
function Part({at,size,color,metal=0,rough=.6}:{at:[number,number,number];size:[number,number,number];color:string;metal?:number;rough?:number}){return <mesh position={at} castShadow><boxGeometry args={size}/><meshStandardMaterial color={color} metalness={metal} roughness={rough}/></mesh>;}
const wheelCache=new Map<number,{tire:BufferGeometry;rim:BufferGeometry}>();
function wheelGeometry(r:number){const found=wheelCache.get(r);if(found)return found;const disc=new CylinderGeometry(r*.58,r*.58,.12,12);disc.rotateX(Math.PI/2);const tire=mergeGeometries([new TorusGeometry(r*.76,r*.24,7,20),disc])!;const parts:BufferGeometry[]=[];for(let i=0;i<5;i++){const spoke=new BoxGeometry(r*.09,r*.58,.16);spoke.translate(0,r*.29,0);spoke.rotateZ(i*Math.PI*2/5);parts.push(spoke);}const hub=new CylinderGeometry(r*.15,r*.15,.18,10);hub.rotateX(Math.PI/2);parts.push(hub);const rim=mergeGeometries(parts)!;parts.forEach(g=>g.dispose());disc.dispose();const result={tire,rim};wheelCache.set(r,result);return result;}
function Wheel({x,z,r,steered,motion,rim,widthScale=1}:{x:number;z:number;r:number;steered:boolean;motion:()=>Motion;rim:string;widthScale?:number}){
 const turn=useRef<Group>(null),spin=useRef<Group>(null),geometry=useMemo(()=>wheelGeometry(r),[r]);
 useFrame((_,dt)=>{const c=motion();if(turn.current)turn.current.rotation.y=steered?c.steer:0;if(spin.current)spin.current.rotation.z-=c.speed*Math.min(dt,.1)/r;});
 const color=rim==='gold'?'#b69a55':rim==='dark'?'#30383e':'#b9c2c6';
 return <group position={[x,r,z]} ref={turn}><group ref={spin} scale={[1,1,widthScale]}><mesh geometry={geometry.tire} castShadow><meshStandardMaterial color="#23272a" roughness={.88}/></mesh><mesh geometry={geometry.rim} castShadow><meshStandardMaterial color={color} metalness={.8} roughness={.24}/></mesh></group></group>;
}
export const VehicleModel=memo(function VehicleModel({model,color,rim='alloy',motion,environment}:{model:string;color:string;rim?:string;motion:()=>Motion;environment:MutableRefObject<LivingRuntime>}){
 const v=VEHICLE_BY_ID[model]||VEHICLE_BY_ID.sedan;
 return v.category==='Motorcycles'?<Motorcycle v={v} color={color} rim={rim} motion={motion} environment={environment}/>:<Automobile v={v} color={color} rim={rim} motion={motion} environment={environment}/>;
});
type ModelProps={v:typeof VEHICLE_BY_ID[string];color:string;rim:string;motion:()=>Motion;environment:MutableRefObject<LivingRuntime>};
function Automobile({v,color,rim,motion,environment}:ModelProps){
 const chassis=useRef<Group>(null),headlamps=useRef<(MeshStandardMaterial|null)[]>([]),tails=useRef<(MeshStandardMaterial|null)[]>([]),signals=useRef<(MeshStandardMaterial|null)[]>([]);
 const long=['van','delivery','bus','ambulance'].includes(v.body),pickup=['pickup','service'].includes(v.body),low=['supercar','hypercar','roadster','gt'].includes(v.body),radius=v.body==='suv'||pickup?.43:long?.42:.37;
 const body=useMemo(()=>loft(v.id+':body',[[-v.length*.5,.3,v.height*.48,v.width*.38],[-v.length*.42,.32,v.height*.6,v.width*.5],[-v.length*.12,.32,v.height*.62,v.width*.5],[v.length*.22,.3,v.height*.56,v.width*.5],[v.length*.44,.28,v.height*.43,v.width*.45],[v.length*.5,.3,v.height*.38,v.width*.36]]),[v]);
 const cabin=useMemo(()=>loft(v.id+':cabin',[[-v.length*(long?.4:pickup?.06:.27),v.height*.55,v.height*.62,v.width*.39],[-v.length*(pickup?0:.17),v.height*.57,v.height*.96,v.width*.38],[v.length*(long?.29:.12),v.height*.56,v.height*(low?.9:1),v.width*.38],[v.length*.3,v.height*.53,v.height*.58,v.width*.4]]),[v,long,pickup,low]);
 useFrame(({clock},dt)=>{const c=motion();if(chassis.current){chassis.current.rotation.z=MathUtils.damp(chassis.current.rotation.z,c.pitch||0,8,dt);chassis.current.rotation.x=MathUtils.damp(chassis.current.rotation.x,c.roll||0,8,dt);chassis.current.position.y=Math.sin(clock.elapsedTime*8)*Math.min(.018,Math.abs(c.speed)*.001);}headlamps.current.forEach(m=>{if(m)m.emissiveIntensity=.08+environment.current.env.night*2;});tails.current.forEach(m=>{if(m)m.emissiveIntensity=c.braking?2:.12+environment.current.env.night*.45;});signals.current.forEach((m,i)=>{if(m)m.emissiveIntensity=c.signal===(i%2?1:-1)&&Math.sin(clock.elapsedTime*10)>0?2.5:.03;});});
 return <group>
  {[-1,1].flatMap(a=>[-1,1].map(s=><Wheel key={`${a}${s}`} x={a*v.wheelbase/2} z={s*(v.width/2-(v.category==='Premium'?.17:.12))} r={radius} steered={a>0} motion={motion} rim={rim} widthScale={v.category==='Premium'?2:1.4}/>))}
  <group ref={chassis}>
   <mesh geometry={body} castShadow receiveShadow><meshPhysicalMaterial color={color} metalness={.48} roughness={.3} clearcoat={.65} clearcoatRoughness={.25}/></mesh>
   {v.body!=='roadster'&&<mesh geometry={cabin} castShadow><meshPhysicalMaterial color="#354e59" metalness={.2} roughness={.13} clearcoat={1}/></mesh>}
   {v.body!=='roadster'&&<Part at={[0,v.height*.98,0]} size={[v.length*(long?.62:pickup?.18:low?.27:.36),.06,v.width*.7]} color={color} metal={.45} rough={.3}/>}
   <Part at={[v.length*.5,.42,0]} size={[.07,.25,v.width*.76]} color="#39434a" metal={.45}/>
   <Part at={[v.length*.505,.63,0]} size={[.02,.22,v.width*.38]} color={v.body==='luxury'?'#aeb8bc':'#19252a'} metal={.7}/>
   {[0,1,2,3].map(i=><Part key={i} at={[v.length*.52,.55+i*.04,0]} size={[.025,.012,v.width*.34]} color="#839297" metal={.8}/>)}
   <Part at={[-v.length*.5,.4,0]} size={[.08,.16,v.width*.75]} color="#354049" metal={.5}/>
   <Part at={[v.length*.52,.36,0]} size={[.015,.075,.28]} color="#dfdfce"/>
   <Part at={[-v.length*.52,.5,0]} size={[.015,.09,.3]} color="#dfdfce"/>
   {[-1,1].map((s,i)=><group key={s}>
    <Part at={[v.length*.12,v.height*.67,s*(v.width/2+.07)]} size={[.24,.11,.16]} color={color} metal={.4}/>
    <Part at={[-.18,v.height*.61,s*v.width*.49]} size={[.18,.035,.025]} color="#c3cbce" metal={.8}/>
    <Part at={[0,v.height*.67,s*v.width*.393]} size={[.05,v.height*.48,.035]} color={color}/>
    <Part at={[-v.length*.12,.38,s*v.width*.5]} size={[v.length*.57,.08,.06]} color="#343a3e"/>
    <mesh position={[v.length*.49,v.height*.46,s*v.width*.31]}><boxGeometry args={[.04,low?.075:.16,v.width*(low?.28:.2)]}/><meshStandardMaterial ref={m=>{headlamps.current[i]=m;}} color="#e7f1e9" emissive="#e1ebd4"/></mesh>
    <mesh position={[-v.length*.485,v.height*.48,s*v.width*.32]}><boxGeometry args={[.055,.13,v.width*.22]}/><meshStandardMaterial ref={m=>{tails.current[i]=m;}} color="#b34843" emissive="#ed4539"/></mesh>
    <mesh position={[v.length*.48,.5,s*v.width*.43]}><boxGeometry args={[.035,.045,.09]}/><meshStandardMaterial ref={m=>{signals.current[i]=m;}} color="#d5a74c" emissive="#ffc65d"/></mesh>
   </group>)}
   {long&&Array.from({length:v.body==='bus'?5:2},(_,j)=>[-1,1].map(s=><Part key={`${j}${s}`} at={[-v.length*.3+j*v.length*(v.body==='bus'?.13:.23),v.height*.76,s*v.width*.394]} size={[.055,v.height*.35,.035]} color={color}/>))}
   {(pickup||v.body==='service')&&<><Part at={[-v.length*.29,v.height*.65,0]} size={[v.length*.32,.05,v.width*.7]} color="#384047"/>{[-1,1].map(s=><Part key={s} at={[-v.length*.28,v.height*.74,s*v.width*.42]} size={[v.length*.35,.32,.08]} color={color}/>)}</>}
   {v.body==='roadster'&&<><Part at={[.65,v.height*.85,0]} size={[.07,.38,v.width*.65]} color="#668391" rough={.13}/>{[-1,1].map(s=><Part key={s} at={[-.3,v.height*.92,s*.4]} size={[.22,.3,.35]} color="#9b684c"/>)}</>}
   {['tuner','supercar','hypercar','track'].includes(v.body)&&<Part at={[-v.length*.37,v.height*.81,0]} size={[.2,.07,v.width*.9]} color="#26323a" metal={.3}/>}
   {['taxi','police','ambulance','service'].includes(v.body)&&<Part at={[0,v.height+ .09,0]} size={[.7,.12,.32]} color={v.body==='taxi'?'#ebc878':v.body==='service'?'#dfa442':'#737eab'} metal={.1}/>}
   {['police','ambulance'].includes(v.body)&&[-1,1].map(s=><Part key={s} at={[0,v.height*.6,s*v.width*.5]} size={[v.length*.6,.16,.025]} color={v.body==='police'?'#334c67':'#b6594d'}/>)}
  </group>
 </group>;
}
function Motorcycle({v,color,rim,motion,environment}:ModelProps){
 const body=useRef<Group>(null),rider=useRef<Group>(null),light=useRef<MeshStandardMaterial>(null),tail=useRef<MeshStandardMaterial>(null);
 const sporty=['sportbike','naked','offroad'].includes(v.body),scooter=v.body==='scooter',cruiser=v.body==='cruiser',r=cruiser?.32:v.body==='offroad'?.4:.34;
 useFrame((_,dt)=>{const c=motion();if(body.current){body.current.rotation.x=MathUtils.damp(body.current.rotation.x,c.lean||0,7,dt);body.current.rotation.z=c.pitch||0;}if(rider.current)rider.current.visible=!!c.driver;if(light.current)light.current.emissiveIntensity=.15+environment.current.env.night*2;if(tail.current)tail.current.emissiveIntensity=c.braking?2.5:.2;});
 return <group ref={body}>
  {[-1,1].map(s=><Wheel key={s} x={s*v.wheelbase/2} z={0} r={r} steered={s>0} motion={motion} rim={rim} widthScale={.85}/>)}
  <Part at={[0,.5,0]} size={[v.wheelbase,.1,.17]} color="#343c40" metal={.7}/>
  <mesh position={[-.07,.58,0]}><cylinderGeometry args={[.23,.23,.32,10]}/><meshStandardMaterial color="#889292" metalness={.8} roughness={.28}/></mesh>
  {[0,1,2].map(i=><Part key={i} at={[-.08,.49+i*.07,0]} size={[.43,.025,.36]} color="#afb4b2" metal={.8}/>)}
  <mesh position={[.15,scooter?.72:.95,0]} scale={[.38,.2,.22]}><sphereGeometry args={[1,10,8]}/><meshPhysicalMaterial color={color} metalness={.45} roughness={.3} clearcoat={.7}/></mesh>
  <Part at={[-.32,.9,0]} size={[scooter?.65:.55,.1,.3]} color="#313238"/>
  <group position={[v.wheelbase/2-.08,.7,0]} rotation={[0,0,cruiser?-.35:-.17]}>{[-1,1].map(s=><mesh key={s} position={[0,0,s*.1]}><cylinderGeometry args={[.035,.035,.7,8]}/><meshStandardMaterial color="#b5b9b7" metalness={.8}/></mesh>)}</group>
  <Part at={[v.wheelbase/2-.18,sporty?1.12:1.28,0]} size={[.08,.05,.68]} color="#aeb8ba" metal={.7}/>
  {[-1,1].map(s=><Part key={s} at={[v.wheelbase/2-.24,1.4,s*.37]} size={[.13,.1,.08]} color="#606f77" metal={.3}/>)}
  <mesh position={[v.wheelbase/2-.03,1.1,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.1,.12,.08,12]}/><meshStandardMaterial ref={light} color="#dee7dc" emissive="#e8ebcd"/></mesh>
  <mesh position={[-v.wheelbase/2,.9,0]}><boxGeometry args={[.05,.07,.22]}/><meshStandardMaterial ref={tail} color="#c35b4f" emissive="#ed4036"/></mesh>
  {(sporty||scooter)&&<mesh position={[.5,.85,0]} scale={[.2,scooter?.5:.3,.28]}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color={color} metalness={.25} roughness={.35}/></mesh>}
  {['touring','cruiser'].includes(v.body)&&[-1,1].map(s=><Part key={s} at={[-.62,.72,s*.33]} size={[.5,.38,.22]} color={color}/>) }
  {v.body==='touring'&&<Part at={[.56,1.4,0]} size={[.06,.38,.38]} color="#8daab3" rough={.15}/>} 
  <group ref={rider} visible={false} position={[-.17,.29,0]} rotation={[0,Math.PI/2,0]} scale={.68}><Character shirt="#ab9565" riding={sporty?'sport':'upright'}/></group>
 </group>;
}
