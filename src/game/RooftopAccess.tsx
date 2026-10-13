import {memo,useLayoutEffect,useMemo,useRef} from 'react';
import {Object3D,type InstancedMesh} from 'three';
import {ROOFTOP_LADDERS} from '../../shared/verticalTraversal.mjs';
import {WorldSign} from './DistrictWorld';

type Piece={x:number;y:number;z:number;w:number;h:number;d:number;rotation:number};
/** Metal fire-escape ladders are aligned to the exact roof traversal anchors. */
export const RooftopAccess=memo(function RooftopAccess(){
 const pieces=useMemo(()=>{
  const result:Piece[]=[];
  for(const ladder of ROOFTOP_LADDERS){
   const yaw=ladder.rotation,c=Math.cos(yaw),s=Math.sin(yaw),height=ladder.roof;
   // Offset rails towards the facade: the climb anchor remains clear of wall collision.
   const centerX=ladder.x-s*.53,centerZ=ladder.z-c*.53;
   for(const offset of [-.34,.34]){
    result.push({x:centerX+c*offset,y:height/2,z:centerZ-s*offset,w:.07,h:height,d:.08,rotation:yaw});
   }
   for(let y=.4;y<height;y+=.62){
    result.push({x:centerX,y,z:centerZ,w:.74,h:.065,d:.11,rotation:yaw});
   }
   // A small physical roof landing lip marks the transition onto the roof.
   result.push({x:ladder.landing.x,y:height+.12,z:ladder.landing.z,w:1,h:.18,d:.75,rotation:yaw});
  }
  return result;
 },[]);
 const mesh=useRef<InstancedMesh>(null);
 useLayoutEffect(()=>{
  const instanced=mesh.current;if(!instanced)return;
  const object=new Object3D();
  pieces.forEach((p,i)=>{object.position.set(p.x,p.y,p.z);object.rotation.set(0,p.rotation,0);object.scale.set(p.w,p.h,p.d);object.updateMatrix();instanced.setMatrixAt(i,object.matrix);});
  instanced.instanceMatrix.needsUpdate=true;instanced.computeBoundingSphere();
 },[pieces]);
 return <>
  <instancedMesh ref={mesh} args={[undefined,undefined,pieces.length]} castShadow={false} receiveShadow>
   <boxGeometry args={[1,1,1]}/>
   <meshStandardMaterial color="#697d83" metalness={.72} roughness={.39}/>
  </instancedMesh>
  {ROOFTOP_LADDERS.slice(0,7).map(l=>(
   <group key={l.id} position={[l.x,1.85,l.z]} rotation={[0,l.rotation,0]}>
    <WorldSign text="E / CLIMB TO ROOF" width={2.6} color="#476f70"/>
   </group>
  ))}
 </>;
});
