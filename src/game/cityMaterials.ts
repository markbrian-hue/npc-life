import {CanvasTexture,RepeatWrapping,SRGBColorSpace} from 'three';
const cache=new Map<string,CanvasTexture>();
/** Deterministic original texture tiles generated locally, no downloaded assets. */
export function cityTexture(kind:string){const prior=cache.get(kind);if(prior)return prior;const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d')!;c.fillStyle=kind==='asphalt'?'#939997':kind==='paving'?'#d1cbbb':'#dad8d0';c.fillRect(0,0,256,256);
 for(let i=0;i<5000;i++){const x=(i*73.173)%256,y=(i*151.97)%256,v=kind==='asphalt'?95+i%70:180+i%55;c.fillStyle=`rgba(${v},${v},${v},.18)`;c.fillRect(x,y,1+i%2,1+i%2);}
 c.strokeStyle=kind==='paving'?'#777e7660':'#68747224';c.lineWidth=1;
 if(kind!=='asphalt')for(let y=0;y<256;y+=kind==='paving'?64:32){c.beginPath();c.moveTo(0,y);c.lineTo(256,y);c.stroke();for(let x=(y/32%2)*32;x<256;x+=64){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+(kind==='paving'?64:32));c.stroke();}}
 const t=new CanvasTexture(canvas);t.wrapS=t.wrapT=RepeatWrapping;t.colorSpace=SRGBColorSpace;t.anisotropy=4;cache.set(kind,t);return t;}
