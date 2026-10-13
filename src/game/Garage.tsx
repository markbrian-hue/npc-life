import {useEffect,useRef,useState} from 'react';
import {VEHICLE_CATALOG,VEHICLE_BY_ID,GARAGES,GARAGE_KEY,DEFAULT_PAINTS,loadGarage,buyVehicle} from '../../shared/vehicleCatalog.mjs';
import {garageSpawn} from '../../shared/vehicles.mjs';
import {useGameUI,isTyping} from './ui/GameUI';
import {GameDialog} from './ui/GameDialog';
import {playGameSound} from './gameAudio';
import type {Vehicles} from './Vehicles';
type Pos={x:number;z:number};
export function useGarage(player:Pos,coins:number,rep:number,chapters:number,vehicles:Vehicles,spend:(amount:number)=>boolean){
 const [record,setRecord]=useState(loadGarage),[message,setMessage]=useState('Browse the fleet. Buy and collect at Juniper Motor Club or Dispatch.'),[category,setCategory]=useState('Everyday'),[ownedOnly,setOwnedOnly]=useState(false);
 const {store}=useGameUI(),state=useRef({player,coins,rep,chapters,record,vehicles,spend});state.current={player,coins,rep,chapters,record,vehicles,spend};
 const save=(next:typeof record)=>{state.current.record=next;setRecord(next);try{localStorage.setItem(GARAGE_KEY,JSON.stringify(next));}catch{setMessage('Storage unavailable. Your garage lasts for this session.');}};
 const near=GARAGES.find(g=>Math.hypot(player.x-g.x,player.z-g.z)<5);
 const purchase=(id:string)=>{const s=state.current,g=GARAGES.find(g=>Math.hypot(s.player.x-g.x,s.player.z-g.z)<5);if(!g){setMessage('Visit a Motor Club desk to purchase. Maps mark both garages.');return;}const result=buyVehicle(s.record,id,s.coins,s.rep,s.chapters);if(!result.ok||!result.state||!result.price){setMessage(result.reason||'Vehicle unavailable.');return;}if(!s.spend(result.price)){setMessage('Not enough coins.');return;}s.coins-=result.price;save(result.state);setMessage(`${VEHICLE_BY_ID[id].name} added to your personal garage. Select a finish and Collect vehicle.`);playGameSound('coin');};
 const paint=(id:string,color:string)=>{const s=state.current;if(!s.record.owned.includes(id))return;save({...s.record,paints:{...s.record.paints,[id]:color}});};
 const rim=(id:string,value:string)=>{const s=state.current;if(!s.record.owned.includes(id))return;save({...s.record,rims:{...s.record.rims,[id]:value}});};
 const spawn=(id:string)=>{const s=state.current,r=s.vehicles.runtime.current;if(!s.record.owned.includes(id))return;
  if(r.networked){setMessage('Personal collection is available in solo play. Rooms share their server-controlled public motor pool; local saves do not authorize shared vehicle unlocks.');return;}
  if(r.ownedId){setMessage('Park and exit your current vehicle before collecting another.');return;}
  const g=GARAGES.find(g=>Math.hypot(s.player.x-g.x,s.player.z-g.z)<5);if(!g){setMessage('Visit Juniper Motor Club or Dispatch to collect.');return;}
  const fleet=r.cars.filter(c=>c.id!=='personal-vehicle'),car=garageSpawn(id,g.id,fleet,s.record.paints[id]||DEFAULT_PAINTS[0],s.record.rims[id]||'alloy');
  if(!car){setMessage('Collection bays are blocked. Move the parked vehicles and try again. Nothing was replaced.');return;}
  r.cars=[...fleet,car];save({...s.record,selected:id});s.vehicles.refresh();setMessage(`${car.name} ready in the marked collection bay. R beside it to drive.`);playGameSound('interact');store.close('garage');
 };
 useEffect(()=>{const position=(e:Event)=>{state.current.player=(e as CustomEvent<Pos>).detail;},key=(e:KeyboardEvent)=>{if(e.code==='KeyU'&&!e.repeat&&!isTyping(e.target)&&store.getSnapshot()===null)store.open('garage');};window.addEventListener('npc-life:position',position);window.addEventListener('keydown',key);return()=>{window.removeEventListener('npc-life:position',position);window.removeEventListener('keydown',key);};},[store]);
 return {record,message,category,setCategory,ownedOnly,setOwnedOnly,near,purchase,paint,rim,spawn,rep,chapters,coins,networked:vehicles.runtime.current.networked};
}
export function GarageUI({garage}:{garage:ReturnType<typeof useGarage>}){
 const {store}=useGameUI();const list=VEHICLE_CATALOG.filter(v=>garage.ownedOnly?garage.record.owned.includes(v.id):v.category===garage.category);
 return <>
  <GameDialog id="garage" label="Motor Club dealership" className="garage-dialog" onClose={()=>store.close('garage')}>
   <header><div><small>JUNIPER MOTOR CLUB / DISPATCH MOTOR POOL</small><h2>A better way to avoid walking.</h2></div><button onClick={()=>store.close('garage')} aria-label="Close garage">×</button></header>
   <p role="status">{garage.message}</p><p>◆ {garage.coins} coins · {garage.rep} REP · {garage.chapters} career promotions · {garage.record.owned.length} owned</p>
   <nav aria-label="Vehicle categories">{['Everyday','Performance','Premium','Motorcycles','City service'].map(c=><button key={c} aria-pressed={!garage.ownedOnly&&garage.category===c} onClick={()=>{garage.setOwnedOnly(false);garage.setCategory(c);}}>{c}</button>)}<button aria-pressed={garage.ownedOnly} onClick={()=>garage.setOwnedOnly(true)}>My garage</button></nav>
   {!list.length&&<p>Your garage is empty. Start with a Pocket Commuter scooter (70 coins), or a Mica hatchback (120). Free public vehicles are still available around the city.</p>}
   <div className="garage-grid">{list.map(v=>{const owned=garage.record.owned.includes(v.id),eligible=garage.rep>=v.rep&&garage.chapters>=v.chapters;return <article key={v.id}>
    <div className={`vehicle-silhouette ${v.category==='Motorcycles'?'two-wheel':v.body}`} style={{'--paint':garage.record.paints[v.id]||DEFAULT_PAINTS[0]} as React.CSSProperties}><i/><span/><b/><b/></div>
    <h3>{v.name}</h3><small>{v.category} · {v.mass.toLocaleString()} kg</small>
    <dl><div><dt>Top speed</dt><dd>{Math.round(v.maxSpeed*3.6)} km/h</dd></div><div><dt>Acceleration</dt><dd>{v.power} m/s²</dd></div><div><dt>Braking</dt><dd>{v.brake} m/s²</dd></div><div><dt>Handling</dt><dd>{v.wheelbase<2?'Agile / two wheels':v.mass>2000?'Heavy / stable':v.power>6?'Sport / responsive':'Balanced'}</dd></div></dl>
    <p>{v.rep} REP{v.chapters?` + ${v.chapters} promotions`:''} · ◆ {v.price}</p>
    {owned?<><div className="paint-options" aria-label={`${v.name} paint`}>{DEFAULT_PAINTS.map(color=><button key={color} aria-label={`Paint ${color}`} aria-pressed={garage.record.paints[v.id]===color} style={{background:color}} onClick={()=>garage.paint(v.id,color)}/>)}</div><label>Rims <select aria-label={`${v.name} rims`} value={garage.record.rims[v.id]||'alloy'} onChange={e=>garage.rim(v.id,e.target.value)}><option value="alloy">Alloy</option><option value="dark">Dark</option><option value="gold">Gold</option></select></label><button disabled={!garage.near||garage.networked} onClick={()=>garage.spawn(v.id)}>Collect vehicle</button></>:<button disabled={!garage.near||!eligible||garage.coins<v.price} onClick={()=>garage.purchase(v.id)}>{eligible?`Buy · ◆ ${v.price}`:'Career / reputation locked'}</button>}
   </article>;})}</div>
   <p>Collection uses clear, collision-checked bays. Paint and rims are included. Premium vehicles require career progress. Personal garage collection is solo-only in this milestone; multiplayer retains its exclusive server-owned fleet and motorcycles.</p>
  </GameDialog>
 </>;
}
