import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createServer} from 'vite';
const {chromium}=await import(process.env.NPC_LIFE_PLAYWRIGHT_MODULE||'playwright');
const output=process.env.NPC_LIFE_QA_OUTPUT||'qa-output';await mkdir(output,{recursive:true});
const vite=await createServer({server:{host:'127.0.0.1',port:5183,strictPort:true}});await vite.listen();
let browser;const errors=[];let checks=0;const pass=s=>{checks++;console.log(`PASS ${s}`);};
try{
 browser=await chromium.launch({headless:true,...(process.env.NPC_LIFE_CHROMIUM?{executablePath:process.env.NPC_LIFE_CHROMIUM}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1100,height:760}});
 await context.addInitScript(()=>{
  if(!sessionStorage.getItem('foundation-seeded')){localStorage.setItem('npc-life:coins-v1','200');localStorage.setItem('npc-life:reputation-v1','50');sessionStorage.setItem('foundation-seeded','1');}
  window.__pos={x:0,z:0};window.addEventListener('npc-life:position',e=>window.__pos=e.detail);
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5183');await page.getByRole('button',{name:'Skip, I live here already'}).click();
 const record=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('npc-life:resident-life-v1')||'null'));
 const coins=()=>page.evaluate(()=>Number(localStorage.getItem('npc-life:coins-v1')));
 // Use the same relocation event as the shuttle and safe vehicle exits for isolated fixtures.
 const at=async(x,z)=>{await page.evaluate(p=>window.dispatchEvent(new CustomEvent('npc-life:relocate',{detail:p})),{x,z});await page.waitForFunction(p=>Math.hypot(window.__pos.x-p.x,window.__pos.z-p.z)<.1,{x,z});};
 await page.keyboard.press('l');await page.getByRole('dialog',{name:'Resident record'}).waitFor();await page.screenshot({path:`${output}/resident-record.png`});
 await page.locator('article').filter({hasText:'Go Buy Milk'}).getByRole('button',{name:'Take shift'}).click();await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
 await page.keyboard.press('t');assert.equal(await coins(),200,'no reward at wrong location');
 await at(-6,-16);await page.keyboard.press('t');assert.equal(await coins(),200,'pickup gives no money');
 await at(6,22);await page.keyboard.press('t');await page.waitForFunction(()=>Number(localStorage.getItem('npc-life:coins-v1'))===225);await page.keyboard.press('t');assert.equal(await coins(),225);assert.equal((await record()).completed.milk,1);pass('milk pickup/delivery awards once, only at correct stops');
 await page.keyboard.press('Escape');await page.keyboard.press('l');
 await page.locator('article').filter({hasText:'Motor Club licence'}).getByRole('button',{name:'Buy · 75 coins'}).click();assert.equal(await coins(),150);assert.ok((await record()).upgrades.includes('club'));pass('purchase spends exact balance and unlocks taxi shift');
 await page.locator('article').filter({hasText:'Five-Star Background Driver'}).getByRole('button',{name:'Take shift'}).click();
 await at(9.9,33);await page.keyboard.press('r');await page.waitForFunction(()=>window.__pos.driving===true).catch(async error=>{console.log('DRIVE DEBUG',await page.evaluate(()=>({position:window.__pos,vehicle:document.querySelector('.vehicle-hud')?.textContent,dialog:document.querySelector('dialog[open]')?.textContent})),errors);throw error;});const before=await page.evaluate(()=>window.__pos);
 await page.keyboard.down('w');await page.waitForFunction(p=>Math.hypot(window.__pos.x-p.x,window.__pos.z-p.z)>2,before);await page.keyboard.up('w');await page.keyboard.down('Space');await page.waitForTimeout(1000);await page.keyboard.up('Space');
 await page.keyboard.press('l');const parked=await page.evaluate(()=>window.__pos);await page.keyboard.down('w');await page.waitForTimeout(300);await page.keyboard.up('w');assert.ok(await page.evaluate(p=>Math.hypot(window.__pos.x-p.x,window.__pos.z-p.z)<.15,parked));await page.getByRole('button',{name:'Abandon current shift'}).click();await page.keyboard.press('Escape');await page.keyboard.press('r');await page.waitForFunction(()=>window.__pos.driving===false);pass('driving, menu braking, exit and abandoning a shift work together');
 await at(8,16);await page.keyboard.press('t');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('npc-life:resident-life-v1')).benches.length===1);await page.waitForFunction(()=>Math.abs(window.__pos.z-14)<.1);await page.keyboard.press('w');await page.waitForFunction(()=>Math.abs(window.__pos.z-14)>1);await at(-56,12);await page.keyboard.press('t');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('npc-life:resident-life-v1')).benches.length===2);await page.keyboard.press('t');pass('civic and park benches record visits and movement stands up');
 await at(21,6);await page.keyboard.press('t');await page.waitForFunction(()=>Math.hypot(window.__pos.x+82,window.__pos.z+71)<1);pass('free shuttle reaches Juniper Motor Club');
 await at(-115,-40);await page.keyboard.press('t');await page.getByRole('dialog',{name:'Juniper Court'}).waitFor();await page.getByRole('button',{name:'Start five shots'}).click();
 for(let i=0;i<5;i++){await page.waitForTimeout(350);await page.waitForFunction(()=>{const el=document.querySelector('.court-meter i'),button=[...document.querySelectorAll('dialog button')].find(b=>b.textContent==='Shoot');if(!el||!button)return false;const n=parseFloat(el.style.left);if(n>.42*100&&n<.58*100){button.click();return true;}return false;});}
 assert.equal((await record()).wins,1);assert.equal(await coins(),162);await page.keyboard.press('Escape');pass('five-shot court round pays one reward');
 await page.reload();await page.getByRole('dialog',{name:'NPC LIFE game menu'}).waitFor();await page.keyboard.press('Escape');assert.equal((await record()).completed.milk,1);assert.ok((await record()).upgrades.includes('club'));pass('new progress and unlocks survive reload');
 for(const [width,height] of [[390,844],[768,600]]){await page.setViewportSize({width,height});await page.keyboard.press('l');const el=page.getByRole('dialog',{name:'Resident record'}),rect=await el.boundingBox();assert.ok(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=width+1&&rect.y+rect.height<=height+1);assert.equal(await el.evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);await page.screenshot({path:`${output}/resident-${width}.png`});await page.keyboard.press('Escape');}pass('resident record fits phone and short laptop viewports');
 await page.setViewportSize({width:390,height:844});await page.keyboard.press('l');await page.locator('article').filter({hasText:'Go Buy Milk'}).getByRole('button',{name:'Take shift'}).click();assert.equal(await page.locator('.revival-tracker').isVisible(),false);const shiftBox=await page.locator('.shift-tracker').boundingBox(),mapBox=await page.locator('.alpha8-minimap').boundingBox();assert.ok(shiftBox.x+shiftBox.width<mapBox.x,'objective and map must not overlap on phone');await page.screenshot({path:`${output}/shift-hud-390.png`});await page.keyboard.press('l');await page.getByRole('button',{name:'Abandon current shift'}).click();await page.keyboard.press('Escape');
 await page.setViewportSize({width:1366,height:768});await at(6.4,16);await page.screenshot({path:`${output}/foundation-world.png`});await at(-92,-77);await page.screenshot({path:`${output}/juniper-world.png`});assert.deepEqual(errors,[]);pass('tested flows have no uncaught browser errors');console.log(`${checks} foundation browser checks passed`);
}finally{await browser?.close();await vite.close();}
