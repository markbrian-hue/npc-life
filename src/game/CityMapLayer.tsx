import {memo} from 'react';
import {GARAGES} from '../../shared/vehicleCatalog.mjs';
import {BUSINESSES} from '../../shared/livingCity.mjs';
import { ROAD_SEGMENTS, ROUND_ROADS, PARKING_BAYS, PARK_PATHS, ACTIVITY_SITES, BUILDINGS, WORLD_RADIUS, roadBounds } from './world';
export const CityMapLayer=memo(function CityMapLayer({size,details=false}:{size:number;details?:boolean}) {
  const u=size/(WORLD_RADIUS*2),s=(n:number)=>(n+WORLD_RADIUS)*u;
  const rect=(b:{x:number;z:number;w:number;d:number},color:string,key:string)=><rect key={key} x={s(b.x-b.w/2)} y={s(b.z-b.d/2)} width={b.w*u} height={b.d*u} fill={color}/>;
  return <>
    <rect width={size} height={size} fill="#91a27c"/>
    <rect y={s(75)} width={size} height={size-s(75)} fill="#578f9b"/>
    {rect({x:0,z:83,w:20,d:20},'#a89676','pier')}
    {PARK_PATHS.map((p,i)=>rect(p,'#c6baa0',`path${i}`))}
    {ROAD_SEGMENTS.map(r=>rect(roadBounds(r,2.1),'#b9b5a6',`pave${r.id}`))}
    {ROUND_ROADS.map(r=><circle key={`pave${r.id}`} cx={s(r.x)} cy={s(r.z)} r={(r.outer+2.1)*u} fill="#b9b5a6"/>)}
    {ROAD_SEGMENTS.map(r=>rect(roadBounds(r),'#566663',r.id))}
    {ROUND_ROADS.map(r=><g key={r.id}><circle cx={s(r.x)} cy={s(r.z)} r={r.outer*u} fill="#566663"/><circle cx={s(r.x)} cy={s(r.z)} r={r.inner*u} fill="#91a27c"/></g>)}
    {PARKING_BAYS.map(p=>rect(p,'#b1b6a3',p.id))}
    {BUILDINGS.map((b,i)=><rect key={i} transform={`rotate(${-(b.rotation||0)*180/Math.PI} ${s(b.x)} ${s(b.z)})`} x={s(b.x-b.w/2)} y={s(b.z-b.d/2)} width={b.w*u} height={b.d*u} fill={b.roof} stroke="#d0c5a5" strokeWidth={.7}/>)}
    <text x={s(-92)} y={s(-113)} fill="#f8efd4" fontSize={size/35} textAnchor="middle">JUNIPER CLOSE</text>
    <text x={s(-44)} y={s(-192)} fill="#f8efd4" fontSize={size/36} textAnchor="middle">NORTHGATE</text>
    <text x={s(162)} y={s(-174)} fill="#f8efd4" fontSize={size/36} textAnchor="middle">EASTBANK</text>
    {GARAGES.map(g=><g key={g.id}><rect x={s(g.x)-3} y={s(g.z)-3} width={6} height={6} fill="#a9d8ad"/><title>{g.name} · U dealership / collection</title></g>)}
    {BUSINESSES.map(p=><g key={p.id}><circle cx={s(p.x)} cy={s(p.z)} r={3} fill={p.color}/><title>{p.name} · G to shop</title></g>)}
    {details&&ACTIVITY_SITES.map((p,i)=><g key={p.id}><rect x={s(p.x)-3} y={s(p.z)-3} width={6} height={6} fill="#ffc66f"/><title>{p.name}</title><text x={s(p.x)+5} y={s(p.z)+3} fill="#fff3cf" stroke="#263a31" strokeWidth={2} paintOrder="stroke" fontSize={9}>{i+1}</text></g>)}
  </>;
});
