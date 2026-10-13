import {useEffect,useRef,useState} from 'react';
import {EXPLORATION_KEY,EXPLORER_SITES,CONTRACT_BY_ID,loadExploration,explorerDay,dailyContracts,acceptContract,advanceContract,contractTarget,stampPassport,shuttleDestination} from '../../shared/exploration.mjs';
import {useGameUI,isTyping} from './ui/GameUI';
import {GameDialog} from './ui/GameDialog';
import {CityMapLayer} from './CityMapLayer';
import {WORLD_RADIUS} from './world';
import type {Vehicles} from './Vehicles';
import {playGameSound} from './gameAudio';
import './exploration.css';
type Pos={x:number;z:number};
export function useExploration(player:Pos,vehicles:Vehicles,working:boolean,reward:(coins:number,rep:number,message:string)=>void,notify:(text:string)=>void){
 const [record,setRecord]=useState(loadExploration),[day,setDay]=useState(explorerDay),{store}=useGameUI();
 const saved=useRef(record),replaced=useRef(false),inputs=useRef({player,working,reward,notify});inputs.current={player,working,reward,notify};
 const commit=(next:typeof record)=>{if(replaced.current)return;saved.current=next;setRecord(next);try{localStorage.setItem(EXPLORATION_KEY,JSON.stringify(next));}catch{inputs.current.notify('Passport saved for this session. Browser storage is unavailable.');}};
 const start=(id:string)=>{if(store.getSnapshot()!=='explorer')return;if(inputs.current.working){inputs.current.notify('Finish your current shift before accepting a contract.');return;}const next=acceptContract(saved.current,id,explorerDay());if(next){commit(next);store.close('explorer');inputs.current.notify('Contract accepted. Follow the mint marker; Z handles each stop on foot.');}};
 const cancel=()=>commit({...saved.current,active:null});
 const interact=()=>{
  if(store.getSnapshot()!==null||replaced.current)return;const {player,reward,notify}=inputs.current,driving=!!vehicles.runtime.current.ownedId;
  const stamped=stampPassport(saved.current,player,driving);if(stamped){commit(stamped.state);reward(stamped.coins,stamped.rep,stamped.bonus?'City Explorer passport complete! +132 coins · +33 REP':`${stamped.site.name} discovered · +12 coins${stamped.site.station?' · Shuttle unlocked':''}`);playGameSound('coin');}
  const result=advanceContract(saved.current,player,driving);if(result){if(result.status==='park'){notify('Park and exit your vehicle before handling this stop.');return;}commit(result.state);if(result.status==='complete'){reward(result.coins,result.rep,`Contract complete · +${result.coins} coins · +${result.rep} REP`);window.dispatchEvent(new CustomEvent('npc-life:work'));playGameSound('job');}else notify('Stop complete. Your next destination is marked.');}
  else if(!stamped&&driving)notify('Park and exit to collect a passport stamp.');
 };
 const shuttle=(id:string)=>{if(store.getSnapshot()!=='explorer')return;const dest=shuttleDestination(saved.current,inputs.current.player,id,{working:inputs.current.working,driving:!!vehicles.runtime.current.ownedId});if(dest){store.close('explorer');window.dispatchEvent(new CustomEvent('npc-life:relocate',{detail:{x:dest.x,z:dest.z}}));inputs.current.notify(`Free shuttle to ${dest.name}.`);}};
 const handlers=useRef({interact});handlers.current={interact};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.repeat||isTyping(e.target)||store.getSnapshot()!==null)return;if(e.code==='KeyX')store.open('explorer');if(e.code==='KeyZ')handlers.current.interact();},position=(e:Event)=>{inputs.current.player=(e as CustomEvent<Pos>).detail;},flush=()=>{if(!replaced.current)try{localStorage.setItem(EXPLORATION_KEY,JSON.stringify(saved.current));}catch{/* Session-only storage. */}},replace=()=>{replaced.current=true;};
  const timer=setInterval(()=>setDay(explorerDay()),30000);window.addEventListener('keydown',key);window.addEventListener('npc-life:position',position);window.addEventListener('npc-life:flush-save',flush);window.addEventListener('pagehide',flush);window.addEventListener('npc-life:save-replaced',replace);
  return()=>{clearInterval(timer);window.removeEventListener('keydown',key);window.removeEventListener('npc-life:position',position);window.removeEventListener('npc-life:flush-save',flush);window.removeEventListener('pagehide',flush);window.removeEventListener('npc-life:save-replaced',replace);};
 },[store]);
 return {record,day,start,cancel,interact,shuttle,target:contractTarget(record),player,working,driving:!!vehicles.runtime.current.ownedId};
}
export type Exploration=ReturnType<typeof useExploration>;
export function ExplorationUI({explore}:{explore:Exploration}){
 const {store,menu}=useGameUI(),{record,target,player}=explore,near=EXPLORER_SITES.find(p=>Math.hypot(p.x-player.x,p.z-player.z)<2.8),active=record.active?CONTRACT_BY_ID[record.active.id]:null;
 const s=(v:number)=>(v+WORLD_RADIUS)*400/(WORLD_RADIUS*2),available=dailyContracts(explore.day);
 return <>
  {target&&<aside className="shift-tracker contract-tracker" aria-label="Active daily contract"><small>DAILY CONTRACT · {record.active!.stage+1}/{active!.stops.length}</small><b>{active!.title}</b><span>{target.action}</span><small>{Math.ceil(Math.hypot(player.x-target.x,player.z-target.z))}m · <kbd>Z</kbd> at the marker</small><button onClick={()=>store.open('explorer')}>Route details <kbd>X</kbd></button></aside>}
  {menu===null&&near&&((!record.visits.includes(near.id))||target?.id===near.id)&&<button className="explorer-prompt" onClick={explore.interact}><kbd>Z</kbd> {target?.id===near.id?target.action:`Discover ${near.name}`}</button>}
  <GameDialog id="explorer" label="Daily contracts and explorer passport" className="explorer-dialog" onClose={()=>store.close('explorer')}>
   <header><div><small>NPC LIFE / GO A LITTLE FURTHER</small><h2>Beyond the usual.</h2><p>Daily contracts. New places. A city worth knowing.</p></div><button aria-label="Close explorer board" onClick={()=>store.close('explorer')}>×</button></header>
   <div className="explorer-summary"><span><b>{record.visits.length}/{EXPLORER_SITES.length}</b> places discovered</span><span><b>{record.finished}</b> contracts finished</span><span><b>{record.passportRewarded?'CITY EXPLORER':'120 COINS'}</b> {record.passportRewarded?'passport complete':'full passport bonus'}</span></div>
   {active&&<section className="active-contract"><small>YOUR CURRENT ROUTE</small><h3>{active.title}</h3><ol>{active.stops.map((id,i)=><li key={id} className={i<record.active!.stage?'done':''}>{active.actions[i]}{i===record.active!.stage?' ← NEXT':''}</li>)}</ol><p>Progress saves between visits. You can drive between stops; exit and press Z to handle each delivery.</p><button onClick={explore.cancel}>Cancel route</button></section>}
   <h3>Today's commissions <span>Refresh at 00:00 UTC</span></h3><div className="contract-grid">{available.map(c=>{const done=record.claimed.includes(`${explore.day}:${c.id}`),locked=record.visits.length<c.required;return <article key={c.id}><small>{c.stops.length} STOPS · {c.required?'EXPLORER':'OPEN TO ALL'}</small><h4>{c.title}</h4><p>{c.description}</p><strong>◆ {c.coins} coins · {c.rep} REP</strong><button disabled={!!record.active||done||locked||explore.working||explore.day<record.day} onClick={()=>explore.start(c.id)}>{done?'Completed today':locked?`Discover ${c.required} places`:explore.working?'Finish current shift':`Accept ${c.title}`}</button></article>;})}</div>
   <h3>Your explorer passport <span>12 coins for each new stamp · Z on foot</span></h3>
   <div className="passport-layout"><svg viewBox="0 0 400 400" role="img" aria-label="Expanded city and explorer destinations"><CityMapLayer size={400}/>{EXPLORER_SITES.map((p,i)=><g key={p.id}><circle cx={s(p.x)} cy={s(p.z)} r={8} fill={record.visits.includes(p.id)?'#b6e0b8':'#f5cf74'} stroke="#263c37" strokeWidth={2}/><text x={s(p.x)} y={s(p.z)+3} textAnchor="middle" fontSize={9} fill="#1e332d">{i+1}</text></g>)}<circle cx={s(player.x)} cy={s(player.z)} r={4} fill="white" stroke="#142f28"/></svg><div>{EXPLORER_SITES.map((p,i)=><article className="passport-site" key={p.id}><span>{record.visits.includes(p.id)?'✓':i+1}</span><div><h4>{p.name}</h4><p>{p.detail}</p>{p.station&&<button disabled={!shuttleDestination(record,player,p.id,{working:explore.working,driving:explore.driving})} onClick={()=>explore.shuttle(p.id)}>{record.visits.includes(p.id)?`Shuttle to ${p.name}`:'Visit to unlock shuttle'}</button>}</div></article>)}</div></div>
   <p className="explorer-note">Free shuttles leave from discovered station markers. Finish active work and exit your vehicle before travelling. Your stamps and contract progress are included in save backups.</p>
  </GameDialog>
 </>;
}
