import { memo, useLayoutEffect, useRef } from 'react';
import { Color, Object3D, type InstancedMesh } from 'three';
import { TREES } from './world';
// Two draw calls for the whole deciduous canopy, with per-instance color variation.
export const CityTrees=memo(function CityTrees(){
  const trunks=useRef<InstancedMesh>(null),leaves=useRef<InstancedMesh>(null);
  useLayoutEffect(()=>{if(!trunks.current||!leaves.current)return;const dummy=new Object3D(),color=new Color();
    TREES.forEach((t,i)=>{const s=.95+i%4*.1;dummy.position.set(t.x,2.05*s,t.z);dummy.scale.set(.21,4.1*s,.21);dummy.updateMatrix();trunks.current!.setMatrixAt(i,dummy.matrix);
      [[0,4.8,0,1.35],[-.75,4.2,-.2,1],[.8,4.5,.3,1.1],[0,5.6,-.2,.85]].forEach(([x,y,z,r],j)=>{dummy.position.set(t.x+x*s,y*s,t.z+z*s);dummy.scale.set(r*s,(i%3===0?1.3:.9)*r*s,r*s);dummy.updateMatrix();leaves.current!.setMatrixAt(i*4+j,dummy.matrix);leaves.current!.setColorAt(i*4+j,color.set(['#496b4e','#7c8955','#597952','#7b925f'][(i+j)%4]));});
    });trunks.current.instanceMatrix.needsUpdate=true;leaves.current.instanceMatrix.needsUpdate=true;if(leaves.current.instanceColor)leaves.current.instanceColor.needsUpdate=true;trunks.current.computeBoundingSphere();leaves.current.computeBoundingSphere();
  },[]);
  return <><instancedMesh ref={trunks} args={[undefined,undefined,TREES.length]} castShadow receiveShadow><cylinderGeometry args={[.8,1,1,7]}/><meshStandardMaterial color="#796246" roughness={1}/></instancedMesh><instancedMesh ref={leaves} args={[undefined,undefined,TREES.length*4]} castShadow receiveShadow><icosahedronGeometry args={[1,1]}/><meshStandardMaterial roughness={1} flatShading/></instancedMesh></>;
});
