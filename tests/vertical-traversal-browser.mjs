import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {ROOFTOP_LADDERS} from '../shared/verticalTraversal.mjs';
const {chromium}=await import(process.env.NPC_LIFE_PLAYWRIGHT_MODULE||'playwright');
const vite=await createServer({server:{host:'127.0.0.1',port:5201,strictPort:true,hmr:false}});
await vite.listen();
let browser;
const errors=[];
try{
 browser=await chromium.launch({headless:true,...(process.env.NPC_LIFE_CHROMIUM?{executablePath:process.env.NPC_LIFE_CHROMIUM}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 page.setDefaultTimeout(60000);
 page.on('pageerror',e=>errors.push(e.message));
 page.addInitScript(()=>{window.__npcPosition={x:0,z:0,y:0};window.addEventListener('npc-life:position',e=>{window.__npcPosition=e.detail;});});
 await page.goto('http://127.0.0.1:5201');
 await page.getByRole('button',{name:'Skip, I live here already'}).click();
 await page.waitForFunction(()=>window.__npcPosition.x!==0);
 const ladder=ROOFTOP_LADDERS[0];
 await page.evaluate(p=>window.dispatchEvent(new CustomEvent('npc-life:relocate',{detail:{x:p.x,z:p.z}})),ladder);
 await page.waitForFunction(p=>Math.hypot(window.__npcPosition.x-p.x,window.__npcPosition.z-p.z)<.25,ladder);
 const scene=await page.evaluate(async()=>{
  const url=performance.getEntriesByType('resource').find(r=>r.name.includes('/@react-three_fiber.js?'))?.name;
  if(!url)return null;
  const {_roots}=await import(url);
  const root=[..._roots.values()][0];
  const object=root.store.getState().scene.getObjectByName('roof-access-ladders');
  return {found:!!object,instances:object?.count??0};
 });
 assert.ok(scene?.found&&scene.instances>20,'instanced ladder geometry present');
 console.log('PASS ladder visuals exist in actual R3F scene');
 await page.keyboard.down('e');
 await page.waitForFunction(p=>window.__npcPosition.y>p.roof-.15,ladder,{timeout:30000});
 await page.waitForFunction(p=>Math.abs(window.__npcPosition.y-p.roof)<.12&&Math.hypot(window.__npcPosition.x-p.landing.x,window.__npcPosition.z-p.landing.z)<.5,ladder,{timeout:12000});
 await page.keyboard.up('e');
 console.log('PASS climb + timed mantle reaches authored roof in real browser');
 const before=await page.evaluate(()=>window.__npcPosition);
 await page.waitForTimeout(800);
 const after=await page.evaluate(()=>window.__npcPosition);
 assert.ok(Math.abs(after.y-ladder.roof)<.12,'stable rooftop support');
 assert.ok(Math.hypot(after.x-before.x,after.z-before.z)<.15,'no unexplained horizontal drift');
 console.log('PASS player stands stably on roof');
 assert.deepEqual(errors,[],'no browser runtime exceptions');
 console.log('3 actual-browser traversal checks passed');
}finally{
 await browser?.close();
 await vite.close();
}
