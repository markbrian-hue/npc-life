import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {build} from 'vite';
import {VEHICLE_CATALOG} from '../shared/vehicleCatalog.mjs';
import {ROAD_SEGMENTS,roadBounds,inBox} from '../shared/cityPlan.mjs';
async function source(entry){const result=await build({configFile:false,publicDir:false,logLevel:'silent',build:{write:false,minify:false,lib:{entry:resolve(entry),formats:['es']}}});const [{output}]=Array.isArray(result)?result:[result];return import(`data:text/javascript;base64,${Buffer.from(output.find(o=>o.type==='chunk').code).toString('base64')}`);}
const {bodyShell,glasshouse,form,wheelGeometry}=await source('src/game/vehicleGeometry.ts');
const {streetSurfaces}=await source('src/game/CityInfrastructure.tsx');
test('rendered asphalt and raised paving never cover the same road area',()=>{
 const {asphalt,paving}=streetSurfaces();assert.ok(asphalt.length>0&&paving.length>0);
 for(const a of asphalt)for(const b of paving)assert.ok(Math.min(a.x+a.w/2,b.x+b.w/2)-Math.max(a.x-a.w/2,b.x-b.w/2)<1e-8||Math.min(a.z+a.d/2,b.z+b.d/2)-Math.max(a.z-a.d/2,b.z-b.d/2)<1e-8);
 for(const road of ROAD_SEGMENTS){const bounds=roadBounds(road);for(let i=1;i<20;i++){const x=road.x+(road.axis==='x'?(i/20-.5)*road.length:0),z=road.z+(road.axis==='z'?(i/20-.5)*road.length:0);assert.ok(asphalt.some(a=>inBox(x,z,a)),road.id);assert.ok(!paving.some(p=>Math.abs(x-p.x)<p.w/2-1e-8&&Math.abs(z-p.z)<p.d/2-1e-8),road.id);assert.ok(inBox(x,z,bounds));}}
});
test('all car body shells have finite geometry, correct dimensions and real wheel-arch clearances',()=>{
 for(const v of VEHICLE_CATALOG.filter(v=>v.category!=='Motorcycles')){
  const g=bodyShell(v),f=form(v);g.computeBoundingBox();assert.ok(Math.abs(g.boundingBox.max.x-g.boundingBox.min.x-v.length)<1e-5,v.id);
  const p=g.attributes.position,n=g.attributes.normal;assert.ok([...p.array,...n.array].every(Number.isFinite),v.id);
  for(const axle of [-v.wheelbase/2,v.wheelbase/2]){let near=Infinity,bottom=0;for(let i=0;i<73;i++){const dx=Math.abs(p.getX(i*11)-axle);if(dx<near){near=dx;bottom=p.getY(i*11);}}assert.ok(bottom>f.r*1.8,v.id+' arch clears tire');}
  const glass=glasshouse(v);assert.ok([...glass.attributes.position.array,...glass.attributes.normal.array].every(Number.isFinite),v.id+' glass');
  assert.equal(bodyShell(v),g,'geometry is reused');
 }
});
test('new wheel geometry preserves physical tire radii used by suspension',()=>{
 for(const r of [.32,.34,.37,.4,.42,.43]){const g=wheelGeometry(r).tire;g.computeBoundingBox();assert.ok(Math.abs(g.boundingBox.max.y-r)<1e-6);assert.ok(Math.abs(g.boundingBox.min.y+r)<1e-6);}
});
