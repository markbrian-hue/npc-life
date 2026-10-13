import {memo,useLayoutEffect,useMemo,useRef} from 'react';
import {Color,Object3D,type InstancedMesh} from 'three';
import {CITY_SIGNAL_POSTS} from './world';
import {WorldSign} from './DistrictWorld';

type Piece={x:number;y:number;z:number;w:number;h:number;d:number;rotation?:number;color?:string};
function Batch({name,pieces,color,emissive}:{name:string;pieces:Piece[];color:string;emissive?:string}){
 const mesh=useRef<InstancedMesh>(null);
 useLayoutEffect(()=>{
  const instance=mesh.current;
  if(!instance)return;
  const dummy=new Object3D(),tint=new Color();
  for(let i=0;i<pieces.length;i++){
   const p=pieces[i];dummy.position.set(p.x,p.y,p.z);
   dummy.rotation.set(0,p.rotation||0,0);dummy.scale.set(p.w,p.h,p.d);
   dummy.updateMatrix();instance.setMatrixAt(i,dummy.matrix);
   if(p.color)instance.setColorAt(i,tint.set(p.color));
  }
  instance.instanceMatrix.needsUpdate=true;
  if(instance.instanceColor)instance.instanceColor.needsUpdate=true;
  instance.computeBoundingSphere();
 },[pieces]);
 if(!pieces.length)return null;
 return <instancedMesh name={name} ref={mesh} args={[undefined,undefined,pieces.length]} castShadow={false} receiveShadow>
  <boxGeometry args={[1,1,1]}/>
  <meshStandardMaterial color={color} emissive={emissive||'#000000'}
   emissiveIntensity={emissive?1.1:0} metalness={.42} roughness={.52}/>
 </instancedMesh>;
}
/** Solid posts are synchronized to the same CITY_SIGNAL_POSTS accepted by world physics.
 * All lights are batched; no hundreds of individual WebGL draw calls.
 */
export const NYCStreetFurniture=memo(function NYCStreetFurniture(){
 const pieces=useMemo(()=>{
  const poles:Piece[]=[],heads:Piece[]=[],red:Piece[]=[],walk:Piece[]=[],arms:Piece[]=[];
  for(const [i,p] of CITY_SIGNAL_POSTS.entries()){
   poles.push({x:p.x,y:1.66,z:p.z,w:.11,h:3.32,d:.11});
   arms.push({x:p.x+.56,y:3.08,z:p.z,w:1.16,h:.075,d:.11});
   heads.push({x:p.x+1.06,y:3.19,z:p.z,w:.38,h:.82,d:.32});
   red.push({x:p.x+1.06,y:3.37,z:p.z+.174,w:.22,h:.22,d:.035,color:i%4===0?'#dcad70':'#ed4d48'});
   walk.push({x:p.x+1.06,y:3.03,z:p.z+.174,w:.22,h:.22,d:.035,color:i%4===0?'#8dedaa':'#507a67'});
  }
  return {poles,heads,red,walk,arms};
 },[]);
 return <group name="nyc-street-intersection-signals">
  <Batch name="nyc-signal-poles" pieces={pieces.poles} color="#626f74"/>
  <Batch name="nyc-signal-arms" pieces={pieces.arms} color="#616f71"/>
  <Batch name="nyc-traffic-heads" pieces={pieces.heads} color="#273237"/>
  <Batch name="nyc-red-signals" pieces={pieces.red} color="#ffffff" emissive="#6d3436"/>
  <Batch name="nyc-walk-signals" pieces={pieces.walk} color="#ffffff" emissive="#255845"/>
  {CITY_SIGNAL_POSTS.slice(0,7).map((p,i)=><group key={p.id} position={[p.x,4.05,p.z]}>
    <WorldSign text={i===0?'BROADWAY':i<3?'DOWNTOWN':'UPTOWN / 7TH AVE'}
      width={3.6} color="#42695b"/>
   </group>)}
 </group>;
});
