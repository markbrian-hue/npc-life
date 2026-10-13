import {memo,useLayoutEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {CanvasTexture,SRGBColorSpace,Color,Object3D,Vector3,DoubleSide,type Group,type InstancedMesh} from 'three';
import {TREES} from './world';
import {cityMaps} from './cityMaterials';
let canopy:CanvasTexture|undefined;
function leafSpray(){if(canopy)return canopy;const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d')!;
 c.strokeStyle='#777c42';c.lineWidth=2;c.beginPath();c.moveTo(123,235);c.bezierCurveTo(126,165,118,77,145,19);c.stroke();
 for(let i=0;i<18;i++){const side=i%2?1:-1,t=Math.floor(i/2),x=127+side*(10+(8-t)*4),y=218-t*23;c.save();c.translate(x,y);c.rotate(side*(.8+t*.025));
  const grad=c.createLinearGradient(-13,0,14,0);grad.addColorStop(0,'#819457');grad.addColorStop(.5,'#b7bc73');grad.addColorStop(1,'#536d39');c.fillStyle=grad;c.beginPath();c.moveTo(0,18);c.bezierCurveTo(-24,1,-17,-22,0,-30);c.bezierCurveTo(19,-16,20,3,0,18);c.fill();c.strokeStyle='#4a622866';c.lineWidth=.7;c.beginPath();c.moveTo(0,15);c.lineTo(0,-25);c.stroke();c.restore();}
 canopy=new CanvasTexture(canvas);canopy.colorSpace=SRGBColorSpace;canopy.anisotropy=4;return canopy;
}
/** Spatial batches restore frustum culling; only nearby trees use alpha foliage. */
const chunks=Object.values(TREES.reduce<Record<string,typeof TREES>>((all,t)=>{const key=`${Math.floor(t.x/48)},${Math.floor(t.z/48)}`;(all[key]??=[]).push(t);return all;},{}));
export const CityTrees=memo(function CityTrees({quality='medium'}:{quality?:string}){return <>{chunks.map((trees,i)=><TreeChunk key={i} trees={trees} quality={quality}/>)}</>;});
function TreeChunk({trees,quality}:{trees:typeof TREES;quality:string}){
 const root=useRef<Group>(null),branches=useRef<InstancedMesh>(null),leaves=useRef<InstancedMesh>(null),distant=useRef<InstancedMesh>(null),maps=useMemo(()=>cityMaps('bark'),[]),map=useMemo(leafSpray,[]);
 const count=quality==='high'?40:quality==='low'?16:28,cx=trees.reduce((n,t)=>n+t.x,0)/trees.length,cz=trees.reduce((n,t)=>n+t.z,0)/trees.length;
 useFrame(({camera})=>{const d=Math.hypot(camera.position.x-cx,camera.position.z-cz),near=d<(quality==='low'?38:65);if(root.current)root.current.visible=d<190;if(leaves.current)leaves.current.visible=near;if(distant.current)distant.current.visible=!near;});
 useLayoutEffect(()=>{if(!branches.current||!leaves.current||!distant.current)return;const dummy=new Object3D(),color=new Color(),up=new Vector3(0,1,0),a=new Vector3(),b=new Vector3(),direction=new Vector3();
  trees.forEach((t,i)=>{const s=.94+i%4*.09;
   for(let j=0;j<5;j++){const angle=j*2.399+i*.7;a.set(t.x,j?2.5*s:0,t.z);b.set(t.x+(j?Math.cos(angle)*1.3*s:.08),j?(3.8+j%3*.4)*s:4.3*s,t.z+(j?Math.sin(angle)*1.3*s:.06));direction.subVectors(b,a);dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,direction.clone().normalize());dummy.scale.set(j?.045:.21,direction.length(),j?.045:.21);dummy.updateMatrix();branches.current!.setMatrixAt(i*5+j,dummy.matrix);}
   for(let j=0;j<count;j++){const angle=j*2.399963+i*.78,v=(j+.5)/count,vertical=1-v*2,radius=Math.sqrt(Math.max(0,1-vertical*vertical))*1.45*s;dummy.position.set(t.x+Math.cos(angle)*radius,(4.45+vertical*1.3)*s,t.z+Math.sin(angle)*radius);dummy.rotation.set(Math.sin(j*4.7)*1.2,angle,Math.cos(j*3.1)*.8);const size=(1.8+j%4*.11)*s;dummy.scale.set(size,size,1);dummy.updateMatrix();leaves.current!.setMatrixAt(i*count+j,dummy.matrix);leaves.current!.setColorAt(i*count+j,color.set(['#acb287','#94a277','#bec094','#9dad7b'][(i+j)%4]));}
   for(let j=0;j<3;j++){dummy.position.set(t.x+Math.sin(j*2.1)*.55,4.3*s+j*.45,t.z+Math.cos(j*2.1)*.55);dummy.rotation.set(0,j,0);dummy.scale.set(1.35*s,1.3*s,1.35*s);dummy.updateMatrix();distant.current!.setMatrixAt(i*3+j,dummy.matrix);distant.current!.setColorAt(i*3+j,color.set(['#657d49','#7f935c','#8b9c67'][j]));}
  });for(const mesh of [branches.current,leaves.current,distant.current]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();}
 },[trees,count]);
 return <group ref={root}><instancedMesh name="tree-branches" ref={branches} args={[undefined,undefined,trees.length*5]} castShadow receiveShadow><cylinderGeometry args={[.58,1,1,6]}/><meshStandardMaterial {...maps} roughness={.95} bumpScale={.03}/></instancedMesh><instancedMesh name="tree-foliage" ref={leaves} args={[undefined,undefined,trees.length*count]} receiveShadow><planeGeometry args={[1,1]}/><meshLambertMaterial map={map} alphaTest={.45} side={DoubleSide}/></instancedMesh><instancedMesh name="tree-canopy-distant" ref={distant} args={[undefined,undefined,trees.length*3]}><icosahedronGeometry args={[1,1]}/><meshLambertMaterial/></instancedMesh></group>;
}
