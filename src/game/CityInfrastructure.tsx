import {memo,useMemo} from 'react';
import {BufferGeometry,Float32BufferAttribute} from 'three';
import {cityMaps} from './cityMaterials';
import {ROAD_SEGMENTS,ROUND_ROADS,PARKING_BAYS,PARK_PATHS,BUILDINGS,onRoad,roadBounds,inBox} from './world';
import {StreetBoard} from './DistrictWorld';
type Rect={x:number;z:number;w:number;d:number;y?:number};
function rectangles(items:Rect[],scale=.5){const p:number[]=[],uv:number[]=[];for(const b of items){const y=b.y||0;for(const [x,z]of [[-1,-1],[-1,1],[1,1],[-1,-1],[1,1],[1,-1]]){const px=b.x+x*b.w/2,pz=b.z+z*b.d/2;p.push(px,y,pz);uv.push(px*scale,pz*scale);}}const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;}
/** Partition the road union so asphalt is never hidden under full-width sidewalk planes. */
export function streetSurfaces(){
 const roads=ROAD_SEGMENTS.map(r=>roadBounds(r)),outer=ROAD_SEGMENTS.map(r=>roadBounds(r,2.1));
 const xs=[...new Set([...roads,...outer].flatMap(b=>[b.x-b.w/2,b.x+b.w/2]))].sort((a,b)=>a-b),zs=[...new Set([...roads,...outer].flatMap(b=>[b.z-b.d/2,b.z+b.d/2]))].sort((a,b)=>a-b);
 const asphalt:Rect[]=[],paving:Rect[]=[];
 for(let i=1;i<xs.length;i++)for(let j=1;j<zs.length;j++){const b={x:(xs[i-1]+xs[i])/2,z:(zs[j-1]+zs[j])/2,w:xs[i]-xs[i-1],d:zs[j]-zs[j-1]};
  if(roads.some(r=>inBox(b.x,b.z,r)))asphalt.push({...b,y:-.018});
  else if(outer.some(r=>inBox(b.x,b.z,r))&&!ROUND_ROADS.some(r=>Math.hypot(b.x-r.x,b.z-r.z)<r.outer+1))paving.push({...b,y:.06});
 }
 return {asphalt,paving};
}
function SurfaceBatch({rects,kind,color='#ffffff',road=false}:{rects:Rect[];kind:string;color?:string;road?:boolean}){const geometry=useMemo(()=>rectangles(rects,kind==='asphalt'?.45:.5),[rects,kind]),maps=useMemo(()=>cityMaps(kind),[kind]);return <mesh geometry={geometry} name={`surface:${kind}`} receiveShadow userData={{environment:road?'road':''}}><meshStandardMaterial {...maps} color={color} bumpScale={kind==='asphalt'?.018:.028} roughness={.96}/></mesh>;}
function RingSurface({r,sidewalk=false}:{r:typeof ROUND_ROADS[number];sidewalk?:boolean}){const maps=cityMaps(sidewalk?'paving':'asphalt');return <mesh position={[r.x,sidewalk?.058:-.012,r.z]} rotation={[-Math.PI/2,0,0]} receiveShadow userData={{environment:sidewalk?'':'road'}}><ringGeometry args={[sidewalk?r.outer:r.inner,sidewalk?r.outer+2.1:r.outer,96]}/><meshStandardMaterial {...maps} bumpScale={.015} roughness={.95}/></mesh>;}
export const CityInfrastructure=memo(function CityInfrastructure(){
 const surfaces=useMemo(streetSurfaces,[]);
 const yellow=useMemo(()=>ROAD_SEGMENTS.flatMap(r=>Array.from({length:Math.floor(r.length/6)},(_,i)=>{const along=-r.length/2+3+i*6,x=r.x+(r.axis==='x'?along:0),z=r.z+(r.axis==='z'?along:0);if(ROUND_ROADS.some(c=>Math.hypot(x-c.x,z-c.z)<c.outer+3)||ROAD_SEGMENTS.some(o=>o.id!==r.id&&inBox(x,z,roadBounds(o),1)))return [];return [{x,z,w:r.axis==='x'?2.8:.10,d:r.axis==='z'?2.8:.10,y:-.004}];})).flat(),[]);
 const frontages=useMemo(()=>BUILDINGS.flatMap(b=>{const out:Rect[]=[],r=b.rotation||0,c=Math.cos(r),s=Math.sin(r),width=b.kind==='bungalow'?1.8:b.w;for(let x=-width/2+.2;x<width/2;x+=.4)for(let z=b.d/2+.2;z<b.d/2+3.6;z+=.4){const wx=b.x+c*x+s*z,wz=b.z-s*x+c*z;if(!onRoad(wx,wz)&&!PARKING_BAYS.some(p=>inBox(wx,wz,p,.2)))out.push({x:wx,z:wz,w:.405,d:.405,y:.008});}return out;}),[]);
 const white=useMemo(()=>{
  const marks:Rect[]=[];
  for(const v of [-18,18])for(let i=-3;i<=3;i++){marks.push({x:v+i*.57,z:0,w:.36,d:7.1,y:-.003},{x:0,z:v+i*.57,w:7.1,d:.36,y:-.003});}
  for(const r of ROAD_SEGMENTS)for(let i=1;i<r.length/3-1;i++)for(const s of [-1,1]){const along=-r.length/2+i*3,b={x:r.x+(r.axis==='x'?along:s*(r.width/2-.3)),z:r.z+(r.axis==='z'?along:s*(r.width/2-.3)),w:r.axis==='x'?3:.075,d:r.axis==='z'?3:.075,y:-.003};if(!ROUND_ROADS.some(c=>Math.hypot(b.x-c.x,b.z-c.z)<c.outer+2)&&!ROAD_SEGMENTS.some(o=>o.id!==r.id&&inBox(b.x,b.z,roadBounds(o),.7)))marks.push(b);}
  for(const x of [-21,21])marks.push({x,z:x>0?2:-2,w:.27,d:3.6,y:-.003});
  for(const z of [-21,21])marks.push({x:z>0?-2:2,z,w:3.6,d:.27,y:-.003});
  return marks;
 },[]);
 return <>
  <SurfaceBatch rects={[{x:0,z:0,w:1200,d:1200,y:-.085}]} kind="grass"/>
  <SurfaceBatch rects={PARK_PATHS.flatMap(p=>{const out:Rect[]=[];for(let x=p.x-p.w/2;x<p.x+p.w/2;x+=.2)for(let z=p.z-p.d/2;z<p.z+p.d/2;z+=.2)if(!ROAD_SEGMENTS.some(r=>inBox(x+.1,z+.1,roadBounds(r))))out.push({x:x+.1,z:z+.1,w:.2,d:.2,y:.035});return out;})} kind="gravel"/>
  <SurfaceBatch rects={frontages} kind="paving" color="#aab0a5"/>
  <SurfaceBatch rects={surfaces.paving} kind="paving"/>
  <SurfaceBatch rects={surfaces.asphalt} kind="asphalt" road/>
  {ROUND_ROADS.map(r=><group key={r.id}><RingSurface r={r}/><RingSurface r={r} sidewalk/></group>)}
  <SurfaceBatch rects={yellow} kind="paint" color="#d5b978"/>
  <SurfaceBatch rects={white} kind="paint"/>
  {PARKING_BAYS.map(p=><group key={p.id} position={[p.x,0,p.z]} rotation={[0,p.rotation,0]}><SurfaceBatch rects={[{x:0,z:0,w:p.w,d:p.d,y:.003}]} kind="asphalt" road/><SurfaceBatch rects={[-1,1].map(s=>({x:s*(p.w/2-.12),z:0,w:.07,d:p.d-.1,y:.012}))} kind="paint"/></group>)}
  {ROAD_SEGMENTS.filter(r=>r.kind==='avenue').map((r,i)=><group key={r.id} position={[r.x+1.3,.003,r.z+1.3]} rotation={[-Math.PI/2,0,i]}><mesh><circleGeometry args={[.37,32]}/><meshStandardMaterial color="#424b4d" metalness={.65} roughness={.8}/></mesh>{[-2,-1,0,1,2].map(j=><mesh key={j} position={[0,j*.1,.002]}><planeGeometry args={[.58,.018]}/><meshStandardMaterial color="#242d30"/></mesh>)}</group>)}
  <group position={[-115,0,-48]}><SurfaceBatch rects={[{x:0,z:0,w:15,d:22,y:-.02}]} kind="asphalt" color="#6f8b76"/><SurfaceBatch rects={[{x:0,z:0,w:12,d:.1,y:-.006}]} kind="paint"/><mesh position={[0,2,-9]}><boxGeometry args={[.14,4,.14]}/><meshStandardMaterial color="#596460"/></mesh><mesh position={[0,3.7,-8.5]}><boxGeometry args={[2.1,1.2,.12]}/><meshStandardMaterial color="#d3d1b9"/></mesh><mesh position={[0,3.2,-7.9]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.42,.035,8,24]}/><meshStandardMaterial color="#ca8057"/></mesh><group position={[0,0,11]}><StreetBoard text="JUNIPER COURT / T TO PLAY" width={7} height={1.8}/></group></group>
  {[[105,-63,'EAST BYPASS'],[-82,-71,'JUNIPER MOTOR CLUB'],[9,24,'RESIDENT BUREAU / L'],[10,-85,'DISPATCH / L']].map(([x,z,text])=><group key={text} position={[Number(x),0,Number(z)]}><StreetBoard text={String(text)}/></group>)}
 </>;
});
