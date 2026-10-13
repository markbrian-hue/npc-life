import { CAREER_CHAPTERS, DAILY_BULLETIN, addDistrict, districtNear, careerReady, careerMetrics, claimCareerChapter, claimBulletin, dailyProgress, currentBulletin, careerDayStamp, finishCareerShift, finishCareerCourt } from '../../shared/career.mjs';
import { useEffect, useRef, useState } from 'react';
import { LIFE_KEY, JOBS, UPGRADES, loadLife, startShift, advanceShift, shiftReward, shiftStops, lifeAchievements, LIFE_ACHIEVEMENTS, canStart } from '../../shared/residentLife.mjs';
import { ACTIVITY_SITES, BENCHES, WORLD_RADIUS } from './world';
import type { Vehicles } from './Vehicles';
import { useGameUI, isTyping } from './ui/GameUI';
import { GameDialog } from './ui/GameDialog';
import { WorldSign } from './DistrictWorld';
import { playGameSound } from './gameAudio';
import { CityMapLayer } from './CityMapLayer';
type Pos={x:number;z:number};
type Active={id:string;stage:number;variant:number;started:number;deadline:number}|null;
export function useResidentLife(player:Pos,coins:number,rep:number,vehicles:Vehicles,reward:(coins:number,rep:number,message:string)=>void,notify:(message:string)=>void){
  const [record,setRecord]=useState(loadLife),[active,setActive]=useState<Active>(null),[notice,setNoticeState]=useState('Start with Go Buy Milk. Earn coins, unlock work, explore the city.'),[now,setNow]=useState(Date.now),[resting,setResting]=useState(false);
  const {store}=useGameUI();const state=useRef({player,coins,rep,record,active,resting,reward});state.current={player,coins,rep,record,active,resting,reward};
  const setNotice=(message:string)=>{setNoticeState(message);notify(message);};
  const save=(next:typeof record)=>{state.current.record=next;setRecord(next);try{localStorage.setItem(LIFE_KEY,JSON.stringify(next));}catch{setNotice('Storage unavailable. This resident record lasts until you close the page.');}};
  const job=JOBS.find(j=>j.id===active?.id),target=job&&active?shiftStops(job,active)[active.stage]:null;
  const near=ACTIVITY_SITES.find(p=>Math.hypot(p.x-player.x,p.z-player.z)<(p.radius??4));
  const nearBench=BENCHES.some(b=>Math.hypot(b.x-player.x,b.z-player.z)<2.8);
  useEffect(()=>{const timer=setInterval(()=>{const t=Date.now();setNow(t);const a=state.current.active;if(a?.deadline&&t>a.deadline){state.current.active=null;setActive(null);setNotice('Shift expired. No penalty. Pick another from L.');}},500);return()=>clearInterval(timer);},[]);
  const start=(id:string)=>{const s=state.current;if(s.active){setNotice('Finish or abandon your current shift first.');return;}const next=startShift(id,s.rep,s.record,Date.now());if(!next){setNotice('Earn more reputation or buy the Motor Club licence.');return;}state.current.active=next;setActive(next);setNotice('Shift accepted. Follow the amber marker and press T at each stop.');store.close('resident-phone');};
  const cancel=()=>{state.current.active=null;setActive(null);setNotice('Shift abandoned. No charge, no paperwork.');};
  const purchase=(id:string)=>{const s=state.current,u=UPGRADES.find(u=>u.id===id);if(!u||s.record.upgrades.includes(id))return;if(!['garage','board'].some(site=>ACTIVITY_SITES.some(p=>p.id===site&&Math.hypot(p.x-s.player.x,p.z-s.player.z)<4))){setNotice('Visit the resident bureau or Juniper Motor Club to purchase.');return;}if(s.coins<u.price){setNotice('Not enough coins yet. Try a shift.');return;}state.current.coins-=u.price;save({...s.record,upgrades:[...s.record.upgrades,id]});s.reward(-u.price,0,`${u.name} unlocked.`);setNotice(`${u.name} purchased.`);};
  const interact=()=>{
    const s=state.current;if(store.getSnapshot()!==null)return;
    const fleet=vehicles.runtime.current,car=fleet.cars.find(c=>c.id===fleet.ownedId);
    if(s.resting){window.dispatchEvent(new CustomEvent('npc-life:rest',{detail:null}));setResting(false);state.current.resting=false;return;}
    if(s.active){const result=advanceShift(s.active,s.player,{driving:!!car,speed:car?.speed||0,now:Date.now()});
      if(result.status==='complete'){const id=s.active.id,earned=shiftReward(id,s.record);state.current.active=null;setActive(null);save(finishCareerShift(s.record,id));s.reward(earned.coins,earned.rep,'Shift complete. You have been useful. Management is concerned.');setNotice(`+${earned.coins} coins · +${earned.rep} reputation. Pick your next shift with L.`);playGameSound('job');return;}
      if(result.status==='advanced'){state.current.active=result.active;setActive(result.active);setNotice(result.active.stage===1?'Cargo collected. It has declined to comment.':'Next stop marked.');playGameSound('interact');return;}
      if(result.status==='stop-car'||result.status==='on-foot'){setNotice(result.status==='stop-car'?'Use a car and brake at the stop.':'Exit the car to handle the delivery.');return;}
    }
    if(car){setNotice('Park and exit to use city activities.');return;}
    const bench=BENCHES.findIndex(b=>Math.hypot(b.x-s.player.x,b.z-s.player.z)<2.8);
    if(bench>=0){save({...s.record,benches:[...new Set([...s.record.benches,bench])]});setResting(true);state.current.resting=true;window.dispatchEvent(new CustomEvent('npc-life:rest',{detail:BENCHES[bench]}));setNotice('A hard-earned sit. Move or press T to stand up.');return;}
    const site=ACTIVITY_SITES.find(p=>Math.hypot(p.x-s.player.x,p.z-s.player.z)<(p.radius??4));
    if(site?.id==='court'){store.open('basketball');return;}
    if(site?.id==='coffee'){if(s.coins<10){setNotice('Coffee costs 10 coins. Existential dread remains free.');return;}state.current.coins-=10;s.reward(-10,0,'Coffee acquired. Sprint boost for 60 seconds.');window.dispatchEvent(new CustomEvent('npc-life:coffee'));return;}
    if(site?.id==='bus'){window.dispatchEvent(new CustomEvent('npc-life:relocate',{detail:{x:-82,z:-71}}));setNotice('Free shuttle to Juniper Motor Club. Against all odds, the bus arrived.');return;}
    if(Math.hypot(s.player.x+116,s.player.z-27)<3&&!s.record.secret){save({...s.record,secret:true});s.reward(35,10,'Secret found: the city was surveyed by a pigeon.');setNotice('Municipal Conspiracy achievement earned.');return;}
    if(site){store.open('resident-phone');return;}
  };
  const handlers=useRef({interact});handlers.current={interact};
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.repeat||isTyping(e.target)||store.getSnapshot()!==null)return;if(e.code==='KeyL')store.open('resident-phone');if(e.code==='KeyT')handlers.current.interact();};const stand=()=>{setResting(false);state.current.resting=false;};const position=(e:Event)=>{state.current.player=(e as CustomEvent<Pos>).detail;};window.addEventListener('npc-life:position',position);window.addEventListener('keydown',key);window.addEventListener('npc-life:stood',stand);return()=>{window.removeEventListener('npc-life:position',position);window.removeEventListener('keydown',key);window.removeEventListener('npc-life:stood',stand);};},[store]);
  const courtWin=()=>{const s=state.current;save(finishCareerCourt(s.record));s.reward(12,4,'Juniper Court: three baskets. Your fan club is a lamp post.');};
  // Stamp districts only when discovered, instead of writing localStorage per frame.
  useEffect(()=>{
    const nearDistrict=districtNear(player);
    if(!nearDistrict)return;
    const before=state.current.record,after=addDistrict(before,nearDistrict.id);
    if(after!==before)save(after);
  },[player.x,player.z]);
  const claimChapter=(id:string)=>{
    const s=state.current,result=claimCareerChapter(s.record,id,s.rep);
    if(!result)return;
    save(result.record);
    s.reward(result.coins,result.rep,'CAREER PROMOTION: '+result.title);
    playGameSound('job');
    setNotice('Promotion approved. The city regrets encouraging you.');
  };
  const claimDaily=(id:string)=>{
    const s=state.current,result=claimBulletin(s.record,id);
    if(!result)return;
    save(result.record);
    s.reward(result.coins,result.rep,'CITY BULLETIN: '+result.title);
    playGameSound('coin');
    setNotice('Daily bulletin stamped. Return tomorrow for new tasks.');
  };
  return {record,active,target,job,near,nearBench,notice,now,start,cancel,purchase,interact,resting,courtWin,rep,player,claimChapter,claimDaily};
}
export type ResidentLife=ReturnType<typeof useResidentLife>;
export function ResidentLifeWorld({life}:{life:ResidentLife}){return <>
  {life.target&&<group position={[life.target.x,1.7,life.target.z]}><mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[.65,.07,6,20]}/><meshBasicMaterial color="#ffa85f"/></mesh><group position={[0,1.6,0]}><WorldSign text="SHIFT / T" width={2.5}/></group></group>}
  <mesh position={[-116,.3,27]}><boxGeometry args={[.65,.6,.65]}/><meshStandardMaterial color="#dac493"/></mesh>
