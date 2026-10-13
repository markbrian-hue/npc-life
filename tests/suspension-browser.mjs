import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createServer} from 'vite';
const {chromium}=await import(process.env.NPC_LIFE_PLAYWRIGHT_MODULE||'playwright');
const output=process.env.NPC_LIFE_QA_OUTPUT||'qa-output';await mkdir(output,{recursive:true});
const vite=await createServer({server:{host:'127.0.0.1',port:5189,strictPort:true,hmr:false},plugins:[{name:'suspension-fixture',configureServer(server){server.middlewares.use('/__suspension',(_,res)=>{res.setHeader('Content-Type','text/html');res.end('<html><head><style>html,body,#root{margin:0;width:100%;height:100%}</style></head><body><div id="root"></div><script type="module" src="/tests/suspension-scene.tsx"></script></body></html>');});}}]});
await vite.listen();let browser;const errors=[];
try{
 browser=await chromium.launch({headless:true,...(process.env.NPC_LIFE_CHROMIUM?{executablePath:process.env.NPC_LIFE_CHROMIUM}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1200,height:760}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5189/__suspension');
 for(const [model,button,count] of [['sedan',null,4],['scooter','Scooter',2],['bus','Bus',4]]){
  if(button)await page.getByRole('button',{name:button,exact:true}).click();
  await page.waitForFunction(m=>window.__ride?.car.model===m&&window.__ride.car.x>-60.5,model,{timeout:60000});
  const data=await page.evaluate(()=>{const {car,scene}=window.__ride,root=scene.getObjectByName('fixture-car'),body=root.getObjectByName('sprung-body');return {model:car.model,x:car.x,pitch:car.pitch,heave:car.suspension.heave,bodyY:body.position.y,bodyPitch:body.rotation.z,wheels:(()=>{const wheels=[];root.traverse(o=>{if(o.name.startsWith('wheel:'))wheels.push(o);});return wheels;})().map(o=>({y:o.position.y,index:Number(o.name.split(':')[1])})),ground:scene.getObjectByName('speed-table:park-crossing').geometry.attributes.position.count};});
  assert.equal(data.model,model);assert.equal(data.wheels.length,count);assert.ok(data.ground>0);assert.ok(Number.isFinite(data.bodyPitch)&&Math.abs(data.bodyPitch-data.pitch)<.05);assert.ok(Math.abs(data.bodyY-data.heave)<.05);assert.ok(data.wheels.every(w=>w.y>.15&&w.y<.7));
  await page.waitForFunction(()=>Math.max(...window.__ride.car.suspension.wheels)-Math.min(...window.__ride.car.suspension.wheels)>.025,null,{timeout:60000});
  await page.screenshot({path:`${output}/suspension-${model}.jpg`,type:'jpeg',quality:85});
  const contact=await page.evaluate(()=>{const {car,scene}=window.__ride,root=scene.getObjectByName('fixture-car');const wheels=(()=>{const wheels=[];root.traverse(o=>{if(o.name.startsWith('wheel:'))wheels.push(o);});return wheels;})();return {offsets:car.suspension.wheels,rendered: wheels.map(o=>({index:Number(o.name.split(':')[1]),y:o.position.y}))};});
  // Tire radii are category-specific; compare differences to cancel radius.
  assert.ok(Math.abs((contact.rendered.at(-1).y-contact.rendered[0].y)-(contact.offsets[count-1]-contact.offsets[0]))<.025);
  console.log(`PASS ${model}: production mesh, independent wheel contact and sprung body render over the shared speed table`);
 }
 assert.deepEqual(errors,[]);console.log('PASS no uncaught WebGL fixture errors');
}finally{await browser?.close();await vite.close();}
