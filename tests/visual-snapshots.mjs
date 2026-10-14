// Visual review snapshots for development branches. JPEG screenshots of fixed
// locations are written to SNAPSHOT_DIR; CI publishes each as a neutral check run
// so reviewers without artifact access can inspect layout, density and lighting.
// Usage: node tests/visual-snapshots.mjs [name ...]
import {createServer} from 'vite';
import {mkdirSync,writeFileSync} from 'node:fs';
import {freshLiving} from '../shared/livingCity.mjs';
import {ROOFTOP_LADDERS} from '../shared/verticalTraversal.mjs';
import {PARKED_CARS} from '../shared/world.mjs';
const {chromium}=await import(process.env.NPC_LIFE_PLAYWRIGHT_MODULE||'playwright');
const car=PARKED_CARS[0];
const SHOTS=[
 {name:'spawn',at:{x:6.4,z:16},yaw:0},
 {name:'civic-crossing',at:{x:0,z:6},yaw:Math.PI},
 {name:'midtown',at:{x:0,z:-263},yaw:0},
 {name:'brooklyn-row',at:{x:260,z:-307},yaw:Math.PI/2},
 {name:'uptown',at:{x:0,z:-432},yaw:0},
 {name:'car-roof',at:{x:car.x+Math.sin(car.rotation)*2.2,z:car.z+Math.cos(car.rotation)*2.2},yaw:car.rotation+Math.PI},
 {name:'rooftop',at:{x:ROOFTOP_LADDERS[0].x,z:ROOFTOP_LADDERS[0].z},climb:true},
 {name:'night-midtown',at:{x:0,z:-263},yaw:Math.PI/2,minute:22*60},
];
const wanted=process.argv.slice(2);
const OUT=process.env.SNAPSHOT_DIR||'snapshots';mkdirSync(OUT,{recursive:true});
const vite=await createServer({server:{host:'127.0.0.1',port:5203,strictPort:true,hmr:false}});
await vite.listen();
let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.NPC_LIFE_CHROMIUM?{executablePath:process.env.NPC_LIFE_CHROMIUM}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const shot of SHOTS.filter(s=>!wanted.length||wanted.includes(s.name))){
  const page=await browser.newPage({viewport:{width:640,height:400}});
  page.setDefaultTimeout(90000);
  const living={...freshLiving(),quality:'medium',autoResolution:false,cinematic:false};
  if(shot.minute)living.elapsed=(shot.minute-480+1440)%1440; // game clock starts at 08:00
  await page.addInitScript(l=>{localStorage.setItem('npc-life:living-city-v1',JSON.stringify(l));window.__npcPosition={x:0,z:0,y:0};window.addEventListener('npc-life:position',e=>{window.__npcPosition=e.detail;});},living);
  await page.goto('http://127.0.0.1:5203');
  await page.getByRole('button',{name:'Skip, I live here already'}).click();
  await page.waitForFunction(()=>Number.isFinite(window.__npcPosition?.x)&&window.__npcPosition.x!==0);
  await page.evaluate(p=>window.dispatchEvent(new CustomEvent('npc-life:relocate',{detail:p})),shot.at);
  await page.waitForFunction(p=>Math.hypot(window.__npcPosition.x-p.x,window.__npcPosition.z-p.z)<.6,shot.at,{timeout:30000});
  if(shot.climb){await page.keyboard.down('e');await page.waitForFunction(()=>window.__npcPosition.support?.startsWith('building:'),null,{timeout:90000}).catch(()=>{});await page.keyboard.up('e');}
  if(shot.name==='car-roof'){
   // Run at the car and jump: verifies the new climb onto vehicles in a real browser.
   // W moves along the camera's forward vector (-sin yaw, -cos yaw): start 3.4 m behind the car on that line.
   const yaw=await page.evaluate(()=>window.__npcPosition.cameraYaw||0);
   const start={x:car.x+Math.sin(yaw)*3.4,z:car.z+Math.cos(yaw)*3.4};
   await page.evaluate(p=>window.dispatchEvent(new CustomEvent('npc-life:relocate',{detail:p})),start);
   await page.waitForFunction(p=>Math.hypot(window.__npcPosition.x-p.x,window.__npcPosition.z-p.z)<.6,start,{timeout:30000});
   await page.evaluate(()=>{window.__trace=[];window.__traceTimer=setInterval(()=>{const p=window.__npcPosition;window.__trace.push([+p.x.toFixed(2),+p.z.toFixed(2),+(p.y||0).toFixed(2),p.support||'',p.locomotion||'']);},100);});
   await page.keyboard.down('w');await page.waitForTimeout(350);await page.keyboard.press('Space');
   await page.waitForFunction(()=>window.__npcPosition.support?.startsWith('vehicle:'),null,{timeout:3000}).catch(()=>{});
   await page.waitForTimeout(300);await page.keyboard.up('w');
   const trace=await page.evaluate(()=>{clearInterval(window.__traceTimer);return window.__trace;});
   const supports=[...new Set(trace.map(t=>t[3]).filter(Boolean))];
   console.log(`::notice title=car climb trace::car=${car.x},${car.z} yaw=${yaw.toFixed(2)} start=${start.x.toFixed(1)},${start.z.toFixed(1)} maxY=${Math.max(...trace.map(t=>t[2]))} supports=${supports.join('|')} path=${JSON.stringify(trace.filter((_,i)=>i%2===0).slice(0,18))}`);
  }
  await page.waitForTimeout(2500);
  const jpeg=await page.screenshot({type:'jpeg',quality:60});
  writeFileSync(`${OUT}/${shot.name}.jpg`,jpeg);
  console.log(`snapshot ${shot.name}: ${jpeg.length} bytes`);
  await page.close();
 }
}finally{
 await browser?.close();
 await vite.close();
}
