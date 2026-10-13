import {memo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {MeshStandardMaterial,type Group} from 'three';
import {BUILDINGS} from './world';
import {WorldSign} from './DistrictWorld';

// New York-inspired signage is authored around *existing* building faces.
// No false ground-level walls or uncollidable pedestrian obstacles are introduced.
const TOWER_SIGNS=['NEON CROSSING','THE CITY NEVER LOGS OFF','NPC / AFTER DARK','METRO 24/7','THE DAILY GRIND'];
const ROW_SIGNS=['BROWNSTONE ROW','BOROUGH MARKET','EASTBANK DELI','LATE NIGHT LAUNDROMAT'];

function SkylineBillboard({building,index}:{building:typeof BUILDINGS[number];index:number}){
 const root=useRef<Group>(null),screen=useRef<MeshStandardMaterial>(null);
 const width=Math.max(3,Math.min(8,building.w-.85)),height=Math.min(building.h-3,Math.max(7,building.h*.56));
 const palette=['#4a8a9a','#a35581','#a17f4b','#4b7980','#7e678f'],glow=['#8eeaff','#ff91c4','#ffe3a7','#a6f2d5','#e9b7ff'];
 useFrame(({camera,clock})=>{
  if(root.current)root.current.visible=Math.hypot(camera.position.x-building.x,camera.position.z-building.z)<145;
  if(screen.current)screen.current.emissiveIntensity=1.2+.28*Math.sin(clock.elapsedTime*1.4+index);
 });
 return <group name={'borough-billboard:'+index} ref={root} position={[building.x,0,building.z]} rotation={[0,building.rotation||0,0]}>
   <mesh position={[0,height,building.d/2+.14]} castShadow>
    <boxGeometry args={[width+.4,3.8,.29]}/>
    <meshStandardMaterial color="#1c2533" metalness={.55} roughness={.4}/>
   </mesh>
   <mesh position={[0,height,building.d/2+.315]} userData={{cityScreen:true}}>
    <planeGeometry args={[width,3.46]}/>
    <meshStandardMaterial ref={screen} color={palette[index%palette.length]} emissive={glow[index%glow.length]} roughness={.38} emissiveIntensity={1.3}/>
   </mesh>
   <group position={[0,height,building.d/2+.36]}>
    <WorldSign text={TOWER_SIGNS[index%TOWER_SIGNS.length]} width={width*.94} color="#182b3a"/>
   </group>
   {[-1,1].map(side=><mesh key={side} position={[side*(width/2+.14),height,building.d/2+.36]}>
    <boxGeometry args={[.065,3.65,.065]}/>
    <meshBasicMaterial color={glow[index%glow.length]}/>
   </mesh>)}
  </group>;
}
function BoroughBanner({building,index}:{building:typeof BUILDINGS[number];index:number}){
 const y=Math.min(building.h-1.3,3.6);
 return <group name={'borough-storefront:'+index} position={[building.x,0,building.z]} rotation={[0,building.rotation||0,0]}>
  <mesh position={[0,y,building.d/2+.21]} castShadow>
   <boxGeometry args={[Math.max(2,building.w*.78),.54,.3]}/>
   <meshStandardMaterial color={['#654b42','#4b615d','#514f5f'][index%3]} metalness={.17} roughness={.62}/>
  </mesh>
  <group position={[0,y,building.d/2+.405]}>
   <WorldSign text={ROW_SIGNS[index%ROW_SIGNS.length]} width={Math.min(4.5,building.w*.73)} color="#70564c"/>
  </group>
  {[-1,1].map(side=><mesh key={side} position={[side*(building.w/2-.32),1.7,building.d/2+.16]}>
   <boxGeometry args={[.14,3.3,.18]}/>
   <meshStandardMaterial color="#5d514a" roughness={.82}/>
  </mesh>)}
 </group>;
}
const towers=BUILDINGS.filter(b=>b.kind==='tower'&&b.h>=24).slice(0,7);
const rows=BUILDINGS.filter(b=>b.kind==='brownstone').slice(0,9);
export const BoroughStreets=memo(function BoroughStreets(){
 return <group name="nyc-borough-streetscape">
  {towers.map((building,i)=><SkylineBillboard key={'tower-'+i} building={building} index={i}/>)}
  {rows.map((building,i)=><BoroughBanner key={'row-'+i} building={building} index={i}/>)}
 </group>;
});
