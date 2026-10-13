import {memo,useLayoutEffect,useMemo,useRef} from 'react';
import {Color,Object3D,MeshStandardMaterial,type InstancedMesh} from 'three';
import {BUILDINGS} from './world';
import {WorldSign} from './DistrictWorld';
import {cityMaps,interiorTexture,worldMapping} from './cityMaterials';
type Piece={x:number;y:number;z:number;w:number;h:number;d:number;rotation:number;color:string};
const SIGNS=['CIVIC RECORDS','JUNIPER COFFEE','LAST CHANCE LOFTS','CORNER PROVISIONS','PAPERWORK & SONS','NPC MARKET','ORDINARY RESIDENCES','THE UNEMPLOYED INN'];
function pieces(){const batches:Record<string,Piece[]>={brick:[],concrete:[],masonry:[],trim:[],glass:[],dark:[],metal:[],wood:[]};
 BUILDINGS.forEach((b,i)=>{const rotation=b.rotation||0,c=Math.cos(rotation),s=Math.sin(rotation),home=b.kind==='bungalow',warehouse=b.kind==='warehouse',modern=!home&&!warehouse&&i%4===1;
  const add=(kind:string,x:number,y:number,z:number,w:number,h:number,d:number,color:string,yaw=0)=>batches[kind].push({x:b.x+c*x+s*z,y,z:b.z-s*x+c*z,w,h,d,rotation:rotation+yaw,color});
  const kind=warehouse||modern?'concrete':i%3===0?'brick':'masonry',wall=['#ded5c3','#ced6d4','#dac7b3','#bfb5a7'][i%4],trim=modern?'#646f72':'#c9c5b8';
  add(kind,0,b.h/2,0,b.w,b.h,b.d,wall);
  add('trim',0,.28,0,b.w+.1,.55,b.d+.1,'#777d7a');
  add('dark',0,b.h+.035,0,b.w,.075,b.d,'#525b5c');
  for(const z of [-b.d/2,b.d/2]){add('trim',0,b.h+.2,z,b.w+.27,.25,.22,trim);add('trim',0,b.h-.22,z,b.w+.15,.15,.15,trim);}
  for(const x of [-b.w/2,b.w/2])add('trim',x,b.h+.2,0,.22,.25,b.d+.15,trim);
  if(home){add('dark',0,b.h+.2,0,b.w+.4,.28,b.d+.4,'#646963');add('trim',0,.08,b.d/2+.18,1.8,.16,.5,'#bcb8aa');add('wood',0,2.5,b.d/2+.25,2.2,.16,.75,'#726355');}
  else{add('metal',b.w*.24,b.h+.45,-b.d*.18,1.1,.7,1.3,'#939b97');add('dark',-b.w*.2,b.h+.3,-b.d*.2,.8,.3,.8,'#394449');for(let vent=0;vent<5;vent++)add('dark',b.w*.24,b.h+.79,-b.d*.18+(vent-2)*.18,.88,.02,.04,'#364249');add('metal',b.w*.35,b.h+.72,b.d*.2,.19,1.15,.19,'#92968c');}
  for(let face=0;face<4;face++){
   const yaw=face*Math.PI/2,front=face%2===0,width=front?b.w:b.d,depth=front?b.d:b.w,fy=Math.cos(yaw),fx=Math.sin(yaw);
   const place=(kind:string,x:number,y:number,z:number,w:number,h:number,d:number,color:string)=>add(kind,fy*x+fx*z,y,-fx*x+fy*z,w,h,d,color,yaw);
   const cols=Math.max(2,Math.floor(width/(modern?2.4:2.8))),spacing=width/(cols+1),ww=modern?spacing-.19:Math.min(1.48,spacing-.65),start=home?1.8:4.45;
   if(!home){place('trim',0,2.95,depth/2+.10,width+.12,.20,.26,trim);place('dark',0,3.09,depth/2+.055,width,.035,.1,'#687371');}
   for(let floor=0;floor<Math.ceil(b.h/3.1);floor++){
    const y=start+floor*3.1;if(y+.9>b.h-.1)continue;
    for(let col=0;col<cols;col++){
     const x=(col-(cols-1)/2)*spacing,h=home?1.28:modern?2.3:1.85;
     place('dark',x,y,depth/2+.025,ww+.18,h+.18,.05,'#2b383e');
     place('glass',x,y,depth/2+.055,ww,h,.035,((i*3+floor+col)%5===0)?'#58696c':'#ced2c7');
     for(const side of [-1,1])place('trim',x+side*(ww/2+.048),y,depth/2+.10,.075,h+.20,.20,trim);
     place('trim',x,y+h/2+.06,depth/2+.10,ww+.26,.11,.2,trim);
     place('trim',x,y-h/2-.07,depth/2+.17,ww+.35,.14,.35,trim);
     place('metal',x,y,depth/2+.12,.038,h,.06,'#38494f');
     if(!modern)place('metal',x,y+.19,depth/2+.12,ww,.035,.04,'#38494f');
     if(face===0&&floor>0&&i%3===0){
      place('trim',x,y-h/2-.2,depth/2+.43,ww+.5,.16,.90,'#919b97');
      for(const height of [y-h/2+.15,y-h/2+.7])place('metal',x,height,depth/2+.86,ww+.5,.035,.035,'#3e4b4e');
      for(let k=0;k<7;k++)place('metal',x+(k-3)*(ww+.43)/6,y-h/2+.38,depth/2+.86,.025,.7,.025,'#3e4b4e');
     }
     if(home&&i%2===0)for(const s of [-1,1])place('wood',x+s*(ww/2+.28),y,depth/2+.1,.35,h,.08,'#5a6f62');
    }
    if(!modern&&!home)place('trim',0,y-1.33,depth/2+.04,width,.065,.09,trim);
   }
   if(!home&&!warehouse)for(const x of [-width/2+.2,width/2-.2]){place('trim',x,b.h/2,depth/2+.07,.26,b.h,.18,trim);for(let y=.7;y<b.h-.5;y+=.55)place('trim',x,y,depth/2+.18,.36,.24,.07,trim);}
   if(modern)for(let col=0;col<=cols;col++)place('metal',(col-cols/2)*spacing,3+(b.h-3)/2,depth/2+.11,.065,b.h-3,.16,'#7e8a89');
  }
  add('dark',0,1.28,b.d/2+.04,1.5,2.55,.07,'#303c41');add('glass',0,1.36,b.d/2+.095,1.21,2.23,.035,'#9cabaa');
  for(const side of [-1,1])add('metal',side*.67,1.34,b.d/2+.13,.055,2.4,.06,'#394b4e');add('metal',.47,1.18,b.d/2+.18,.025,.43,.065,'#c1bbb0');add('trim',0,.07,b.d/2+.18,1.55,.14,.42,'#b9b6a9');
  if(!warehouse&&!home){
   for(const x of [-b.w*.32,b.w*.32]){const w=Math.min(2.5,b.w*.27);add('dark',x,1.42,b.d/2+.03,w+.12,2.36,.055,'#354348');add('glass',x,1.43,b.d/2+.07,w,2.18,.03,'#ced0bf');add('metal',x,1.43,b.d/2+.11,.055,2.18,.03,'#465456');add('trim',x,.32,b.d/2+.13,w+.17,.19,.15,trim);}
   for(let n=0;n<12;n++)add('wood',(n-5.5)*b.w*.064,2.88,b.d/2+.4,b.w*.064,.12,.8,n%2?'#d3c8a6':['#5e776a','#987157','#545f6a'][i%3]);
   add('wood',0,2.73,b.d/2+.8,b.w*.77,.23,.05,['#5e776a','#987157','#545f6a'][i%3]);
  }
 });return batches;}
