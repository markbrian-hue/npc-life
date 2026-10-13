import {useEffect, useRef, useState} from 'react';
import {BUSINESSES, ITEMS, ITEM_BY_ID, LIVING_KEY, loadLiving, stepNeeds, environmentAt, eventAt, isOpen, purchaseItem, consumeItem, claimSample, clampNeed} from '../../shared/livingCity.mjs';
import {useGameUI, isTyping} from './ui/GameUI';
import {GameDialog} from './ui/GameDialog';
import {playGameSound} from './gameAudio';
import type {Multiplayer} from './Multiplayer';

type Pos={x:number;z:number};
export type LivingRuntime={record:ReturnType<typeof loadLiving>;env:ReturnType<typeof environmentAt>;activity:{moving:boolean;running:boolean;resting:boolean};consuming:{id:string;until:number}|null};
export function useLivingCity(player:Pos,coins:number,multiplayer:Multiplayer,working:boolean,spend:(amount:number)=>boolean,notify:(message:string)=>void) {
 const {store}=useGameUI();
 const runtime=useRef<LivingRuntime>({record:loadLiving(),env:environmentAt(0),activity:{moving:false,running:false,resting:false},consuming:null});
 const [view,setView]=useState(()=>runtime.current.record),[env,setEnv]=useState(()=>environmentAt(view.elapsed,view.seed));
 const [selected,setSelected]=useState('coffee'),[message,setMessage]=useState('Buy now, eat when your ambition runs out.');
 const inputs=useRef({player,coins,multiplayer,working,spend,notify});inputs.current={player,coins,multiplayer,working,spend,notify};
 const persist=()=>{try{localStorage.setItem(LIVING_KEY,JSON.stringify(runtime.current.record));}catch{/* Session remains playable with blocked storage. */}};
 const commit=(next:typeof view)=>{runtime.current.record=next;setView(next);persist();};
 const feedback=(text:string)=>{setMessage(text);inputs.current.notify(text);};
 useEffect(()=>{
  let last=performance.now(),publish=0,saved=0;
  const timer=setInterval(()=>{
   const now=performance.now(),dt=Math.min((now-last)/1000,1);last=now;
   const r=runtime.current,i=inputs.current,menu=store.getSnapshot(),hidden=document.hidden;
   const onboarding=menu==='welcome';
   if(!hidden&&!onboarding)r.record={...r.record,elapsed:r.record.elapsed+dt,buff:Math.max(0,r.record.buff-dt)};
   const shared=i.multiplayer.environment;
   r.env=shared?environmentAt(shared.seconds+(now-shared.received)/1000,shared.seed):environmentAt(r.record.elapsed,r.record.seed);
   r.record={...r.record,needs:stepNeeds(r.record.needs,dt,{...r.activity,working:i.working,hot:r.env.heat,relaxed:r.record.relaxed,paused:hidden||menu!==null})};
   if(r.consuming&&now>=r.consuming.until)r.consuming=null;
   publish+=dt;saved+=dt;
   if(publish>=1){publish=0;setView(r.record);setEnv(r.env);}
   if(saved>=15){saved=0;persist();}
  },250);
  const flush=()=>persist();window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',flush);
  return()=>{clearInterval(timer);persist();window.removeEventListener('pagehide',flush);document.removeEventListener('visibilitychange',flush);};
 },[store]);
 const openShop=(id:string)=>{const b=BUSINESSES.find(s=>s.id===id),p=inputs.current.player;if(!b||Math.hypot(p.x-b.x,p.z-b.z)>4)return;if(!isOpen(b,runtime.current.env.minute)){feedback(`${b.name} opens at ${String(b.open).padStart(2,'0')}:00. The convenience store is open all night.`);return;}if(store.open('food-shop')){setSelected(id);setMessage(`${b.cashier}: Your order is statistically more useful than you.`);playGameSound('interact');}};
 const buy=(id:string)=>{
  if(store.getSnapshot()!=='food-shop')return;
  const r=runtime.current,i=inputs.current,b=BUSINESSES.find(b=>b.id===selected);
  if(!b||Math.hypot(i.player.x-b.x,i.player.z-b.z)>4)return;
  const result=purchaseItem(r.record,i.coins,selected,id,r.env);
  if(!result.ok||!result.state||!result.price){feedback(result.reason||'Cannot purchase.');return;}
  if(!i.spend(result.price)){feedback('Not enough coins.');return;}
  // Debit and inventory use synchronous authoritative refs before React publishes.
  inputs.current.coins-=result.price;commit(result.state);feedback(`${ITEM_BY_ID[id].name} packed · −${result.price} coins. Open your bag with O.`);playGameSound('coin');
 };
 const consume=(id:string)=>{
  const r=runtime.current;if(r.consuming)return;
  const next=consumeItem(r.record,id);if(!next)return;
  r.consuming={id,until:performance.now()+1600};commit(next);feedback(`${ITEM_BY_ID[id].name}: consumed. Your body has filed a thank-you note.`);
  playGameSound(ITEM_BY_ID[id].category==='drink'?'drink':'eat');
  store.close('food-bag');store.close('food-shop');
 };
 const aid=()=>{const i=inputs.current,r=runtime.current;if(Math.hypot(i.player.x-6,i.player.z-22)>4)return;const n=r.record.needs;if(n.hunger>=45&&n.thirst>=45){feedback('You are supplied. Return when hunger or thirst is below 45. Benches restore energy for free.');return;}commit({...r.record,needs:{...n,hunger:Math.max(55,n.hunger),thirst:Math.max(65,n.thirst),energy:Math.max(25,n.energy)}});r.consuming={id:'meal',until:performance.now()+1600};feedback('Free community meal & tap water. No coins, no paperwork, no shame.');playGameSound('eat');};
 const sample=()=>{const i=inputs.current,b=BUSINESSES[3];if(Math.hypot(i.player.x-b.x,i.player.z-b.z)>4)return;const next=claimSample(runtime.current.record,runtime.current.env);if(next){commit(next);feedback('One free hotdog packed. Frank calls this marketing.');playGameSound('coin');}else feedback('Sample already claimed, bag full, or event ended.');};
 const handlers=useRef({openShop,aid});handlers.current={openShop,aid};
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{if(e.repeat||isTyping(e.target)||store.getSnapshot()!==null)return;if(e.code==='KeyO')store.open('food-bag');if(e.code==='KeyF'){const p=inputs.current.player,b=BUSINESSES.find(b=>Math.hypot(p.x-b.x,p.z-b.z)<4);if(b)handlers.current.openShop(b.id);else handlers.current.aid();}};
  const shop=(e:Event)=>handlers.current.openShop((e as CustomEvent<string>).detail);
  const work=()=>{const r=runtime.current;commit({...r.record,needs:{...r.record.needs,energy:clampNeed(r.record.needs.energy-2),hunger:clampNeed(r.record.needs.hunger-1)}});};
  window.addEventListener('npc-life:work',work);
  window.addEventListener('keydown',key);window.addEventListener('npc-life:food-shop',shop);
  return()=>{window.removeEventListener('npc-life:work',work);window.removeEventListener('keydown',key);window.removeEventListener('npc-life:food-shop',shop);};
 },[store]);
 const near=BUSINESSES.find(b=>Math.hypot(player.x-b.x,player.z-b.z)<4);
 return {runtime,view,env,near,selected,message,openShop,buy,consume,aid,sample,commit};
}
export type LivingCity=ReturnType<typeof useLivingCity>;
const timeLabel=(minute:number)=>`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(Math.floor(minute%60)).padStart(2,'0')}`;
const effects=(item:typeof ITEMS[number])=>`Food +${item.hunger} · Water +${item.thirst} · Energy +${item.energy}${item.buff?' · Sprint boost '+item.buff+'s':''}`;
export function LivingCityUI({city,player}:{city:LivingCity;player:Pos}) {
 const {store,menu}=useGameUI(),{view,env}=city;
 const shop=BUSINESSES.find(s=>s.id===city.selected)!;
 const event=eventAt(env),aidNear=Math.hypot(player.x-6,player.z-22)<4;
 const count=Object.values(view.inventory).reduce((a,b)=>a+b,0);
 return <>
  <aside className="living-hud" aria-label="Player needs and environment">
   <div className="living-clock"><b>{timeLabel(env.minute)}</b><span>DAY {env.day} · {env.label}</span><button onClick={()=>store.open('living-settings')} aria-label="Living city settings">⚙</button></div>
   <div className="needs-row">{(['hunger','thirst','energy'] as const).map((key,i)=><div key={key} className={view.needs[key]<20?'need-low':''} title={`${key}: ${Math.round(view.needs[key])}/100`}><span>{['♨','◈','ϟ'][i]} {key}</span><meter min={0} max={100} value={view.needs[key]} aria-label={key}/><b>{Math.round(view.needs[key])}</b></div>)}</div>
   {Math.min(...Object.values(view.needs))<20&&<small role="status">Low needs: O to eat · F at bureau for free food/water · T at benches to rest</small>}
   {view.buff>0&&<small>Caffeine sprint boost · {Math.ceil(view.buff)}s</small>}
   {event&&<small className="living-event">{event.title}</small>}
  </aside>
  <button className="food-bag-access" onClick={()=>store.open('food-bag')}>FOOD BAG · {count} <kbd>O</kbd></button>
  {menu===null&&(city.near||aidNear)&&<button className="food-prompt" onClick={()=>city.near?city.openShop(city.near.id):city.aid()}><kbd>F</kbd> {city.near?`${city.near.name} · ${isOpen(city.near,env.minute)?'menu':'closed'}`:'Free community meal & water'}</button>}
  <GameDialog id="food-shop" label={shop.name} className="living-dialog" onClose={()=>store.close('food-shop')}>
   <header><div><small>RESIDENT FOOD SERVICES · {shop.cashier}</small><h2>{shop.name}</h2></div><button aria-label="Close food shop" onClick={()=>store.close('food-shop')}>×</button></header>
   <p role="status">{city.message}</p><p>{shop.open===0?'Open 24 hours':`Open ${shop.open}:00–${shop.close}:00`} · {count}/60 packed items · Eat from your bag later.</p>
   {shop.id==='vendor'&&event?.id==='sample'&&<button onClick={city.sample} disabled={view.sampleCycle===event.slot}>Claim free hotdog sample</button>}
   <div className="food-grid">{shop.products.map(id=>{const item=ITEM_BY_ID[id],price=item.price-(shop.id==='coffee'&&event?.id==='discount'?2:0);return <article key={id}><h3>{item.name}</h3><p>{item.description}</p><small>{effects(item)}</small><button onClick={()=>city.buy(id)} disabled={!isOpen(shop,env.minute)||count>=60}>Pack one · ◆ {Math.max(1,price)}</button></article>;})}</div>
  </GameDialog>
  <GameDialog id="food-bag" label="Food bag" className="living-dialog" onClose={()=>store.close('food-bag')}>
   <header><h2>Your emergency ambitions.</h2><button aria-label="Close food bag" onClick={()=>store.close('food-bag')}>×</button></header><p>{count}/60 items. Cosmetics stay in your Wardrobe (I). Coffee grants a timed sprint boost.</p>
   {!count&&<p>Your bag is empty. Shops are marked on the map; F opens their menus. The bureau at Civic Square serves free meals and water when needs are low.</p>}
   <div className="food-grid">{ITEMS.filter(i=>view.inventory[i.id]>0).map(item=><article key={item.id}><h3>{item.name} ×{view.inventory[item.id]}</h3><small>{item.category} · {effects(item)}</small><button onClick={()=>city.consume(item.id)}>Consume one</button></article>)}</div>
  </GameDialog>
  <GameDialog id="living-settings" label="Living city settings" className="living-dialog" onClose={()=>store.close('living-settings')}>
   <header><h2>Your ordinary life.</h2><button aria-label="Close living city settings" onClick={()=>store.close('living-settings')}>×</button></header>
   <label><input type="checkbox" checked={view.relaxed} onChange={e=>city.commit({...city.runtime.current.record,relaxed:e.target.checked})}/> Relaxed needs · 65% slower hunger, thirst and activity costs</label>
   <label>Weather quality <select value={view.quality} onChange={e=>city.commit({...city.runtime.current.record,quality:e.target.value})}><option value="low">Low · 100 rain drops</option><option value="medium">Medium · 300 rain drops</option><option value="high">High · 600 rain drops</option></select></label>
   <p>{env.label} · next forecast in {Math.ceil(env.remaining)} seconds. A full city day takes 24 minutes. Weather settles over 20 seconds and lasts five minutes.</p>
   <p>Needs pause in menus and hidden tabs. Free benches restore energy. Walking remains available even at zero needs; low energy slows sprinting.</p>
   <p>Living city work uses your existing career and bulletin (L). Discounts change real prices; samples go into your bag. Rooms share time and weather; wallets and progress remain personal.</p>
  </GameDialog>
 </>;
}
