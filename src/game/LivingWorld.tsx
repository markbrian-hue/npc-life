import {WeatherDetail} from './WeatherDetail';
import {useEffect,useMemo,useRef,type MutableRefObject} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Color,Fog,Object3D,BufferAttribute,BufferGeometry,MeshStandardMaterial,MathUtils,type DirectionalLight,type HemisphereLight,type LineBasicMaterial,type Mesh} from 'three';
import {BUSINESSES,kioskPosition,isOpen} from '../../shared/livingCity.mjs';
import type {LivingRuntime} from './LivingCity';
import {WorldSign} from './DistrictWorld';
import {Character} from './Character';
import {LAMP_POSTS} from './world';
import {playGameSound,updateWeatherAudio} from './gameAudio';

const PALETTES:Record<string,string>={sunny:'#b9d9e5',cloudy:'#a9b6bb','light-rain':'#899da9','heavy-rain':'#617785',thunderstorm:'#4d626f',fog:'#acb9b5'};
export function LivingEnvironment({runtime,quality}:{runtime:MutableRefObject<LivingRuntime>;quality:string}) {
 const {scene}=useThree(),sun=useRef<DirectionalLight>(null),hemi=useRef<HemisphereLight>(null);
 const player=useRef({x:0,z:0}),target=useMemo(()=>new Object3D(),[]);
 const reducedMotion=useRef(false);
 const sky=useMemo(()=>new Color(),[]),weatherColor=useMemo(()=>new Color(),[]),nightColor=useMemo(()=>new Color('#26374b'),[]);
 const materials=useRef<{material:MeshStandardMaterial;kind:string;base:Color}[]>([]);
 const lightning=useRef(0),nextThunder=useRef(25),audioTick=useRef(0),stormAge=useRef(0);
 useEffect(()=>{
  reducedMotion.current=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const background=scene.background,fog=scene.fog;scene.background=new Color();scene.fog=new Fog('#aabdc9',85,190);
  scene.traverse(obj=>{const mesh=obj as Mesh;if(mesh.material instanceof MeshStandardMaterial&&mesh.userData.environment){materials.current.push({material:mesh.material,kind:mesh.userData.environment,base:mesh.material.color.clone()});}});
  const move=(e:Event)=>{player.current=(e as CustomEvent).detail;};window.addEventListener('npc-life:position',move);
  return()=>{scene.background=background;scene.fog=fog;materials.current=[];window.removeEventListener('npc-life:position',move);updateWeatherAudio(0,0);};
 },[scene]);
 useFrame((_,raw)=>{
  const dt=Math.min(raw,.1),e=runtime.current.env,n=e.night;
  sky.set(PALETTES[e.previous]);weatherColor.set(PALETTES[e.kind]);sky.lerp(weatherColor,e.mix).lerp(nightColor,n*.82);
  const reduced=reducedMotion.current||document.documentElement.classList.contains('npc-reduce-motion');
  if(e.kind==='thunderstorm'&&e.mix>.5){stormAge.current+=dt;if(stormAge.current>nextThunder.current){stormAge.current=0;nextThunder.current=28+(e.cycle%4)*9;if(!reduced)lightning.current=.35;playGameSound('thunder');}}else stormAge.current=0;
  lightning.current=Math.max(0,lightning.current-dt);const flash=lightning.current>0?.25:0;
  (scene.background as Color)?.copy(sky);const fog=scene.fog as Fog;fog.color.copy(sky);
  const visibility=(k:string)=>k==='fog'?65:k==='heavy-rain'||k==='thunderstorm'?115:190;
  fog.far=visibility(e.previous)+(visibility(e.kind)-visibility(e.previous))*e.mix;fog.near=fog.far*.38;
  const angle=(e.minute-360)/1440*Math.PI*2,x=Math.round(player.current.x*16)/16,z=Math.round(player.current.z*16)/16;
  target.position.set(x,0,z);
  if(sun.current){sun.current.position.set(x+Math.cos(angle)*40,Math.max(15,Math.sin(angle)*50),z+18);sun.current.intensity=(.25+e.daylight*2.05)*(1-e.rain*.55)+flash*5;sun.current.color.set(e.daylight<.35?'#ffc897':'#ffecd0');}
  if(hemi.current)hemi.current.intensity=.65+e.daylight*.85+flash;
  for(const {material,kind,base} of materials.current){if(kind==='window'||kind==='lamp'){material.emissive.set('#fbd893');material.emissiveIntensity=.08+n*(kind==='lamp'?1.5:.55);}if(kind==='road'){material.roughness=.98-e.rain*.65;material.color.copy(base).multiplyScalar(1-e.rain*.18);}}
  audioTick.current+=dt;if(audioTick.current>1){audioTick.current=0;updateWeatherAudio(document.hidden?0:e.rain,n);}
 });
 return <><primitive object={target}/><hemisphereLight ref={hemi} args={['#ffefd0','#657e73',1.5]}/><ambientLight intensity={.25}/>
  <directionalLight ref={sun} target={target} castShadow={quality!=='low'} position={[25,40,18]} intensity={2.3} shadow-mapSize={[1024,1024]} shadow-camera-left={-32} shadow-camera-right={32} shadow-camera-top={32} shadow-camera-bottom={-32} shadow-bias={-.0002}/>
  <Rain runtime={runtime} quality={quality}/>
  <WeatherDetail runtime={runtime}/>
  <NightPools runtime={runtime}/>
  {[[-12,25],[38,7],[60,5],[-57,-10],[24,58]].map(([x,z],i)=><Puddle key={i} x={x} z={z} runtime={runtime}/>)}
 </>;
}
function Rain({runtime,quality}:{runtime:MutableRefObject<LivingRuntime>;quality:string}) {
 const count=quality==='low'?100:quality==='high'?600:300;
 const geometry=useMemo(()=>{const g=new BufferGeometry(),data=new Float32Array(count*6);for(let i=0;i<count;i++){const j=i*6;data[j]=(i*7.123%50)-25;data[j+1]=i*3.31%22;data[j+2]=(i*13.17%50)-25;data[j+3]=data[j]+.15;data[j+4]=data[j+1]-.7;data[j+5]=data[j+2];}g.setAttribute('position',new BufferAttribute(data,3));return g;},[count]);
 const material=useRef<LineBasicMaterial>(null),root=useRef<import('three').LineSegments>(null);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 useFrame(({camera},raw)=>{if(!root.current||!material.current)return;const e=runtime.current.env;root.current.visible=e.rain>.01;material.current.opacity=e.rain*.55;if(e.rain<.01)return;root.current.position.set(camera.position.x,0,camera.position.z);const data=geometry.attributes.position.array as Float32Array;for(let i=0;i<count;i++){const j=i*6;data[j+1]-=Math.min(raw,.1)*(12+e.rain*8);if(data[j+1]<0)data[j+1]+=22;data[j+4]=data[j+1]-.7;}geometry.attributes.position.needsUpdate=true;});
 return <lineSegments ref={root} geometry={geometry} frustumCulled={false}><lineBasicMaterial ref={material} color="#c6e1f2" transparent depthWrite={false}/></lineSegments>;
}
function Puddle({x,z,runtime}:{x:number;z:number;runtime:MutableRefObject<LivingRuntime>}) {
 const root=useRef<Mesh>(null);useFrame(()=>{if(root.current){root.current.visible=runtime.current.env.rain>.02;(root.current.material as import('three').MeshStandardMaterial).opacity=runtime.current.env.rain*.5;}});
 return <mesh ref={root} position={[x,.016,z]} rotation={[-Math.PI/2,0,0]} scale={[1.7,.7,1]}><circleGeometry args={[1,16]}/><meshStandardMaterial color="#a9c5cc" metalness={.35} roughness={.2} transparent depthWrite={false}/></mesh>;
}
function NightPools({runtime}:{runtime:MutableRefObject<LivingRuntime>}){
 const root=useRef<import('three').Group>(null);useFrame(()=>{root.current?.traverse(obj=>{const m=obj as Mesh;if(m.material)(m.material as import('three').MeshBasicMaterial).opacity=runtime.current.env.night*.12;});});
 return <group ref={root}>{LAMP_POSTS.map((p,i)=><mesh key={i} position={[p.x,.02,p.z]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[3.2,16]}/><meshBasicMaterial color="#ffe7a4" transparent depthWrite={false}/></mesh>)}</group>;
}
function Business({shop,runtime}:{shop:typeof BUSINESSES[number];runtime:MutableRefObject<LivingRuntime>}) {
 const position=kioskPosition(shop),lamp=useRef<MeshStandardMaterial>(null);
 useFrame(()=>{if(lamp.current)lamp.current.emissiveIntensity=isOpen(shop,runtime.current.env.minute)?.2+runtime.current.env.night*.9:.04;});
 return <group position={[position.x,0,position.z]} rotation={[0,shop.z<0?Math.PI:0,0]}>
  <mesh castShadow position={[0,1,0]}><boxGeometry args={[3.8,2,1.6]}/><meshStandardMaterial color={shop.color}/></mesh>
  <mesh position={[0,1.25,-.84]}><boxGeometry args={[2.9,.65,.1]}/><meshStandardMaterial ref={lamp} color="#e6d6af" emissive="#f5c778"/></mesh>
  <mesh castShadow position={[0,4.2,-.2]}><boxGeometry args={[5,.18,5.8]}/><meshStandardMaterial color={shop.color}/></mesh>
  {[-2.4,2.4].map(x=><mesh key={x} position={[x,2.1,.7]}><boxGeometry args={[.1,4.2,.1]}/><meshStandardMaterial color={shop.color}/></mesh>)}
  <mesh position={[0,.8,-1.1]}><boxGeometry args={[3.8,.16,.6]}/><meshStandardMaterial color="#eee0b9"/></mesh>
  <group position={[0,4.65,-.5]} rotation={[0,Math.PI,0]}><WorldSign text={shop.name.toUpperCase()} color={shop.color} width={7}/></group>
  <group position={[2.2,0,0]}><Character shirt={shop.color} style={2}/></group>
  <group position={[0,2.1,-1.7]} rotation={[0,Math.PI,0]}><WorldSign text="G / ORDER HERE" width={2.8}/></group>
 </group>;
}
export function FoodBusinesses({runtime}:{runtime:MutableRefObject<LivingRuntime>}){return <>{BUSINESSES.map(shop=><Business key={shop.id} shop={shop} runtime={runtime}/>)}</>;}
