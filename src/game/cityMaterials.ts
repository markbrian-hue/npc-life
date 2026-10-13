import {CanvasTexture,RepeatWrapping,SRGBColorSpace,ShaderChunk,type MeshStandardMaterial} from 'three';
type Maps={map:CanvasTexture;bumpMap:CanvasTexture;roughnessMap:CanvasTexture};
const cache=new Map<string,Maps>();
const tones:Record<string,number[]>={asphalt:[66,71,74],paving:[166,166,154],masonry:[179,167,147],brick:[145,93,70],concrete:[169,174,169],grass:[99,117,68],gravel:[153,141,115],bark:[105,87,68],paint:[231,227,207],office:[95,117,123]};
/** Original deterministic albedo, height and roughness tiles. All generated locally. */
export function cityMaps(kind:string):Maps{
 const found=cache.get(kind);if(found)return found;
 const size=512,canvas=document.createElement('canvas'),height=document.createElement('canvas'),rough=document.createElement('canvas');for(const c of [canvas,height,rough])c.width=c.height=size;
 const ctx=canvas.getContext('2d')!,h=height.getContext('2d')!,r=rough.getContext('2d')!,data=ctx.createImageData(size,size),hd=h.createImageData(size,size),rd=r.createImageData(size,size),tone=tones[kind]||tones.concrete;
 let seed=6139;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,n=random(),grain=(n-.5)*(kind==='asphalt'?28:kind==='grass'?34:12),broad=Math.sin(x*.065)*Math.cos(y*.043)*3;
  for(let k=0;k<3;k++){data.data[i+k]=tone[k]+grain+broad;hd.data[i+k]=127+grain*2;rd.data[i+k]=kind==='asphalt'?180+n*60:205+n*40;}data.data[i+3]=hd.data[i+3]=rd.data[i+3]=255;
 }
 ctx.putImageData(data,0,0);h.putImageData(hd,0,0);r.putImageData(rd,0,0);
 if(['paving','masonry','brick','concrete'].includes(kind)){
  const brick=kind==='brick'||kind==='masonry',tileW=brick?128:128,tileH=brick?42:128;
  for(let row=-1;row<size/tileH+1;row++)for(let col=-1;col<size/tileW+1;col++){
   const x=col*tileW+(brick&&row%2?tileW/2:0),y=row*tileH;
   ctx.fillStyle=`rgba(35,38,35,${brick?.24:.14})`;ctx.fillRect(x,y,tileW,brick?3:2);ctx.fillRect(x,y,brick?3:2,tileH);
   ctx.fillStyle='rgba(242,235,209,.15)';ctx.fillRect(x+3,y+3,tileW-5,1);h.fillStyle='#474747';h.fillRect(x,y,tileW,3);h.fillRect(x,y,3,tileH);h.fillStyle='#b0b0b0';h.fillRect(x+3,y+3,tileW-6,1);
   ctx.fillStyle=`rgba(${random()>.5?'241,226,204':'38,40,37'},${.025+random()*.07})`;ctx.fillRect(x+4,y+4,tileW-7,tileH-7);
  }
 }
 if(kind==='asphalt'||kind==='gravel')for(let i=0;i<17;i++){
  const x=random()*size,y=random()*size,rad=10+random()*50,gradient=ctx.createRadialGradient(x,y,0,x,y,rad);gradient.addColorStop(0,'rgba(12,19,23,.10)');gradient.addColorStop(1,'rgba(12,19,23,0)');ctx.fillStyle=gradient;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);
 }
 if(kind==='grass')for(let i=0;i<7000;i++){const x=random()*size,y=random()*size;ctx.strokeStyle=random()>.5?'#65724665':'#9ca36c60';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(random()-.5)*5,y-2-random()*5);ctx.stroke();}
 if(kind==='bark')for(let i=0;i<150;i++){const x=random()*size;ctx.strokeStyle='#372e2560';ctx.lineWidth=1+random()*3;ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+random()*25,170,x-random()*20,330,x,512);ctx.stroke();}
 if(kind==='office')for(let y=0;y<512;y+=32)for(let x=0;x<512;x+=24){ctx.fillStyle=random()>.8?'#a7a98b':'#51676e';ctx.fillRect(x+1,y+2,22,28);ctx.fillStyle='#8e9b9b';ctx.fillRect(x,y,1,32);ctx.fillRect(x,y,24,2);ctx.fillStyle='#80939866';ctx.fillRect(x+3,y+4,18,8);}
 const make=(c:HTMLCanvasElement,color=false)=>{const t=new CanvasTexture(c);t.wrapS=t.wrapT=RepeatWrapping;t.anisotropy=8;if(color)t.colorSpace=SRGBColorSpace;return t;};
 const result={map:make(canvas,true),bumpMap:make(height),roughnessMap:make(rough)};cache.set(kind,result);return result;
}
export const cityTexture=(kind:string)=>cityMaps(kind).map;
/** World-space UVs keep instanced masonry at a constant physical scale. */
export function worldMapping(material:MeshStandardMaterial,scale=.32){
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vSurfacePosition; varying vec3 vSurfaceNormal;');
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`vec4 surfacePosition=vec4(transformed,1.0);vec3 surfaceNormal=normal;\n#ifdef USE_INSTANCING\nsurfacePosition=instanceMatrix*surfacePosition;surfaceNormal=mat3(instanceMatrix)*surfaceNormal;\n#endif\nvSurfacePosition=(modelMatrix*surfacePosition).xyz;vSurfaceNormal=normalize(mat3(modelMatrix)*surfaceNormal);\n#include <project_vertex>`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>\nvarying vec3 vSurfacePosition; varying vec3 vSurfaceNormal;vec2 surfaceUV(){vec3 n=abs(vSurfaceNormal);return (n.y>n.x&&n.y>n.z?vSurfacePosition.xz:n.x>n.z?vSurfacePosition.zy:vSurfacePosition.xy)*${scale.toFixed(4)};}`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',ShaderChunk.map_fragment.replaceAll('vMapUv','surfaceUV()')).replace('#include <roughnessmap_fragment>',ShaderChunk.roughnessmap_fragment.replaceAll('vRoughnessMapUv','surfaceUV()')).replace('#include <bumpmap_pars_fragment>',ShaderChunk.bumpmap_pars_fragment.replaceAll('vBumpMapUv','surfaceUV()'));
 };material.customProgramCacheKey=()=>`world-map:${scale}`;
}
export function interiorTexture(){const key='interior';const found=cache.get(key);if(found)return found.map;const c=document.createElement('canvas');c.width=128;c.height=192;const g=c.getContext('2d')!;
 const gradient=g.createLinearGradient(0,0,0,192);gradient.addColorStop(0,'#14272b');gradient.addColorStop(.6,'#7f8171');gradient.addColorStop(1,'#383d39');g.fillStyle=gradient;g.fillRect(0,0,128,192);
 g.fillStyle='#b2a080';g.beginPath();g.moveTo(0,0);g.lineTo(28,30);g.lineTo(100,30);g.lineTo(128,0);g.fill();g.fillStyle='#3b5353';g.fillRect(28,30,72,120);
 g.fillStyle='#9a907b';g.fillRect(26,30,5,120);g.fillRect(98,30,4,120);g.fillStyle='#afa28a';g.fillRect(32,146,64,4);g.fillStyle='#60534a';g.fillRect(42,116,43,29);g.fillStyle='#cab995';g.fillRect(38,110,51,8);
 g.fillStyle='#ece0b8';g.fillRect(48,37,30,5);g.fillStyle='#b4ae9650';for(let x=3;x<125;x+=8)g.fillRect(x,4,3,175);g.fillStyle='#243d4350';g.fillRect(0,0,128,192);
 const map=new CanvasTexture(c);map.colorSpace=SRGBColorSpace;const result={map,bumpMap:map,roughnessMap:map};cache.set(key,result);return map;}
