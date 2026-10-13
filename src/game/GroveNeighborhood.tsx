import {GROVE,PALMS} from './world';
import {WorldSign,StreetBoard} from './DistrictWorld';

// Former suburban Grove Street now reads as a compact Brooklyn court with
// brownstone row homes. This keeps the neighborhood's saved mission coordinates.
export function GroveNeighborhood(){
 return <group name="brooklyn-court">
  <group position={[GROVE.x,0,GROVE.z]}>
   <group position={[14,2.5,8]}><WorldSign text="BROOKLYN COURT" color="#4b675d" width={5.6}/></group>
   <mesh position={[14,1.1,8]}><cylinderGeometry args={[.08,.1,2.2,6]}/><meshStandardMaterial color="#576354"/></mesh>
   {/* A paved NYC-style mini-square inside the retained one-way residential loop.
       It is not a fountain and never blocks the through Broadway intersection. */}
   <mesh position={[0,.055,0]} receiveShadow><cylinderGeometry args={[5.48,5.5,.1,48]}/>
    <meshStandardMaterial color="#8d9290" roughness={.96}/></mesh>
   <mesh position={[0,.115,0]} receiveShadow><cylinderGeometry args={[4.92,4.92,.04,48]}/>
    <meshStandardMaterial color="#9ca5a0" roughness={.92}/></mesh>
   <group position={[0,.25,0]}>
    <mesh position={[0,.48,0]} castShadow><boxGeometry args={[1.55,.94,1.55]}/>
     <meshStandardMaterial color="#5d6261" roughness={.93}/></mesh>
    <mesh position={[0,1.4,0]} castShadow><boxGeometry args={[.34,1.45,.34]}/>
     <meshStandardMaterial color="#ad9b80" metalness={.26} roughness={.66}/></mesh>
    <mesh position={[0,2.15,0]} castShadow><icosahedronGeometry args={[.7,1]}/>
     <meshStandardMaterial color="#aa977c" metalness={.28} roughness={.62}/></mesh>
   </group>
  </group>
  {/* Replace Los Angeles palms with New York-style street trees at the same
      coordinates and collider locations used by the existing world. */}
  {PALMS.map(([x,z],i)=><group key={i} position={[x,0,z]}>
   <mesh castShadow position={[0,2.35,0]}><cylinderGeometry args={[.13,.21,4.7,7]}/>
    <meshStandardMaterial color="#786e60" roughness={.99}/></mesh>
   {[[0,4.7,0],[1,4.3,.4],[-.8,4.35,-.5],[.2,5.45,.2]].map(([dx,y,dz],j)=>
    <mesh key={j} castShadow={false} position={[dx,y,dz]}>
     <icosahedronGeometry args={[1.25+(i+j)%3*.13,1]}/>
     <meshStandardMaterial color={['#648464','#72916c','#7b956d','#597855'][(i+j)%4]} roughness={.93}/>
    </mesh>)}
  </group>)}
  {/* Real road markings remain on the retained neighborhood one-way loop. */}
  {Array.from({length:18},(_,i)=>{const angle=i*Math.PI/9;return <mesh key={i}
    position={[GROVE.x+Math.sin(angle)*9,.012,GROVE.z+Math.cos(angle)*9]}
    rotation={[-Math.PI/2,0,-angle]}>
    <planeGeometry args={[.82,.09]}/><meshBasicMaterial color="#e8dfbb"/>
   </mesh>;})}
  {[0,1,2,3].map(i=><group key={i} position={[GROVE.x,0,GROVE.z]}
   rotation={[0,i*Math.PI/2,0]}>
   <group position={[6.3,0,21]} rotation={[0,Math.PI,0]}>
    <StreetBoard text="ONE WAY" color="#44635b" width={2.1} height={2.2}/>
   </group>
  </group>)}
 </group>;
}
