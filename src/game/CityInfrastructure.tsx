import {cityTexture} from './cityMaterials';
import {PlaneGeometry} from 'three';
import {useMemo} from 'react';
import { memo } from 'react';
import { ROAD_SEGMENTS, ROUND_ROADS, PARKING_BAYS, PARK_PATHS, WORLD_RADIUS, roadBounds, inBox } from './world';
import { StreetBoard } from './DistrictWorld';
function Surface({x,z,w,d,y,color}:{x:number;z:number;w:number;d:number;y:number;color:string}) {
  const geometry=useMemo(()=>{const g=new PlaneGeometry(w,d),uv=g.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w/4,uv.getY(i)*d/4);return g;},[w,d]);
  const texture=useMemo(()=>cityTexture(color==='#626b69'||color==='#4f595d'?'asphalt':'paving'),[color]);
  return <mesh geometry={geometry} userData={{environment:color==='#626b69'||color==='#4f595d'?'road':''}} receiveShadow position={[x,y,z]} rotation={[-Math.PI/2,0,0]}><meshStandardMaterial map={texture} color={color} roughness={.98}/></mesh>;
}
export const CityInfrastructure=memo(function CityInfrastructure(){
  return <>
    <Surface x={0} z={0} w={WORLD_RADIUS*2+12} d={WORLD_RADIUS*2+12} y={-.085} color="#91a27c"/>
    {PARK_PATHS.map((p,i)=><Surface key={`path${i}`} {...p} y={.035} color="#c6baa0"/>)}
    {ROAD_SEGMENTS.map(r=><Surface key={`pave${r.id}`} {...roadBounds(r,2.1)} y={.06} color="#b9b5a6"/>)}
    {ROUND_ROADS.map(r=><mesh key={`pave${r.id}`} position={[r.x,-.045,r.z]} rotation={[-Math.PI/2,0,0]} receiveShadow><circleGeometry args={[r.outer+2.1,64]}/><meshStandardMaterial color="#b9b5a6"/></mesh>)}
    {ROAD_SEGMENTS.map(r=><Surface key={r.id} {...roadBounds(r)} y={-.02} color={r.kind==='highway'?'#4f595d':'#626b69'}/>)}
    {ROUND_ROADS.map(r=><mesh key={r.id} position={[r.x,-.015,r.z]} rotation={[-Math.PI/2,0,0]} receiveShadow><ringGeometry args={[r.inner,r.outer,64]}/><meshStandardMaterial color="#626b69"/></mesh>)}
    {ROAD_SEGMENTS.flatMap(r=>Array.from({length:Math.floor(r.length/5)},(_,i)=>{
      const along=-r.length/2+2.5+i*5,x=r.x+(r.axis==='x'?along:0),z=r.z+(r.axis==='z'?along:0);
      if(ROUND_ROADS.some(c=>Math.hypot(x-c.x,z-c.z)<c.outer+3)||ROAD_SEGMENTS.some(o=>o.id!==r.id&&inBox(x,z,roadBounds(o),1)))return null;
      return <Surface key={`${r.id}${i}`} x={x} z={z} w={r.axis==='x'?2.2:.12} d={r.axis==='z'?2.2:.12} y={-.008} color="#e5d39a"/>;
    }))}
    {[-18,18].flatMap(v=>Array.from({length:7},(_,i)=><group key={`${v}${i}`}>
      <Surface x={v+(i-3)*.54} z={0} w={.3} d={7.1} y={-.007} color="#efe9d6"/>
      <Surface x={0} z={v+(i-3)*.54} w={7.1} d={.3} y={-.007} color="#efe9d6"/>
    </group>))}
    {PARKING_BAYS.map(p=><group key={p.id} position={[p.x,0,p.z]} rotation={[0,p.rotation,0]}>
      <Surface x={0} z={0} w={p.w} d={p.d} y={.003} color="#8b938b"/>
      {[-1,1].map(s=><Surface key={s} x={s*(p.w/2-.12)} z={0} w={.08} d={p.d-.1} y={.009} color="#e8dfbc"/>)}
    </group>)}
    <group position={[-115,0,-48]}>
      <Surface x={0} z={0} w={15} d={22} y={-.02} color="#738579"/>
      <Surface x={0} z={0} w={12} d={.1} y={-.008} color="#e6daba"/>
      <mesh position={[0,2,-9]}><boxGeometry args={[.14,4,.14]}/><meshStandardMaterial color="#596460"/></mesh>
      <mesh position={[0,3.7,-8.5]}><boxGeometry args={[2.1,1.2,.12]}/><meshStandardMaterial color="#d3d1b9"/></mesh>
      <mesh position={[0,3.2,-7.9]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.42,.035,6,16]}/><meshStandardMaterial color="#ca8057"/></mesh>
      <group position={[0,0,11]}><StreetBoard text="JUNIPER COURT / T TO PLAY" width={7} height={1.8}/></group>
    </group>
    {[[105,-63,'EAST BYPASS'],[-82,-71,'JUNIPER MOTOR CLUB'],[9,24,'RESIDENT BUREAU / L'],[10,-85,'DISPATCH / L']].map(([x,z,text])=><group key={text} position={[Number(x),0,Number(z)]}><StreetBoard text={String(text)}/></group>)}
  </>;
});
