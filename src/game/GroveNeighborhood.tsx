import { GROVE, PALMS } from './world';
import { WorldSign } from './DistrictWorld';

export function GroveNeighborhood() {
  return <>
    {/* A residential loop connects the north and west arterials. */}
    {['vertical', 'horizontal'].map(axis => <group key={axis} position={axis === 'vertical' ? [GROVE.x, -.04, -46] : [-46, -.04, GROVE.z]} rotation={[0, axis === 'vertical' ? 0 : Math.PI / 2, 0]}>
      <mesh receiveShadow><boxGeometry args={[12, .05, 92]} /><meshStandardMaterial color="#c5bead" /></mesh>
      <mesh receiveShadow position={[0, .04, 0]}><boxGeometry args={[8.5, .02, 92]} /><meshStandardMaterial color="#586166" /></mesh>
      {Array.from({ length: 17 }, (_, i) => <mesh key={i} position={[0, .06, -40 + i * 5]}><boxGeometry args={[.12, .015, 2.2]} /><meshBasicMaterial color="#d4c993" /></mesh>)}
    </group>)}
    <group position={[GROVE.x, 0, GROVE.z]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, .015, 0]}><circleGeometry args={[14, 64]} /><meshStandardMaterial color="#c5bead" /></mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, .025, 0]}><circleGeometry args={[12, 64]} /><meshStandardMaterial color="#586166" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .035, 0]}><ringGeometry args={[11.65, 11.78, 64]} /><meshBasicMaterial color="#d8d1b9" /></mesh>
      <group position={[13, 2.5, 8]}><WorldSign text="GROVE STREET" color="#405f49" width={5} /></group>
      <mesh position={[13, 1.1, 8]}><cylinderGeometry args={[.08, .1, 2.2, 6]} /><meshStandardMaterial color="#576354" /></mesh>
    </group>
    {/* California-inspired palms, porches and lawns; an original neighborhood layout. */}
    {PALMS.map(([x,z],i) => <group key={i} position={[x,0,z]}>
      <mesh castShadow position={[0,3.7,0]} rotation={[0,0,.05]}><cylinderGeometry args={[.18,.34,7.4,9]} /><meshStandardMaterial color="#887558" roughness={1} /></mesh>
      {Array.from({length:7},(_,j) => <group key={j} position={[.18,7.3,0]} rotation={[0,j*Math.PI*2/7,0]}>
        <mesh castShadow position={[0,-.2,1.15]} rotation={[.28,0,0]} scale={[.48,.13,1.9]}><octahedronGeometry args={[1,0]} /><meshStandardMaterial color={j%2?'#597647':'#6f8951'} roughness={1} /></mesh>
      </group>)}
    </group>)}
    {/* Roundabout island, continuous curb, dashed circulating lane and yield approaches. */}
    <mesh receiveShadow position={[0,.06,0]}><cylinderGeometry args={[5.5,5.6,.22,64]} /><meshStandardMaterial color="#b3ae9b" /></mesh>
    <mesh receiveShadow position={[0,.18,0]}><cylinderGeometry args={[5.15,5.15,.03,64]} /><meshStandardMaterial color="#7e9866" /></mesh>
    {Array.from({length:24},(_,i) => { const a=i*Math.PI/12; return <mesh key={i} rotation={[-Math.PI/2,0,-a]} position={[Math.sin(a)*9,.015,Math.cos(a)*9]}><planeGeometry args={[1,.12]} /><meshBasicMaterial color="#e8d9a6" /></mesh>; })}
    {[0,1,2,3].map(i => <group key={i} rotation={[0,i*Math.PI/2,0]}>
      <mesh position={[2,.025,14]} rotation={[-Math.PI/2,0,Math.PI]}><ringGeometry args={[.65,.78,3]} /><meshBasicMaterial color="#efe6c9" side={2} /></mesh>
      <group position={[6.3,2.4,21]} rotation={[0,Math.PI,0]}><WorldSign text="YIELD / FOUNTAIN CIR." color="#a05f47" width={4} /></group>
    </group>)}
    <group position={[8,2.8,19]} rotation={[0,Math.PI,0]}><WorldSign text="CIVIC ARRIVALS" color="#63795d" width={4} /></group>
  </>;
}
