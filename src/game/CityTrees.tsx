import { memo, useLayoutEffect, useRef } from 'react';
import { Color, Object3D, type InstancedMesh } from 'three';
import { TREES } from './world';
// Two draw calls for the whole deciduous canopy, with per-instance color variation.
export const CityTrees=memo(function CityTrees(){
  const trunks=useRef<InstancedMesh>(null),leaves=useRef<InstancedMesh>(null);
  useLayoutEffect(()=>{if(!trunks.current||!leaves.current)return;const dummy=new Object3D(),color=new Color();
    TREES.forEach((t,i)=>{const s=.9+i%3*.08;dummy.position.set(t.x,1.5,t.z);dummy.scale.set(.27,3,.27);dummy.updateMatrix();trunks.current!.setMatrixAt(i,dummy.matrix);
      [[0,3.4,0,1.5],[-.75,3.1,-.2,.95],[.8,3.2,.3,1],[0,4.1,-.2,.85]].forEach(([x,y,z,r],j)=>{dummy.position.set(t.x+x*s,y*s,t.z+z*s);dummy.scale.setScalar(r*s);dummy.updateMatrix();leaves.current!.setMatrixAt(i*4+j,dummy.matrix);leaves.current!.setColorAt(i*4+j,color.set(['#5e7e52','#7e975e','#607c54','#899e69'][(i+j)%4]));});
    });trunks.current.instanceMatrix.needsUpdate=true;leaves.current.instanceMatrix.needsUpdate=true;if(leaves.current.instanceColor)leaves.current.instanceColor.needsUpdate=true;trunks.current.computeBoundingSphere();leaves.current.computeBoundingSphere();
  },[]);
  return <><instancedMesh ref={trunks} args={[undefined,undefined,TREES.length]} castShadow receiveShadow><cylinderGeometry args={[.8,1,1,7]}/><meshStandardMaterial color="#796246" roughness={1}/></instancedMesh><instancedMesh ref={leaves} args={[undefined,undefined,TREES.length*4]} castShadow receiveShadow><icosahedronGeometry args={[1,1]}/><meshStandardMaterial roughness={1} flatShading/></instancedMesh></>;
});
