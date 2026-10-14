// Real-browser HUD audit: every visible HUD widget must stay on screen and must
// not overlap another widget, at several viewport sizes and in situations that
// show contextual prompts (shop counter, beside a car, at a ladder).
// Findings are printed as GitHub annotations. HUD_STRICT=1 makes them fatal.
import {createServer} from 'vite';
import {freshLiving,BUSINESSES} from '../shared/livingCity.mjs';
import {PARKED_CARS} from '../shared/world.mjs';
import {ROOFTOP_LADDERS} from '../shared/verticalTraversal.mjs';
const {chromium}=await import(process.env.NPC_LIFE_PLAYWRIGHT_MODULE||'playwright');
const strict=process.env.HUD_STRICT==='1';
const VIEWPORTS=[[1366,768],[1100,720],[800,600],[390,844]];
const car=PARKED_CARS[0];
const SCENES=[
 {name:'start'},
 {name:'shop-counter',at:{x:BUSINESSES[0].x,z:BUSINESSES[0].z}},
 {name:'beside-car',at:{x:car.x+Math.sin(car.rotation)*1.9,z:car.z+Math.cos(car.rotation)*1.9}},
 {name:'ladder',at:{x:ROOFTOP_LADDERS[0].x,z:ROOFTOP_LADDERS[0].z}},
];
const vite=await createServer({server:{host:'127.0.0.1',port:5202,strictPort:true,hmr:false}});
await vite.listen();
let browser,problems=0;
const errors=[];
const report=(level,title,message)=>{console.log(`::${level} title=${title}::${message.replace(/%/g,'%25').replace(/\n/g,'%0A')}`);if(level==='error')problems++;};
try{
 browser=await chromium.launch({headless:true,...(process.env.NPC_LIFE_CHROMIUM?{executablePath:process.env.NPC_LIFE_CHROMIUM}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const [width,height] of VIEWPORTS){
  const page=await browser.newPage({viewport:{width,height}});
  page.setDefaultTimeout(60000);
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(living=>{localStorage.setItem('npc-life:living-city-v1',JSON.stringify({...living,quality:'low',autoResolution:false,cinematic:false}));window.__npcPosition={x:0,z:0,y:0};window.addEventListener('npc-life:position',e=>{window.__npcPosition=e.detail;});},freshLiving());
  await page.goto('http://127.0.0.1:5202');
  await page.getByRole('button',{name:'Skip, I live here already'}).click();
  await page.waitForFunction(()=>Number.isFinite(window.__npcPosition?.x)&&window.__npcPosition.x!==0);
  const findings=[];
  for(const scene of SCENES){
   if(scene.at){
    await page.evaluate(p=>window.dispatchEvent(new CustomEvent('npc-life:relocate',{detail:p})),scene.at);
    await page.waitForFunction(p=>Math.hypot(window.__npcPosition.x-p.x,window.__npcPosition.z-p.z)<.6,scene.at,{timeout:30000});
   }
   await page.waitForTimeout(700);
   const found=await page.evaluate(()=>{
    const shell=document.querySelector('.game-shell');
    const vw=innerWidth,vh=innerHeight,widgets=[];
    const visible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>.05&&r.width>2&&r.height>2;};
    for(const e of shell.querySelectorAll('*')){
     if(e.closest('[role="dialog"],.game-dialog,canvas'))continue;
     const s=getComputedStyle(e);
     if(s.position!=='absolute'&&s.position!=='fixed')continue;
     if(!visible(e))continue;
     const r=e.getBoundingClientRect();
     if(r.width>=vw*.9&&r.height>=vh*.9)continue; // full-screen layers
     widgets.push({e,r});
    }
    // Keep top-level widgets only: positioned descendants belong to their widget.
    const top=widgets.filter(w=>!widgets.some(o=>o!==w&&o.e.contains(w.e)));
    const label=e=>(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/)[0]:e.tagName.toLowerCase());
    const overlaps=[],offscreen=[];
    for(let i=0;i<top.length;i++){
     const a=top[i].r;
     if(a.left<-1||a.top<-1||a.right>vw+1||a.bottom>vh+1)offscreen.push(label(top[i].e));
     for(let j=i+1;j<top.length;j++){
      const b=top[j].r,x=Math.min(a.right,b.right)-Math.max(a.left,b.left),y=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
      if(x>4&&y>4)overlaps.push(`${label(top[i].e)} × ${label(top[j].e)} (${Math.round(x)}×${Math.round(y)}px)`);
     }
    }
    return {count:top.length,widgets:top.map(w=>label(w.e)),overlaps,offscreen};
   });
   const where=`${width}x${height} ${scene.name}`;
   console.log(`${where}: ${found.count} widgets [${found.widgets.join(' ')}]`);
   for(const o of found.overlaps)findings.push(`${scene.name}: overlap ${o}`);
   for(const o of found.offscreen)findings.push(`${scene.name}: off-screen ${o}`);
   if(!found.overlaps.length&&!found.offscreen.length)console.log(`PASS ${where}: no overlap, all on screen`);
  }
  if(findings.length)report(strict?'error':'warning',`HUD ${width}x${height}: ${findings.length} problems`,findings.join('\n'));
  else console.log(`::notice title=HUD ${width}x${height}::no overlaps in ${SCENES.length} scenes`);
  await page.close();
 }
 if(errors.length)report('error','Browser exception',errors.slice(0,3).join(' | '));
 console.log(`HUD audit finished: ${problems} fatal problems`);
 if(problems)process.exitCode=1;
}finally{
 await browser?.close();
 await vite.close();
}
