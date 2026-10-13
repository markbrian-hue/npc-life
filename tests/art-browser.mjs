import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createServer} from 'vite';
import {freshLiving,environmentAt} from '../shared/livingCity.mjs';
const {chromium}=await import(process.env.NPC_LIFE_PLAYWRIGHT_MODULE||'playwright');
const output=process.env.NPC_LIFE_QA_OUTPUT||'qa-output';await mkdir(output,{recursive:true});
const vite=await createServer({server:{hmr:false,host:'127.0.0.1',port:5190,strictPort:true}});await vite.listen();let browser;const errors=[];
try{
 browser=await chromium.launch({headless:true,...(process.env.NPC_LIFE_CHROMIUM?{executablePath:process.env.NPC_LIFE_CHROMIUM}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const state={...freshLiving(),elapsed:120,seed:17};while(environmentAt(state.elapsed,state.seed).kind!=='sunny')state.seed++;
 await page.addInitScript(state=>{const override=sessionStorage.getItem('art-fixture');localStorage.setItem('npc-life:living-city-v1',override||JSON.stringify(state));window.__pos={x:0,z:0};window.addEventListener('npc-life:position',e=>window.__pos=e.detail);},state);
 await page.goto('http://127.0.0.1:5190');await page.getByRole('button',{name:'Skip, I live here already'}).click({timeout:60000});await page.waitForFunction(()=>window.__pos.x!==0);await page.waitForTimeout(2500);
 await page.screenshot({path:`${output}/art-city-day.jpg`,type:'jpeg',quality:90,timeout:90000});
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('npc-life:relocate',{detail:{x:-22,z:9.8}})));await page.waitForTimeout(1500);await page.screenshot({path:`${output}/art-car-street.jpg`,type:'jpeg',quality:90,timeout:90000});
 await page.mouse.move(700,500);await page.mouse.down();await page.mouse.move(450,550,{steps:20});await page.mouse.up();await page.waitForTimeout(1000);await page.screenshot({path:`${output}/art-street-sky.jpg`,type:'jpeg',quality:90,timeout:90000});

 const metrics=await page.evaluate(async()=>{const {_roots}=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('/@react-three_fiber.js?')).name);const state=[..._roots.values()][0].store.getState();const {gl,scene,camera}=state;window.__artState=state;let detailed=0,distant=0;scene.traverse(o=>{if(o.name==='vehicle-detail'&&o.visible)detailed++;if(o.name==='vehicle-distant'&&o.visible)distant++;});return {calls:gl.info.render.calls,triangles:gl.info.render.triangles,textures:gl.info.memory.textures,environment:!!scene.environment,tone:gl.toneMapping,exposure:gl.toneMappingExposure,detailed,distant,camera:camera.position.toArray()};});assert.ok(metrics.detailed>0&&metrics.distant>0);console.log('PASS near and distant vehicle detail levels',metrics);
 await page.evaluate(()=>window.__artState.setFrameloop('never'));await page.waitForTimeout(250);
 await page.evaluate(()=>{const {gl,scene,camera}=window.__artState;camera.position.set(-20,2.0,3.0);camera.lookAt(-25,.9,7.8);gl.render(scene,camera);document.querySelectorAll('.game-shell > :not(div:first-child)').forEach(e=>{if(!e.querySelector('canvas')&&!e.matches('canvas'))e.style.visibility='hidden';});});
 await page.screenshot({path:`${output}/art-car-close.jpg`,type:'jpeg',quality:90,timeout:90000});
 await page.evaluate(()=>{const {gl,scene,camera}=window.__artState;camera.position.set(-29,2.1,3.2);camera.lookAt(-25,.85,7.8);gl.render(scene,camera);});
 await page.screenshot({path:`${output}/art-car-rear.jpg`,type:'jpeg',quality:90,timeout:90000});
 await page.evaluate(()=>{const {gl,scene,camera}=window.__artState;camera.position.set(-43,2.1,1.8);camera.lookAt(-5,4.5,0);gl.render(scene,camera);});
 await page.screenshot({path:`${output}/art-avenue.jpg`,type:'jpeg',quality:90,timeout:90000});
 await page.evaluate(()=>{const {gl,scene,camera}=window.__artState;camera.position.set(-43,2.1,1.8);camera.lookAt(-5,23,0);gl.render(scene,camera);});
 await page.screenshot({path:`${output}/art-sky.jpg`,type:'jpeg',quality:90,timeout:90000});

 await page.evaluate(()=>{document.querySelectorAll('.game-shell > *').forEach(e=>{e.style.visibility='';});});await page.keyboard.press('u');const garage=page.getByRole('dialog',{name:'Motor Club dealership'});await garage.getByRole('button',{name:'Premium',exact:true}).click();await garage.getByRole('button',{name:'Inspect Vireo Apex',exact:true}).click();const preview=page.getByRole('region',{name:'Vireo Apex 3D preview'});await preview.waitFor();await page.waitForTimeout(1800);
 const box=await preview.boundingBox();assert.ok(box.y>=0&&box.y+box.height<=900,'Inspect brings the model into the visible dialog');
 const before=await page.evaluate(async()=>{const {_roots}=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('/@react-three_fiber.js?')).name);window.__showroom=_roots.get(document.querySelector('.vehicle-preview canvas')).store.getState();return window.__showroom.camera.position.toArray();});
 await page.mouse.move(box.x+box.width*.6,box.y+box.height*.45);await page.mouse.down();await page.mouse.move(box.x+box.width*.3,box.y+box.height*.5,{steps:8});await page.mouse.up();await page.waitForTimeout(500);const after=await page.evaluate(()=>window.__showroom.camera.position.toArray());assert.ok(Math.hypot(...after.map((v,i)=>v-before[i]))>.5,'drag rotates the real model even with React strict effects');
 await page.screenshot({path:`${output}/art-hyper-showroom.jpg`,type:'jpeg',quality:90,timeout:90000});await page.keyboard.press('Escape');console.log('PASS locked premium model preview is visible and responds to actual pointer drag');
 for(const [label,kind,elapsed,quality] of [['night','sunny',840,'medium'],['rain','heavy-rain',120,'medium'],['high','sunny',120,'high']]){
  const fixture={...freshLiving(),elapsed,quality,seed:1};while(environmentAt(elapsed,fixture.seed).kind!==kind)fixture.seed++;
  await page.evaluate(s=>sessionStorage.setItem('art-fixture',JSON.stringify(s)),fixture);await page.setViewportSize({width:1100,height:720});await page.reload();await page.getByRole('dialog',{name:'NPC LIFE game menu'}).waitFor();await page.keyboard.press('Escape');await page.waitForFunction(()=>window.__pos.x!==0,null,{timeout:60000});await page.waitForTimeout(2200);
  const info=await page.evaluate(async()=>{const {_roots}=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('/@react-three_fiber.js?')).name);const {scene,gl}=[..._roots.values()][0].store.getState();const sky=scene.children.find(o=>o.isSky),road=scene.getObjectByName('surface:asphalt');return {night:sky.material.uniforms.nightAmount.value,rain:sky.material.uniforms.rainfall.value,roughness:road.material.roughness,environment:!!scene.environment,draws:gl.info.render.calls};});
  assert.ok(info.environment);if(label==='night')assert.ok(info.night>.9);if(label==='rain'){assert.ok(info.rain>.6);assert.ok(info.roughness<.5);}await page.screenshot({path:`${output}/art-${label}.jpg`,type:'jpeg',quality:90,timeout:90000});console.log('PASS',label,'sky, materials and graphics preset',info);
  if(label==='night'){
   await page.evaluate(()=>window.dispatchEvent(new CustomEvent('npc-life:relocate',{detail:{x:9.9,z:33}})));await page.waitForFunction(()=>Math.hypot(window.__pos.x-9.9,window.__pos.z-33)<.1);await page.keyboard.press('r');await page.waitForFunction(()=>window.__pos.driving===true);
   const lights=await page.evaluate(async()=>{const {_roots}=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('/@react-three_fiber.js?')).name);const {scene}=[..._roots.values()][0].store.getState(),lights=[];scene.traverse(o=>{if(o.isSpotLight&&o.visible&&o.intensity>0)lights.push({distance:o.distance,target:o.target.position.distanceTo(o.position)});});return lights;});assert.equal(lights.length,2);assert.ok(lights.every(l=>l.distance>20&&l.target>10));await page.screenshot({path:`${output}/art-night-driving.jpg`,type:'jpeg',quality:90,timeout:90000});await page.keyboard.press('r');await page.waitForFunction(()=>window.__pos.driving===false);console.log('PASS entering a vehicle at night activates actual forward headlights');
  }
  if(label==='high'){
   await page.getByRole('button',{name:'Living city settings',exact:true}).click();for(const quality of ['low','high','medium']){await page.getByLabel('Graphics quality').selectOption(quality);await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('npc-life:living-city-v1')).quality),quality);}await page.keyboard.press('Escape');console.log('PASS graphics effects can be enabled, disabled and re-enabled without reloading');
  }
 }
 console.log('BROWSER ERRORS',errors);assert.deepEqual(errors,[]);console.log('PASS actual city, car and sky render without shader/runtime errors');
}finally{await browser?.close();await vite.close();}
