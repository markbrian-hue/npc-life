import {BufferGeometry,Float32BufferAttribute,Vector3,CatmullRomCurve3,TubeGeometry,BoxGeometry,CylinderGeometry,TorusGeometry} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {VEHICLE_BY_ID} from '../../shared/vehicleCatalog.mjs';
export type VehicleSpec=typeof VEHICLE_BY_ID[string];
export type Point=[number,number,number];
const cache=new Map<string,BufferGeometry>();
export function rounded(size:Point,r=.04){const key=`rounded:${size}:${r}`;if(!cache.has(key))cache.set(key,new RoundedBoxGeometry(...size,2,r));return cache.get(key)!;}
export function tube(points:Point[],radius=.018){return new TubeGeometry(new CatmullRomCurve3(points.map(p=>new Vector3(...p)),false,'centripetal'),Math.max(2,(points.length-1)*5),radius,6,false);}
export function join(parts:BufferGeometry[]){const g=mergeGeometries(parts.map(p=>{const n=p.index?p.toNonIndexed():p.clone();n.deleteAttribute('uv');return n;}))!;parts.forEach(p=>p.dispose());return g;}
function indexed(vertices:number[],indices:number[]){const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;}
export function form(v:VehicleSpec){const utility=['bus','delivery','ambulance','van'].includes(v.body),pickup=['pickup','service'].includes(v.body),sport=['supercar','hypercar','roadster','gt','coupe','muscle','tuner'].includes(v.body),exotic=['supercar','hypercar'].includes(v.body),estate=['hatch','tuner','suv','wagon','van','bus','delivery','ambulance'].includes(v.body);
 const r=v.body==='suv'||pickup?.43:utility?.42:.37;
 return {utility,pickup,sport,exotic,estate,r,belt:v.height*(utility?.47:sport?.56:.59),roof:v.height*.98,frontBase:v.length*(utility?.4:exotic?.24:.25),frontRoof:v.length*(utility?.3:exotic?.07:.045),backBase:-v.length*(pickup?.075:estate?.43:exotic?.28:.34),backRoof:-v.length*(pickup?.025:estate?.34:exotic?.19:.19)};
}
/** A continuous body shell with actual arch openings, rounded shoulders and nose taper. */
export function bodyShell(v:VehicleSpec){const key=v.id+':shell';if(cache.has(key))return cache.get(key)!;const f=form(v),vertices:number[]=[],indices:number[]=[],rows=72,cols=11;
 for(let i=0;i<=rows;i++){const u=i/rows,x=(u-.5)*v.length,front=Math.max(0,(u-.72)/.28),rear=Math.max(0,(.15-u)/.15),w=v.width*.5*(1-.17*front*front-.12*rear*rear);
  let arch=.25;for(const axle of [-v.wheelbase/2,v.wheelbase/2]){const d=Math.abs(x-axle),r=f.r+.065;if(d<r)arch=Math.max(arch,f.r+Math.sqrt(r*r-d*d));}
  const hood=f.belt*(1-.22*front*front)+.035*Math.sin(u*Math.PI),shoulder=Math.max(hood,arch+.045),bottom=arch;
  const ring=[[bottom,-w*.96],[Math.max(bottom+.014,shoulder-.13),-w],[shoulder-.025,-w*.98],[shoulder+.025,-w*.86],[hood+.06,-w*.5],[hood+.075,0],[hood+.06,w*.5],[shoulder+.025,w*.86],[shoulder-.025,w*.98],[Math.max(bottom+.014,shoulder-.13),w],[bottom,w*.96]];
  for(const [y,z]of ring)vertices.push(x,y,z);
  if(i)for(let j=0;j<cols-1;j++){const a=(i-1)*cols+j,b=i*cols+j;indices.push(a,b+1,b,a,a+1,b+1);}
 }
 // Close only the bumpers. The underside remains open at wheel arches.
 for(const row of [0,rows]){const offset=row*cols,center=vertices.length/3;vertices.push((row/rows-.5)*v.length,.34,0);for(let j=0;j<cols-1;j++){if(row===0)indices.push(center,offset+j+1,offset+j);else indices.push(center,offset+j,offset+j+1);}}
 const g=indexed(vertices,indices);cache.set(key,g);return g;
}
/** Rounded glasshouse with smoothly sloped front and rear screens. */
export function glasshouse(v:VehicleSpec){const key=v.id+':glass';if(cache.has(key))return cache.get(key)!;const f=form(v),verts:number[]=[],idx:number[]=[];
 const sections=[[f.backBase,f.belt+.01,.42],[f.backRoof,f.roof-.045,.345],[f.frontRoof,f.roof-.03,.345],[f.frontBase,f.belt+.02,.42]];
 const n=9;for(const [x,top,width] of sections){for(let j=0;j<n;j++){const t=j/(n-1)*Math.PI;verts.push(x,f.belt+(top-f.belt)*Math.sin(t)**.28,Math.cos(t)*v.width*width);}}
 for(let i=1;i<sections.length;i++)for(let j=0;j<n-1;j++){const a=(i-1)*n+j,b=i*n+j;idx.push(a,b,b+1,a,b+1,a+1);}
 const g=indexed(verts,idx);cache.set(key,g);return g;
}
export function roofPanel(v:VehicleSpec){const f=form(v),length=f.frontRoof-f.backRoof+.08;return rounded([length,.065,v.width*.7],.03);}
export function vehicleTrim(v:VehicleSpec){const key=v.id+':trim';if(cache.has(key))return cache.get(key)!;const f=form(v),parts:BufferGeometry[]=[];
 for(const s of [-1,1]){
  // A and C pillars, slim B pillar and lower window surround.
  parts.push(tube([[f.frontBase,f.belt+.02,s*v.width*.42],[f.frontRoof+.025,f.roof-.055,s*v.width*.345]],.035));
  if(v.body!=='roadster'){
   parts.push(tube([[f.backBase,f.belt+.015,s*v.width*.42],[f.backRoof-.02,f.roof-.06,s*v.width*.345]],.046));
   parts.push(tube([[(f.frontRoof+f.backRoof)/2,f.belt+.035,s*v.width*.42],[(f.frontRoof+f.backRoof)/2,f.roof-.05,s*v.width*.345]],.027));
   parts.push(tube([[f.backRoof,f.roof-.03,s*v.width*.34],[f.frontRoof,f.roof-.02,s*v.width*.34]],.025));
  }
  parts.push(tube([[f.backBase,f.belt+.005,s*v.width*.424],[f.frontBase,f.belt+.015,s*v.width*.424]],.016));
 }
 const g=join(parts);cache.set(key,g);return g;
}
export function archTrim(v:VehicleSpec){const key=v.id+':arch';if(cache.has(key))return cache.get(key)!;const f=form(v),parts:BufferGeometry[]=[];
 for(const x of [-v.wheelbase/2,v.wheelbase/2])for(const s of [-1,1]){const points:Point[]=[];for(let i=0;i<=16;i++){const a=Math.PI*i/16;points.push([x+Math.cos(a)*(f.r+.068),f.r+Math.sin(a)*(f.r+.068),s*v.width*.493]);}parts.push(tube(points,.021));}
 const g=join(parts);cache.set(key,g);return g;
}
const wheels=new Map<number,{tire:BufferGeometry;rim:BufferGeometry;disc:BufferGeometry}>();
export function wheelGeometry(r:number){const found=wheels.get(r);if(found)return found;const parts:BufferGeometry[]=[],rims:BufferGeometry[]=[];
 const barrel=new CylinderGeometry(r*.975,r*.975,.16,32,1,true);barrel.rotateX(Math.PI/2);parts.push(barrel);
 for(const side of [-1,1]){
  const wall=new TorusGeometry(r*.79,r*.21,10,32);wall.scale(1,1,.46);wall.translate(0,0,side*.08);parts.push(wall);
  const lip=new TorusGeometry(r*.62,.012,6,32);lip.translate(0,0,side*.105);rims.push(lip);
  for(let i=0;i<10;i++){const spoke=new BoxGeometry(r*.06,r*.57,.025);spoke.translate(r*.075,r*.3,side*.11);spoke.rotateZ(i*Math.PI/5);rims.push(spoke);}
  const hub=new CylinderGeometry(r*.14,r*.14,.035,16);hub.rotateX(Math.PI/2);hub.translate(0,0,side*.11);rims.push(hub);
 }
 const disc=new CylinderGeometry(r*.52,r*.52,.07,32);disc.rotateX(Math.PI/2);
 const result={tire:join(parts),rim:join(rims),disc};wheels.set(r,result);return result;
}
/** Distant wheels share one low-segment mesh; close models keep animated rims. */
export function distantWheels(v:VehicleSpec){const key=v.id+':distant-wheels';if(cache.has(key))return cache.get(key)!;const bike=v.category==='Motorcycles',r=bike?(v.body==='cruiser'?.32:v.body==='offroad'?.4:.34):form(v).r,parts:BufferGeometry[]=[];
 for(const x of [-v.wheelbase/2,v.wheelbase/2])for(const s of bike?[0]:[-1,1]){const wheel=new CylinderGeometry(r,r,bike?.17:.24,12);wheel.rotateX(Math.PI/2);wheel.translate(x,r,s*(v.width/2-.14));parts.push(wheel);}
 const geometry=join(parts);cache.set(key,geometry);return geometry;
}