</>;}
export function ResidentLifeUI({life}:{life:ResidentLife}){
  const mapScale=(n:number)=>(n+WORLD_RADIUS)*400/(WORLD_RADIUS*2);
  const {store,menu}=useGameUI();const unlocked=lifeAchievements(life.record),done=Object.values(life.record.completed).reduce((a,b)=>a+b,0);
  const nextChapter=CAREER_CHAPTERS.find(c=>!life.record.chapters.includes(c.id));
  const bulletin=currentBulletin(life.record.daily,careerDayStamp(new Date(life.now)));
  const [shots,setShots]=useState({attempts:0,hits:0}),[meter,setMeter]=useState(0),[playing,setPlaying]=useState(false);const started=useRef(0),shotLock=useRef(false),finishLock=useRef(false);
  useEffect(()=>{if(menu!=='basketball'){setPlaying(false);return;}if(!playing)return;let frame=0;const tick=()=>{setMeter((Math.sin((performance.now()-started.current)/650)+1)/2);frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[playing,menu]);
  const shoot=()=>{if(!playing||shotLock.current||finishLock.current)return;shotLock.current=true;setTimeout(()=>{shotLock.current=false;},250);const hit=meter>.34&&meter<.66,next={attempts:shots.attempts+1,hits:shots.hits+Number(hit)};setShots(next);playGameSound(hit?'coin':'error');if(next.attempts===5){finishLock.current=true;setPlaying(false);if(next.hits>=3)life.courtWin();}};
  return <>
    <div className="resident-access"><button onClick={()=>store.open('resident-phone')}>NPC CAREER <kbd>L</kbd></button></div>
    {life.active&&<aside className="shift-tracker"><b>{life.job?.title}</b><span>{life.target?.action} · {Math.ceil(Math.hypot(life.player.x-life.target!.x,life.player.z-life.target!.z))}m</span><small>{life.active.deadline?`${Math.max(0,Math.ceil((life.active.deadline-life.now)/1000))}s · `:''}T at marker · L for details</small></aside>}
    {!life.active&&(life.near||life.nearBench||life.resting)&&menu===null&&<button className="resident-prompt" onClick={life.interact}><kbd>T</kbd> {life.resting?'Stand up':life.nearBench?'Sit on bench':life.near?.id==='coffee'?'Coffee · 10 coins':life.near?.id==='bus'?'Free shuttle to Juniper':life.near?.name}</button>}
    <GameDialog id="resident-phone" label="Resident record" className="resident-phone" onClose={()=>store.close('resident-phone')}>
      <header className="dossier-heading"><div><small>DEPARTMENT OF ORDINARY PEOPLE</small><h2>Your next questionable opportunity.</h2></div><button onClick={()=>store.close('resident-phone')} aria-label="Close resident record">×</button></header>
      <p className="resident-notice" role="status">{life.notice}</p><p>{done} shifts completed · {life.rep} reputation · {unlocked.length}/{LIFE_ACHIEVEMENTS.length} resident achievements</p>

      <section className="career-board" aria-label="NPC career progression">
        <header>
          <div><small>THE CITY'S LEAST QUALIFIED EMPLOYEE</small><h3>{nextChapter?.title||'CAREER COMPLETE · MAIN CHARACTER BY ACCIDENT'}</h3></div>
          <b>{life.record.chapters.length}/{CAREER_CHAPTERS.length} PROMOTIONS</b>
        </header>
        <p>{nextChapter?.story||'You have been promoted to honorary municipal inconvenience. Daily work still pays.'}</p>
        {nextChapter&&<>
          <div className="career-metrics">
            {careerMetrics(nextChapter,life.record,life.rep).map(m=><span key={m.label}><b>{m.label}</b><small>{m.current}/{m.required}</small></span>)}
          </div>
          <button disabled={!careerReady(nextChapter,life.record,life.rep)} onClick={()=>life.claimChapter(nextChapter.id)}>
            {careerReady(nextChapter,life.record,life.rep)?'Claim promotion · +'+nextChapter.coins+' coins / +'+nextChapter.rep+' REP':'Complete objectives to unlock promotion'}
          </button>
        </>}
        <details>
          <summary>Career milestones and district passport</summary>
          <ol className="career-chapters">{CAREER_CHAPTERS.map(ch=><li key={ch.id}><b>{life.record.chapters.includes(ch.id)?'✓ ':''}{ch.title}</b><small>{ch.story}</small></li>)}</ol>
          <p>District stamps: {life.record.visited.length}/6</p>
          <div className="career-districts">{['civic','switchyard','market','park','dock','juniper'].map((id,i)=><span key={id} className={life.record.visited.includes(id)?'earned':''}>{['Civic Square','Switchyard','Market Mile','Willow Park','Saltwater Dock','Juniper Close'][i]}</span>)}</div>
        </details>
      </section>
      <section className="city-bulletin" aria-label="Daily city bulletin">
        <header><h3>City bulletin · {bulletin.day}</h3><small>Three fresh tasks every local day</small></header>
        <div className="bulletin-grid">{DAILY_BULLETIN.map(t=><article key={t.id}>
          <b>{t.title}</b><p>{t.description}</p>
          <small>{Math.min(dailyProgress(t,bulletin),t.target)}/{t.target} · +{t.coins} coins / +{t.rep} REP</small>
          <button disabled={bulletin.claimed.includes(t.id)||dailyProgress(t,bulletin)<t.target} onClick={()=>life.claimDaily(t.id)}>
            {bulletin.claimed.includes(t.id)?'CLAIMED':dailyProgress(t,bulletin)>=t.target?'Claim daily reward':'IN PROGRESS'}
          </button>
        </article>)}</div>
      </section>
      <div className="resident-grid"><div><h3>Available shifts</h3>{JOBS.map(j=><article key={j.id}><b>{j.title}</b><p>{j.subtitle}</p><small>{j.coins} coins · +{j.rep} REP · {j.seconds?`${j.seconds}s limit`:'No timer'}</small><button disabled={!!life.active||!canStart(j,life.rep,life.record)} onClick={()=>life.start(j.id)}>{!canStart(j,life.rep,life.record)?`${j.minimum} REP${j.licence?' + club licence':''}`:'Take shift'}</button></article>)}{life.active&&<button onClick={life.cancel}>Abandon current shift</button>}</div>
      <div><h3>City services & unlocks</h3><svg viewBox="0 0 400 400" aria-label="Resident service map"><CityMapLayer size={400} details/>{life.target&&<circle cx={mapScale(life.target.x)} cy={mapScale(life.target.z)} r={8} fill="none" stroke="#ffdc83" strokeWidth={3}/>}<circle cx={mapScale(life.player.x)} cy={mapScale(life.player.z)} r={5} fill="#fff" stroke="#263a31" strokeWidth={2}><title>You are here</title></circle></svg><ol className="map-service-legend">{ACTIVITY_SITES.map(p=><li key={p.id}>{p.name}</li>)}</ol><p>T beside a bench to sit. Coffee at Market Mile gives a short sprint boost. The civic bus stop offers a free shuttle to Juniper. Play five shots at the court; score three for a reward.</p>{UPGRADES.map(u=><article key={u.id}><b>{u.name}</b><p>{u.description}</p><button disabled={life.record.upgrades.includes(u.id)} onClick={()=>life.purchase(u.id)}>{life.record.upgrades.includes(u.id)?'OWNED':`Buy · ${u.price} coins`}</button></article>)}<small>Buy at the bureau near spawn or at Juniper Motor Club.</small></div></div>
      <h3>Resident achievements</h3><div className="resident-badges">{LIFE_ACHIEVEMENTS.map(a=><span key={a.id} className={unlocked.some(u=>u.id===a.id)?'earned':''}><b>{a.name}</b><small>{a.description}</small></span>)}</div>
      {life.record.upgrades.includes('guide')&&<p>Guide scribble: check the lonely survey marker west of Willow Park at X −116, Z 27. Press T beside it.</p>}
      <p className="room-note">Shifts, purchases and achievements belong to your saved resident. Shared rooms still share cars and player presence.</p>
    </GameDialog>
    <GameDialog id="basketball" label="Juniper Court" className="court-dialog" onClose={()=>store.close('basketball')}>
      <h2>Five shots. One lamp-post fan.</h2><p>Press Shoot when the marker is inside the highlighted middle zone. Three baskets earn 12 coins and 4 reputation.</p><div className="court-meter"><span/><i style={{left:`${meter*100}%`}}/></div><p>{shots.hits} baskets / {shots.attempts} shots</p>{playing?<button onClick={shoot}>Shoot</button>:<button onClick={()=>{finishLock.current=false;shotLock.current=false;setShots({attempts:0,hits:0});started.current=performance.now();setPlaying(true);}}>Start five shots</button>}<button onClick={()=>store.close('basketball')}>Leave court</button>
    </GameDialog>
  </>;
}
