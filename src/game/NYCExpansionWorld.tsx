import {memo,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {type Group} from 'three';
import {BUILDINGS,NYC_SIGN_POSTS} from './world';
import {WorldSign} from './DistrictWorld';
import {NYC_PUBLIC_SPACES,NYC_RIVER} from '../../shared/nycExpansion.mjs';

// Visually playable borough blocks: built on the same shared meter coordinates as
// the collision footprints and minimap. Materials/meshes are first-party geometry.
const marqueeBuildings=BUILDINGS.filter(b=>b.z<-214&&b.kind==='tower').filter((_,i)=>i%7===1).slice(0,11);
const marqueeNames=['NPC SQUARE','THE CITY NEVER LOGS OFF','24 HOUR BODEGA','SUBWAY THIS WAY','LIVE FROM NEW YORK','NO PARKING ANYTIME','NIGHT SHIFT','THE NPC TIMES','DOWNTOWN','CITY LIGHTS','THE 42ND'];
const neon=['#77d9ea','#ef7ab1','#edd079','#97f0b6','#ba91e8'];
function Block({x=0,y=0,z=0,w=1,h=1,d=1,color='#fafafa',glow=false}:{
 x?:number;y?:number;z?:number;w?:number;h?:number;d?:number;color?:string;glow?:boolean
}){
 return <mesh position={[x,y,z]} castShadow={h>.4} receiveShadow>
  <boxGeometry args={[w,h,d]}/>
  <meshStandardMaterial color={color} emissive={glow?color:'#000000'} emissiveIntensity={glow?1.8:0}
   metalness={glow?.38:.08} roughness={glow?.28:.86}/>
 </mesh>;
}
function IlluminatedFacades(){
 const root=useRef<Group>(null);
 useFrame(({camera})=>{
  if(root.current)root.current.visible=camera.position.z<-110;
 });
 return <group name="nyc-expanded-neon-facades" ref={root}>
  {marqueeBuildings.map((b,i)=><group key={i} name={'nyc-marquee:'+i}
   position={[b.x,0,b.z]} rotation={[0,b.rotation||0,0]}>
    <Block x={0} y={Math.max(10,b.h*.52)} z={b.d/2+.23} w={Math.min(8.8,b.w-.8)} h={3.9} d={.27} color="#202636"/>
    <Block x={0} y={Math.max(10,b.h*.52)} z={b.d/2+.41} w={Math.min(8.4,b.w-1)} h={3.48} d={.07} color={['#3f6378','#68486d','#615b45'][i%3]} glow/>
    <group position={[0,Math.max(10,b.h*.52),b.d/2+.49]}>
     <WorldSign text={marqueeNames[i%marqueeNames.length]} width={Math.min(7.8,b.w-.9)} color="#172d40"/>
    </group>
    {[-1,1].map(side=><Block key={side} x={side*(Math.min(8.8,b.w-.8)/2-.12)}
      y={Math.max(10,b.h*.52)} z={b.d/2+.49} w={.10} h={3.55} d={.11}
      color={neon[i%neon.length]} glow/>)}
   </group>)}
 </group>;
}
function PublicSpace({place}:{place:typeof NYC_PUBLIC_SPACES[number]}){
 const isPark=place.kind==='park',shore=place.kind==='waterfront';
 return <group name={'nyc-public-space:'+place.id} position={[place.x,0,place.z]}>
   <mesh rotation={[-Math.PI/2,0,0]} position={[0,.009,0]} receiveShadow>
    <planeGeometry args={[place.w,place.d]}/>
    <meshStandardMaterial color={place.color} roughness={.93}/>
   </mesh>
   {isPark?<>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.025,0]} receiveShadow>
     <planeGeometry args={[2.1,place.d-2]}/><meshStandardMaterial color="#ccbca4" roughness={1}/>
    </mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.027,0]} receiveShadow>
     <planeGeometry args={[place.w-2,1.7]}/><meshStandardMaterial color="#c8baa4"/>
    </mesh>
    {[-1,1].map(side=><group key={side} position={[side*(place.w/2-1.05),0,0]}>
     <Block y={.3} w={.46} h={.62} d={place.d-2} color="#697c65"/>
    </group>)}
   </>:shore?<>
    {[-1,1].map(side=><Block key={side} x={side*(place.w/2-.6)} y={.05} w={.14} h={.12} d={place.d} color="#ddd5c6"/>)}
   </>:<>
    {Array.from({length:7},(_,i)=><Block key={i} x={(i-3)*3.4} y={.025} z={0} w={.42} h={.052} d={place.d*.8} color={i%2?'#d8c9b0':'#a8a9ac'}/>)}
    {[-1,1].map(side=><Block key={side} x={side*(place.w/2-1.2)} y={.22} z={0} w={.55} h={.44} d={place.d*.6} color="#657a7c"/>)}
   </>}
  </group>;
}
function Waterfront(){
 return <group name="nyc-east-river" position={[NYC_RIVER.x,0,NYC_RIVER.z]}>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.037,0]} receiveShadow>
   <planeGeometry args={[NYC_RIVER.w,NYC_RIVER.d]}/>
   <meshStandardMaterial color="#4c8693" metalness={.25} roughness={.28}/>
  </mesh>
  {/* The riverside guardrail is in the blocked waterfront strip, not on the footpath. */}
  <group position={[-NYC_RIVER.w/2-.58,0,0]}>
   {[-1,1].map(side=><Block key={side} y={side===1?1.05:.52} w={.07} h={.08} d={NYC_RIVER.d-8} color="#a1aaa5"/>)}
   {Array.from({length:26},(_,i)=><Block key={i}
    y={.64} z={-NYC_RIVER.d/2+5+i*(NYC_RIVER.d-10)/25}
    w={.1} h={1.24} d={.1} color="#788b8a"/>)}
  </group>
 </group>;
}
const streetSigns=NYC_SIGN_POSTS;
export const NYCExpansionWorld=memo(function NYCExpansionWorld(){
 const paving=useMemo(()=>({x:61.5,z:-271.5,w:434,d:135}),[]);
 return <group name="nyc-expanded-world">
  {/* Grey urban block ground under actual asphalt and sidewalks; no green voids. */}
  <mesh name="nyc-lower-manhattan-ground" rotation={[-Math.PI/2,0,0]} position={[20,-.06,-32]} receiveShadow>
   <planeGeometry args={[165,150]}/><meshStandardMaterial color="#838b88" roughness={.97}/>
  </mesh>
  <mesh name="fountain-green-island" rotation={[-Math.PI/2,0,0]} position={[0,-.024,0]} receiveShadow>
   <circleGeometry args={[5.72,56]}/><meshStandardMaterial color="#7f9a70" roughness={1}/>
  </mesh>
  <mesh name="nyc-urban-ground" rotation={[-Math.PI/2,0,0]} position={[paving.x,-.06,paving.z]} receiveShadow>
   <planeGeometry args={[paving.w,paving.d]}/>
   <meshStandardMaterial color="#777f7d" roughness={1}/>
  </mesh>
  {NYC_PUBLIC_SPACES.map(place=><PublicSpace key={place.id} place={place}/>)}
  <Waterfront/>
  <IlluminatedFacades/>
  {streetSigns.map(s=><group key={s.id} name={'nyc-street-sign:'+s.id} position={[s.x,0,s.z]}>
    <Block y={2.1} w={.105} h={4.2} d={.105} color="#697774"/>
    <group position={[0,4.35,0]}><WorldSign text={s.name} width={5.7} color="#396c69"/></group>
   </group>)}
 </group>;
});
