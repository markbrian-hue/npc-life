import {useLayoutEffect,useRef,type MutableRefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import {Color,Object3D,type Group,type InstancedMesh,type MeshStandardMaterial,type MeshBasicMaterial} from 'three';
import type {LivingRuntime} from './LivingCity';
import {groundHeight} from '../../shared/playerPhysics.mjs';
import {blocked} from './world';
const CLOUDINESS:Record<string,number>={sunny:.1,cloudy:.65,'light-rain':.7,'heavy-rain':.9,thunderstorm:1,fog:.4};
export function WeatherDetail({runtime}:{runtime:MutableRefObject<LivingRuntime>}){
 const clouds=useRef<InstancedMesh>(null),cloudGroup=useRef<Group>(null),cloudMaterial=useRef<MeshStandardMaterial>(null),splashes=useRef<InstancedMesh>(null),splashMaterial=useRef<MeshBasicMaterial>(null),scratch=useRef(new Object3D()),sample=useRef(0);
 useLayoutEffect(()=>{if(!clouds.current)return;const o=new Object3D();for(let i=0;i<48;i++){const cluster=Math.floor(i/3),part=i%3;o.position.set(Math.sin(cluster*2.399)*65+part*3,34+(cluster%4)*2,Math.cos(cluster*2.399)*65);o.scale.set(8+part*2,1.7+part*.3,5+part);o.updateMatrix();clouds.current.setMatrixAt(i,o.matrix);}clouds.current.instanceMatrix.needsUpdate=true;clouds.current.computeBoundingSphere();},[]);
 useFrame(({camera},dt)=>{const e=runtime.current.env,coverage=CLOUDINESS[e.previous]+(CLOUDINESS[e.kind]-CLOUDINESS[e.previous])*e.mix;
  if(cloudGroup.current)cloudGroup.current.position.set(camera.position.x+Math.sin(e.seconds/400)*8,0,camera.position.z);
  if(cloudMaterial.current){cloudMaterial.current.opacity=coverage*.65;cloudMaterial.current.color.set(e.rain>.5?'#78878e':'#d9ded8').multiplyScalar(.65+e.daylight*.35);}
  if(splashes.current&&splashMaterial.current){sample.current+=Math.min(dt,.1);splashMaterial.current.opacity=e.rain*.42;splashes.current.visible=e.rain>.05;const o=scratch.current;
   for(let i=0;i<32;i++){const age=(sample.current+i*.047)%1,x=camera.position.x+Math.sin(i*2.399)*((i*7.31)%15),z=camera.position.z+Math.cos(i*2.399)*((i*5.37)%15);o.position.set(x,groundHeight(x,z)+.014,z);o.rotation.set(-Math.PI/2,0,i);o.scale.setScalar(blocked(x,z,.05)||age>.5?0:age*.75+.01);o.updateMatrix();splashes.current.setMatrixAt(i,o.matrix);}splashes.current.instanceMatrix.needsUpdate=true;
  }
 });
 return <><group ref={cloudGroup}><instancedMesh ref={clouds} args={[undefined,undefined,48]} frustumCulled={false}><icosahedronGeometry args={[1,2]}/><meshStandardMaterial ref={cloudMaterial} color="#d9ded8" roughness={1} transparent depthWrite={false}/></instancedMesh></group><instancedMesh ref={splashes} args={[undefined,undefined,32]} frustumCulled={false}><ringGeometry args={[.8,1,12]}/><meshBasicMaterial ref={splashMaterial} color="#b7d1cf" transparent depthWrite={false}/></instancedMesh></>;
}
