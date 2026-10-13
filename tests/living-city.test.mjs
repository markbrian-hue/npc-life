import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshLiving,validateLiving,stepNeeds,environmentAt,WEATHER,purchaseItem,consumeItem,claimSample,eventAt,BUSINESSES,kioskPosition} from '../shared/livingCity.mjs';
import {blocked,onRoad} from '../shared/world.mjs';
test('legacy living records default safely and invalid import data is rejected',()=>{assert.deepEqual(validateLiving({}),freshLiving());for(const input of [{needs:{hunger:-1,thirst:20,energy:20}},{inventory:{water:1.5}},{inventory:{water:61}},{elapsed:Infinity},{quality:'ultra'},{inventory:{cone:1}}])assert.throws(()=>validateLiving(input));});
test('casual depletion is delta-based, bounded, pausable and relaxed',()=>{let n=freshLiving().needs;for(let i=0;i<600;i++)n=stepNeeds(n,1,{moving:true});assert.ok(n.hunger>85&&n.hunger<90);assert.ok(n.thirst>80);assert.equal(stepNeeds(n,1,{paused:true}),n);assert.ok(stepNeeds(n,1,{relaxed:true}).hunger>stepNeeds(n,1).hunger);assert.ok(stepNeeds(n,1,{hot:true}).thirst<stepNeeds(n,1).thirst);assert.deepEqual(stepNeeds({hunger:0,thirst:0,energy:0},1,{resting:true}),{hunger:0,thirst:0,energy:1.3});});
test('purchases use one exact price, quantity, capacity and shop hours',()=>{let s=freshLiving();const e={...environmentAt(0),minute:600,seconds:0};const r=purchaseItem(s,20,'coffee','espresso',e);assert.equal(r.ok,true);assert.equal(r.price,10);s=r.state;assert.equal(s.inventory.espresso,1);assert.equal(purchaseItem(s,9,'coffee','espresso',e).ok,false);assert.equal(purchaseItem(s,20,'coffee','espresso',{...e,minute:60}).ok,false);assert.equal(purchaseItem(s,20,'coffee','water',e).ok,false);assert.equal(purchaseItem({...s,inventory:{water:60}},20,'store','water',e).ok,false);const sale=purchaseItem(s,20,'coffee','espresso',{...e,seconds:200});assert.equal(sale.price,8);});
test('consumption cannot reuse an empty stack and clamps effects/buffs',()=>{const s={...freshLiving(),needs:{hunger:90,thirst:90,energy:90},inventory:{latte:1}};const next=consumeItem(s,'latte');assert.deepEqual(next.needs,{hunger:98,thirst:100,energy:100});assert.equal(next.buff,60);assert.equal(next.inventory.latte,undefined);assert.equal(consumeItem(next,'latte'),null);assert.equal(s.inventory.latte,1);});
test('six weather types, smooth transitions and deterministic room clock',()=>{const kinds=new Set();for(let t=0;t<30000;t+=300){const e=environmentAt(t);kinds.add(e.kind);assert.equal(e.minute,(480+t)%1440);assert.deepEqual(e,environmentAt(t));if(t){assert.equal(e.mix,0);const next=environmentAt(t+20);assert.equal(next.mix,1);}}assert.deepEqual([...kinds].sort(),[...WEATHER].sort());assert.ok(environmentAt(0).daylight>0);assert.equal(environmentAt(720).daylight,0);});
test('free samples are bounded per event and reload preserves claims',()=>{const e=environmentAt(800);assert.equal(eventAt(e).id,'sample');const s=claimSample(freshLiving(),e);assert.equal(s.inventory.hotdog,1);assert.equal(claimSample(validateLiving(s),e),null);assert.equal(claimSample(freshLiving(),environmentAt(100)),null);});
test('business counters have accessible space and kiosks avoid roads',()=>{for(const b of BUSINESSES){assert.equal(blocked(b.x,b.z),false,b.name);assert.equal(onRoad(b.x,b.z),false,b.name);const k=kioskPosition(b);assert.equal(onRoad(k.x,k.z),false);}});

import {JOBS,canStart,startShift,advanceShift,shiftReward,freshLife} from '../shared/residentLife.mjs';
import {createGameServer} from '../server/multiplayer.mjs';
test('weather and morning jobs gate acceptance, while changing weather never strands accepted cargo',()=>{
 const rain=JOBS.find(j=>j.id==='rain-delivery'),paper=JOBS.find(j=>j.id==='morning-paper');
 const dry={...environmentAt(0),rain:0,minute:480},wet={...dry,rain:1};
 assert.equal(canStart(rain,100,freshLife(),dry),false);assert.equal(canStart(rain,100,freshLife(),wet),true);
 assert.equal(canStart(paper,0,freshLife(),{...dry,minute:720}),false);assert.equal(canStart(paper,0,freshLife(),dry),true);
 let a=startShift(rain.id,100,freshLife(),1000,wet);assert.equal(advanceShift(a,{x:57,z:6},{now:1001}).status,'advanced');a=advanceShift(a,{x:57,z:6},{now:1001}).active;
 assert.equal(advanceShift(a,{x:6,z:68},{now:1002}).status,'complete');assert.equal(shiftReward(rain.id,{...freshLife(),upgrades:['bag']}).coins,75);
});
test('room snapshots share deterministic environment and never accept client balances',async()=>{
 let now=10000;const server=createGameServer({now:()=>now});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=`http://127.0.0.1:${server.address().port}`;
 try{const join=async body=>(await fetch(url+'/api/join',{method:'POST',body:JSON.stringify(body)})).json();const a=await join({name:'One'});now+=1500;const b=await join({name:'Two',code:a.code});assert.equal(a.environment.seed,b.environment.seed);assert.equal(b.environment.seconds,1.5);assert.equal('coins' in b,false);}finally{await new Promise(r=>server.close(r));}
});
test('new kiosks block bodies while counters remain reachable',()=>{for(const b of BUSINESSES){const p=kioskPosition(b);assert.equal(blocked(p.x,p.z),true);assert.equal(blocked(b.x,b.z),false);}});

import {communityMeal} from '../shared/livingCity.mjs';
test('community meals work at zero coins and civic feasts improve actual recovery without inventory rewards',()=>{
 const empty={...freshLiving(),needs:{hunger:0,thirst:0,energy:0}};
 const normal=communityMeal(empty,environmentAt(0)),feast=communityMeal(empty,environmentAt(1400));
 assert.deepEqual(normal.needs,{hunger:55,thirst:65,energy:25});assert.deepEqual(feast.needs,{hunger:75,thirst:75,energy:25});assert.deepEqual(feast.inventory,{});assert.equal(communityMeal(feast,environmentAt(1400)),null);
});
