import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {freshLiving} from '../shared/livingCity.mjs';
const {chromium}=await import(process.env.NPC_LIFE_PLAYWRIGHT_MODULE||'playwright');
const vite=await createServer({server:{hmr:false,host:'127.0.0.1',port:5196,strictPort:true}});await vite.listen();let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.NPC_LIFE_CHROMIUM?{executablePath:process.env.NPC_LIFE_CHROMIUM}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1100,height:720}}),errors=[];page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(s=>localStorage.setItem('npc-life:living-city-v1',JSON.stringify(s)),{...freshLiving(),elapsed:120,seed:17,quality:'medium',autoResolution:false});
 await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:'Skip, I live here already'}).click();await page.waitForTimeout(3500);
 const metrics=await page.evaluate(async()=>{
  const {_roots}=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('/@react-three_fiber.js?')).name),store=[..._roots.values()][0].store,state=store.getState();
  state.setFrameloop('never');await new Promise(r=>setTimeout(r,100));const {gl,scene,camera}=state;gl.setPixelRatio(1);gl.info.autoReset=false;gl.shadowMap.autoUpdate=true;
  let pose=null,time=state.clock.elapsedTime;const setPose=()=>{if(pose){camera.position.set(...pose[0]);camera.lookAt(...pose[1]);camera.updateMatrixWorld();}};
  const before=state.internal.subscribe({current:setPose},-100,store),after=state.internal.subscribe({current:setPose},.9,store);
  const samples=[];
  for(const [name,pos,look] of [['civic',[15,12,27],[6,1,16]],['avenue',[-43,2.1,1.8],[-5,4.5,0]],['north',[8,10,-102],[0,1,-130]]]){
   pose=[pos,look];state.advance(time+=1/60,false);gl.getContext().finish();
   const times=[];let draws=0,triangles=0;
   for(let i=0;i<5;i++){gl.info.reset();const start=performance.now();state.advance(time+=1/60,false);gl.getContext().finish();times.push(performance.now()-start);draws=gl.info.render.calls;triangles=gl.info.render.triangles;}
   samples.push({name,draws,triangles,softwareRenderMs:Math.round(times.sort((a,b)=>a-b)[2])});
  }
  before();after();gl.info.autoReset=true;return {viewport:[1100,720],pixelRatio:1,contextLost:gl.getContext().isContextLost(),renderer:gl.getContext().getParameter(gl.getContext().RENDERER),samples};
 });
 assert.deepEqual(errors,[]);assert.equal(metrics.contextLost,false);if(process.env.NPC_PERF_LABEL!=='baseline')for(const sample of metrics.samples){assert.ok(sample.draws<1050,`${sample.name} exceeds draw budget`);assert.ok(sample.triangles<320000,`${sample.name} exceeds triangle budget`);}await mkdir('qa-output',{recursive:true});await writeFile(`qa-output/performance-${process.env.NPC_PERF_LABEL||'current'}.json`,JSON.stringify(metrics,null,2));console.log(JSON.stringify(metrics,null,2));
 if(process.env.NPC_PERF_LABEL!=='baseline'){
  await page.keyboard.press('x');const board=page.getByRole('dialog',{name:'Daily contracts and explorer passport'});await board.waitFor();assert.equal(await board.evaluate(el=>getComputedStyle(el).opacity),'1');await page.screenshot({path:'qa-output/explorer-board-final.jpg',type:'jpeg',quality:88,animations:'disabled',timeout:90000});await page.keyboard.press('Escape');
  await page.keyboard.press('u');const garage=page.getByRole('dialog',{name:'Motor Club dealership'});await garage.getByRole('button',{name:'Inspect Mica Hatch',exact:true}).click();const preview=page.getByRole('region',{name:'Mica Hatch 3D preview'});await preview.waitFor();await page.waitForTimeout(500);
  const before=await page.evaluate(async()=>{const {_roots}=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('/@react-three_fiber.js?')).name);window.__preview=_roots.get(document.querySelector('.vehicle-preview canvas')).store.getState();return window.__preview.camera.position.toArray();});const box=await preview.boundingBox();await page.mouse.move(box.x+box.width*.6,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.3,box.y+box.height*.5,{steps:8});await page.mouse.up();await page.waitForTimeout(1200);
  const after=await page.evaluate(()=>window.__preview.camera.position.toArray());assert.ok(Math.hypot(...after.map((v,i)=>v-before[i]))>.4);await page.waitForTimeout(1800);const idle=await page.evaluate(()=>({frame:window.__preview.gl.info.render.frame,mode:window.__preview.frameloop}));await page.waitForTimeout(500);const last=await page.evaluate(()=>window.__preview.gl.info.render.frame);assert.equal(idle.mode,'demand');assert.ok(last-idle.frame<5,'idle showroom stops drawing');console.log('PASS desktop explorer paint and on-demand showroom pointer controls');assert.deepEqual(errors,[]);
 }
}finally{await browser?.close();await vite.close();}