function Batch({data,kind}:{data:Piece[];kind:string}){
 const ref=useRef<InstancedMesh>(null),material=useMemo(()=>{
  const textured=['brick','masonry','concrete','office'].includes(kind);
  const m=new MeshStandardMaterial({color:'#ffffff',...(textured?cityMaps(kind):kind==='glass'?{map:interiorTexture(),emissiveMap:interiorTexture()} : {}),roughness:kind==='glass'?.14:kind==='metal'?.34:.86,metalness:kind==='glass'?.3:kind==='metal'?.7:0,bumpScale:.045});
  if(textured)worldMapping(m,kind==='brick'?.8:kind==='office'?.065:.42);return m;
 },[kind]);
 useLayoutEffect(()=>{if(!ref.current)return;const obj=new Object3D(),color=new Color();data.forEach((p,i)=>{obj.position.set(p.x,p.y,p.z);obj.scale.set(p.w,p.h,p.d);obj.rotation.set(0,p.rotation,0);obj.updateMatrix();ref.current!.setMatrixAt(i,obj.matrix);ref.current!.setColorAt(i,color.set(p.color));});ref.current.instanceMatrix.needsUpdate=true;if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true;ref.current.computeBoundingSphere();},[data]);
 return <instancedMesh name={`architecture:${kind}`} ref={ref} args={[undefined,material,data.length]} castShadow={kind!=='glass'} receiveShadow userData={{environment:kind==='glass'?'window':''}}><boxGeometry args={[1,1,1]}/></instancedMesh>;
}
export const CityArchitecture=memo(function CityArchitecture(){const batches=useMemo(pieces,[]);return <>{Object.entries(batches).map(([kind,data])=><Batch key={kind} data={data} kind={kind}/>)}{BUILDINGS.filter((b,i)=>b.kind!=='bungalow'&&b.kind!=='warehouse'&&i%2===0).map((b,i)=>{const r=b.rotation||0;return <group key={i} position={[b.x+Math.sin(r)*(b.d/2+.19),3.18,b.z+Math.cos(r)*(b.d/2+.19)]} rotation={[0,r,0]}><WorldSign text={SIGNS[i%SIGNS.length]} width={Math.min(4.4,b.w*.48)} color={i%2?'#657367':'#8d7762'}/></group>;})}<DistantCity/></>;});
function DistantCity(){const data=useMemo(()=>{const blocks:Piece[]=[];for(let i=0;i<44;i++){const a=Math.PI+(i/43)*Math.PI*1.48,r=185+i%4*25,x=Math.cos(a)*r,z=Math.sin(a)*r;if(z>70)continue;const h=12+i*17%42,w=9+i%4*4,d=11+i%3*3;blocks.push({x,y:h/2-1,z,w,h,d,rotation:0,color:i%3?'#a6aca8':'#909b9b'});blocks.push({x:x+w*.1,y:h+1,z,w:w*.73,h:4,d:d*.72,rotation:0,color:'#a5aaa5'});}return blocks;},[]);return <Batch data={data} kind="office"/>;}
