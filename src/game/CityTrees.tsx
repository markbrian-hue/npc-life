import {memo,useLayoutEffect,useMemo,useRef} from 'react';
import {CanvasTexture,SRGBColorSpace,Color,Object3D,Vector3,DoubleSide,type InstancedMesh} from 'three';
import {TREES} from './world';
import {cityMaps} from './cityMaterials';
let canopy:CanvasTexture|undefined;
function leafSpray(){if(canopy)return canopy;const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d')!;
 c.strokeStyle='#777c42';c.lineWidth=2;c.beginPath();c.moveTo(123,235);c.bezierCurveTo(126,165,118,77,145,19);c.stroke();
 for(let i=0;i<18;i++){const side=i%2?1:-1,t=Math.floor(i/2),x=127+side*(10+(8-t)*4),y=218-t*23;c.save();c.translate(x,y);c.rotate(side*(.8+t*.025));
  const grad=c.createLinearGradient(-13,0,14,0);grad.addColorStop(0,'#819457');grad.addColorStop(.5,'#b7bc73');grad.addColorStop(1,'#536d39');c.fillStyle=grad;c.beginPath();c.moveTo(0,18);c.bezierCurveTo(-24,1,-17,-22,0,-30);c.bezierCurveTo(19,-16,20,3,0,18);c.fill();c.strokeStyle='#4a622866';c.lineWidth=.7;c.beginPath();c.moveTo(0,15);c.lineTo(0,-25);c.stroke();c.restore();}
 canopy=new CanvasTexture(canvas);canopy.colorSpace=SRGBColorSpace;canopy.anisotropy=4;return canopy;
}
/** Branches and alpha-cut foliage sprays replace solid polygon canopy balls. */
export const CityTrees=memo(function CityTrees(){
 const branches=useRef<InstancedMesh>(null),leaves=useRef<InstancedMesh>(null),maps=useMemo(()=>cityMaps('bark'),[]),map=useMemo(leafSpray,[]);
 useLayoutEffect(()=>{if(!branches.current||!leaves.current)return;const dummy=new Object3D(),color=new Color(),up=new Vector3(0,1,0),a=new Vector3(),b=new Vector3(),direction=new Vector3();
  TREES.forEach((t,i)=>{const s=.94+i%4*.09;
   for(let j=0;j<9;j++){const angle=j*2.399+i*.7;a.set(t.x,j?2.5*s:0,t.z);b.set(t.x+(j?Math.cos(angle)*(1.1+j%3*.18)*s:.08),j?(3.8+j%3*.4)*s:4.3*s,t.z+(j?Math.sin(angle)*(1.1+j%3*.18)*s:.06));direction.subVectors(b,a);dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,direction.clone().normalize());dummy.scale.set(j?.045:.21,direction.length(),j?.045:.21);dummy.updateMatrix();branches.current!.setMatrixAt(i*9+j,dummy.matrix);}
   for(let j=0;j<84;j++){const angle=j*2.399963+i*.78,v=(j+.5)/84,vertical=1-v*2,radius=Math.sqrt(Math.max(0,1-vertical*vertical))*(j%4===0?.8:1.55)*s;dummy.position.set(t.x+Math.cos(angle)*radius,(4.45+vertical*(i%3===0?1.8:1.3))*s,t.z+Math.sin(angle)*radius);dummy.rotation.set(Math.sin(j*4.7)*1.2,angle,Math.cos(j*3.1)*.8);const size=(1.25+j%4*.11)*s;dummy.scale.set(size,size,1);dummy.updateMatrix();leaves.current!.setMatrixAt(i*84+j,dummy.matrix);leaves.current!.setColorAt(i*84+j,color.set(['#acb287','#94a277','#bec094','#9dad7b'][(i+j)%4]));}
  });branches.current.instanceMatrix.needsUpdate=true;leaves.current.instanceMatrix.needsUpdate=true;if(leaves.current.instanceColor)leaves.current.instanceColor.needsUpdate=true;branches.current.computeBoundingSphere();leaves.current.computeBoundingSphere();
 },[]);
 return <><instancedMesh name="tree-branches" ref={branches} args={[undefined,undefined,TREES.length*9]} castShadow receiveShadow><cylinderGeometry args={[.58,1,1,9]}/><meshStandardMaterial {...maps} roughness={.95} bumpScale={.03}/></instancedMesh><instancedMesh name="tree-foliage" ref={leaves} args={[undefined,undefined,TREES.length*84]} castShadow receiveShadow><planeGeometry args={[1,1]}/><meshLambertMaterial map={map} alphaTest={.45} side={DoubleSide}/></instancedMesh></>;
});
