import {useRef,type MutableRefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import {Object3D,type InstancedMesh,type MeshBasicMaterial} from 'three';
import type {LivingRuntime} from './LivingCity';
import {groundHeight} from '../../shared/playerPhysics.mjs';
import {blocked} from './world';
export function WeatherDetail({runtime}:{runtime:MutableRefObject<LivingRuntime>}){
 const splashes=useRef<InstancedMesh>(null),material=useRef<MeshBasicMaterial>(null),scratch=useRef(new Object3D()),sample=useRef(0);
 useFrame(({camera},dt)=>{const e=runtime.current.env;if(!splashes.current||!material.current)return;sample.current+=Math.min(dt,.1);material.current.opacity=e.rain*.42;splashes.current.visible=e.rain>.05;const o=scratch.current;
  for(let i=0;i<32;i++){const age=(sample.current+i*.047)%1,x=camera.position.x+Math.sin(i*2.399)*((i*7.31)%15),z=camera.position.z+Math.cos(i*2.399)*((i*5.37)%15);o.position.set(x,groundHeight(x,z)+.014,z);o.rotation.set(-Math.PI/2,0,i);o.scale.setScalar(blocked(x,z,.05)||age>.5?0:age*.75+.01);o.updateMatrix();splashes.current.setMatrixAt(i,o.matrix);}splashes.current.instanceMatrix.needsUpdate=true;
 });
 return <instancedMesh ref={splashes} args={[undefined,undefined,32]} frustumCulled={false}><ringGeometry args={[.8,1,16]}/><meshBasicMaterial ref={material} color="#b7d1cf" transparent depthWrite={false}/></instancedMesh>;
}
