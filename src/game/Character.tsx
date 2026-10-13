import {memo,useMemo,useEffect,type RefObject} from 'react';
import {CanvasTexture,SRGBColorSpace,MeshStandardMaterial,MeshBasicMaterial,PlaneGeometry,type Group} from 'three';
import {blockRig} from '../../shared/avatarGeometry.mjs';
type Rig=RefObject<Group|null>;
type Props={shirt:string;hair?:string;pants?:string;skin?:string;gender?:'woman'|'man';style?:number;riding?:'sport'|'upright';bodyRef?:Rig;leftArmRef?:Rig;rightArmRef?:Rig;leftLegRef?:Rig;rightLegRef?:Rig};
const blocks=new MeshStandardMaterial({vertexColors:true,roughness:.85});
let face:CanvasTexture|undefined;
const faceGeometry=new PlaneGeometry(.6,.6);
let faceMaterial:MeshBasicMaterial|undefined;
function faceMap(){
 if(face)return face;const c=document.createElement('canvas');c.width=c.height=128;const p=c.getContext('2d')!;p.fillStyle='#27313a';
 for(const x of [41,87]){p.beginPath();p.ellipse(x,55,5,8,0,0,Math.PI*2);p.fill();}
 p.strokeStyle='#27313a';p.lineWidth=4;p.lineCap='round';p.beginPath();p.moveTo(43,78);p.quadraticCurveTo(64,98,85,78);p.stroke();
 face=new CanvasTexture(c);face.colorSpace=SRGBColorSpace;return face;
}
/** Seven draw calls, shared +Z facing and original joint/foot landmarks. */
export const Character=memo(function Character({shirt,hair,pants,skin,gender='man',style=0,riding,bodyRef,leftArmRef,rightArmRef,leftLegRef,rightLegRef}:Props){
 if(!faceMaterial)faceMaterial=new MeshBasicMaterial({map:faceMap(),transparent:true,depthWrite:false});
 const rig=useMemo(()=>blockRig({shirt,hair,pants,skin,gender,style}),[shirt,hair,pants,skin,gender,style]);
 useEffect(()=>()=>Object.values(rig).forEach(g=>g.dispose()),[rig]);
 return <group name="block-resident" ref={bodyRef} scale={.72} dispose={null}>
  <mesh castShadow geometry={rig.body} material={blocks}/><mesh castShadow geometry={rig.head} material={blocks}/>
  <mesh position={[0,2.44,.287]} geometry={faceGeometry} material={faceMaterial}/>
  {[-1,1].map(side=><group key={side}>
   <group ref={side<0?leftArmRef:rightArmRef} position={[side*.61,1.98,0]} rotation={[riding?-.9:0,0,side*.025]}><mesh castShadow geometry={rig.arm} material={blocks}/></group>
   <group ref={side<0?leftLegRef:rightLegRef} position={[side*.21,1.16,0]} rotation={[riding?-.85:0,0,0]}><mesh castShadow geometry={rig.leg} material={blocks}/></group>
  </group>)}
 </group>;
});
