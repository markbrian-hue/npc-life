import {memo,useLayoutEffect,useMemo,useRef} from 'react';
import {Color,Object3D,type InstancedMesh} from 'three';
import {BUILDINGS} from './world';
import {WorldSign} from './DistrictWorld';
import {cityTexture} from './cityMaterials';
type Piece={x:number;y:number;z:number;w:number;h:number;d:number;rotation:number;color:string};
const SIGNS=['CIVIC RECORDS','THE MAYOR IS OUT','LAST CHANCE LOFTS','NO VACANCY (IN YOUR CV)','PAPERWORK & SONS','NPC MARKET','ORDINARY RESIDENCES','THE UNEMPLOYED INN'];
function pieces(){const batches:Record<string,Piece[]>={wall:[],trim:[],glass:[],dark:[],metal:[],wood:[]};
 BUILDINGS.forEach((b,i)=>{const rotation=b.rotation||0,c=Math.cos(rotation),s=Math.sin(rotation);
  const add=(kind:string,x:number,y:number,z:number,w:number,h:number,d:number,color:string,yaw=0)=>batches[kind].push({x:b.x+c*x+s*z,y,z:b.z-s*x+c*z,w,h,d,rotation:rotation+yaw,color});
  add('wall',0,b.h/2,0,b.w,b.h,b.d,b.color);add('trim',0,.17,0,b.w+.15,.34,b.d+.15,'#989d95');
  add('trim',0,b.h+.1,0,b.w+.18,.18,b.d+.18,b.roof);
  for(const x of [-b.w/2+.1,b.w/2-.1])add('trim',x,b.h/2,b.d/2+.025,.18,b.h,.09,'#cbc6b8');
  if(b.kind==='bungalow'){add('dark',0,b.h+.34,0,b.w+.45,.45,b.d+.45,b.roof);add('trim',0,.09,b.d/2+1.3,2,.18,2.6,'#c5bda8');}
  else{for(const z of [-b.d/2,b.d/2])add('trim',0,b.h+.36,z,b.w+.35,.48,.17,b.roof);for(const x of [-b.w/2,b.w/2])add('trim',x,b.h+.36,0,.17,.48,b.d,b.roof);add('metal',b.w*.24,b.h+.48,-b.d*.18,1.1,.65,1.3,'#83918d');add('dark',-b.w*.2,b.h+.3,-b.d*.2,.9,.25,.8,'#3e4b4c');}
  // Four elevations use one glass and one trim batch, including side windows.
  for(let face=0;face<4;face++){const yaw=face*Math.PI/2,front=face%2===0,width=front?b.w:b.d,depth=front?b.d:b.w,fy=Math.cos(yaw),fx=Math.sin(yaw);
   const place=(kind:string,x:number,y:number,z:number,w:number,h:number,d:number,color:string)=>add(kind,fy*x+fx*z,y,-fx*x+fy*z,w,h,d,color,yaw);
   const cols=Math.max(2,Math.floor(width/3.5));
   for(let floor=0;floor<Math.ceil(b.h/2.7);floor++){const y=(b.kind==='bungalow'?1.9:3.8)+floor*2.7;if(y+.65>b.h)continue;
    for(let col=0;col<cols;col++){const x=(col-(cols-1)/2)*width/(cols+1),lit=(i+floor+col)%4!==0;
     place('trim',x,y,depth/2+.035,1.5,1.7,.07,'#c8c7b8');place('glass',x,y,depth/2+.08,1.3,1.5,.035,lit?'#779598':'#42575e');place('trim',x,y,depth/2+.115,.045,1.5,.025,'#343e40');place('trim',x,y-.87,depth/2+.14,1.62,.08,.25,'#aaa99a');
     if(face===0&&floor===1&&i%3===0){place('trim',x,y-.96,depth/2+.3,1.8,.12,.65,'#9c9f94');place('metal',x,y-.52,depth/2+.56,1.8,.04,.04,'#455359');for(const rail of [-.8,0,.8])place('metal',x+rail,y-.7,depth/2+.55,.035,.5,.035,'#455359');}
    }
    place('trim',0,y-1.1,depth/2+.018,width,.08,.04,'#b7b5a6');
   }
  }
  add('dark',0,1.2,b.d/2+.05,1.5,2.4,.06,'#34454a');add('glass',0,1.4,b.d/2+.1,1.2,1.7,.025,'#7e9c9e');add('metal',.55,1.1,b.d/2+.15,.06,.22,.06,'#b9ba9c');
  if(b.kind!=='warehouse'&&b.kind!=='bungalow'){add('wood',0,2.7,b.d/2+.32,3.1,.16,.7,['#a0654a','#507c70','#5b6a80'][i%3]);for(const x of [-b.w*.32,b.w*.32]){add('glass',x,1.4,b.d/2+.05,1.9,1.9,.035,'#506e74');add('trim',x,.4,b.d/2+.06,2.05,.12,.07,'#c9c0a7');}}
 });return batches;}
function Batch({data,kind}:{data:Piece[];kind:string}){const ref=useRef<InstancedMesh>(null),texture=useMemo(()=>kind==='wall'?cityTexture('masonry'):null,[kind]);
 useLayoutEffect(()=>{if(!ref.current)return;const obj=new Object3D(),color=new Color();data.forEach((p,i)=>{obj.position.set(p.x,p.y,p.z);obj.scale.set(p.w,p.h,p.d);obj.rotation.set(0,p.rotation,0);obj.updateMatrix();ref.current!.setMatrixAt(i,obj.matrix);ref.current!.setColorAt(i,color.set(p.color));});ref.current.instanceMatrix.needsUpdate=true;ref.current.computeBoundingSphere();},[data]);
 return <instancedMesh ref={ref} args={[undefined,undefined,data.length]} castShadow={kind!=='glass'} receiveShadow userData={{environment:kind==='glass'?'window':''}}><boxGeometry args={[1,1,1]}/><meshStandardMaterial map={texture} roughness={kind==='glass'?.19:kind==='metal'?.42:.87} metalness={kind==='glass'?.15:kind==='metal'?.6:0}/></instancedMesh>;}
/** Thousands of facade details in six instanced draw calls. World footprints stay unchanged. */
export const CityArchitecture=memo(function CityArchitecture(){const batches=useMemo(pieces,[]);return <>{Object.entries(batches).map(([kind,data])=><Batch key={kind} data={data} kind={kind}/>)}{BUILDINGS.filter((b,i)=>b.kind!=='bungalow'&&b.kind!=='warehouse'&&i%2===0).map((b,i)=>{const r=b.rotation||0;return <group key={i} position={[b.x+Math.sin(r)*(b.d/2+.15),2.65,b.z+Math.cos(r)*(b.d/2+.15)]} rotation={[0,r,0]}><WorldSign text={SIGNS[i%SIGNS.length]} width={Math.min(5.5,b.w*.65)} color="#526960"/></group>;})}</>;});
