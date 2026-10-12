import { useCallback, useEffect, useRef, useState } from 'react';
import { CAMPAIGN_KEY, DISTRICTS, MISSIONS, currentTask, districtAt, loadCampaign, type Campaign } from './campaign';
import { GameDialog } from './ui/GameDialog';
import { isTyping, useGameUI } from './ui/GameUI';
import { BUILDINGS, WORLD_RADIUS } from './world';

export function useCityRevival(player: { x: number; z: number }, onReward: (coins: number, rep: number, message: string) => void) {
  const [campaign, setCampaign] = useState(loadCampaign);
  const [carrying, setCarrying] = useState(false);
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const { store, menu } = useGameUI();
  const task = currentTask(campaign, carrying);
  const distance = Math.hypot(player.x - task.x, player.z - task.z);
  const ready = distance <= 3 && menu === null;
  const state = useRef({ campaign, carrying, player, onReward });
  state.current = { campaign, carrying, player, onReward };
  const complete = useCallback(() => {
    const { campaign: previous, carrying: cargo, player: pos, onReward: reward } = state.current;
    const nextTask = currentTask(previous, cargo);
    if (store.getSnapshot() !== null || Math.hypot(pos.x - nextTask.x, pos.z - nextTask.z) > 3) return;
    let next: Campaign = previous;
    if (previous.step < MISSIONS.length) next = { ...previous, step: previous.step + 1 };
    else if (cargo) next = { ...previous, deliveries: previous.deliveries + 1 };
    const nextCargo = previous.step >= MISSIONS.length && !cargo;
    // Update the ref before React commits so one hold can never claim twice.
    state.current.campaign = next; state.current.carrying = nextCargo;
    setCampaign(next); setCarrying(nextCargo);
    let warning = '';
    try { localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(next)); }
    catch { warning = ' Storage unavailable: progress lasts for this session.'; }
    reward(nextTask.coins, nextTask.rep, `${nextTask.action}: DONE.${nextTask.coins ? ` +${nextTask.coins} coins` : ''}${warning}`);
  }, [store]);
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code === 'KeyC' && !event.repeat && !isTyping(event.target) && store.getSnapshot() === null) store.open('city-journal');
      if (event.code === 'KeyQ' && !event.repeat && !isTyping(event.target) && ready && store.getSnapshot() === null) { event.preventDefault(); setWorking(true); }
    };
    const up = (event: KeyboardEvent) => { if (event.code === 'KeyQ') setWorking(false); };
    const cancel = () => setWorking(false);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', cancel);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', cancel); };
  }, [ready, store]);
  useEffect(() => {
    if (!working || !ready) { setWorking(false); setProgress(0); return; }
    const started = performance.now();
    const timer = window.setInterval(() => {
      const value = Math.min(1, (performance.now() - started) / (task.seconds * 1000));
      setProgress(value);
      if (value >= 1) { window.clearInterval(timer); setWorking(false); setProgress(0); complete(); }
    }, 40);
    return () => window.clearInterval(timer);
  }, [working, ready, task.id, task.seconds, complete]);
  return { campaign, carrying, task, distance, ready, progress, working, setWorking };
}
export type Revival = ReturnType<typeof useCityRevival>;
export function CityRevival({ revival, player }: { revival: Revival; player: { x: number; z: number } }) {
  const { campaign, task, distance, ready, progress, setWorking } = revival;
  const { store } = useGameUI();
  const district = districtAt(player.x, player.z);
  const completed = campaign.step >= MISSIONS.length;
  const scale = (n: number) => (n + WORLD_RADIUS) / (WORLD_RADIUS * 2) * 400;
  const unit = 400 / (WORLD_RADIUS * 2);
  const north = task.z < player.z - 3, south = task.z > player.z + 3, east = task.x > player.x + 3, west = task.x < player.x - 3;
  const bearing = `${north ? 'N' : south ? 'S' : ''}${east ? 'E' : west ? 'W' : ''}` || 'HERE';
  return <>
    <section className="revival-tracker" aria-label="City revival mission">
      <div className="revival-kicker"><span>{completed ? 'CITY KEEPER / COURIER' : `CITY REVIVAL / ${campaign.step + 1} OF ${MISSIONS.length}`}</span><button onClick={() => store.open('city-journal')} aria-label="Open city journal C">C ↗</button></div>
      <h2>{task.title}</h2>
      <p>{ready ? task.action : `${bearing} · ${Math.ceil(distance)}m to objective`}</p>
      <div className="district-status">{DISTRICTS.slice(1).map((d, i) => <span key={d.id} className={campaign.step > [2, 4, 6, 7][i] ? 'restored' : ''}>{d.name}</span>)}</div>
      {ready && <button className="mission-hold" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); setWorking(true); }} onPointerUp={() => setWorking(false)} onPointerCancel={() => setWorking(false)} onLostPointerCapture={() => setWorking(false)} onKeyDown={e => { if (!e.repeat && ['Space', 'Enter'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); setWorking(true); } }} onKeyUp={e => { if (['Space', 'Enter'].includes(e.code)) { e.stopPropagation(); setWorking(false); } }} onBlur={() => setWorking(false)}>
        <span style={{ width: `${progress * 100}%` }} /><b>HOLD Q · {task.action}</b>
      </button>}
    </section>
    <div className="district-location"><span style={{ background: district.color }} />{district.name}<small>{completed ? 'CITY KEEPER' : 'RESIDENT ON DUTY'}</small></div>
    <GameDialog id="city-journal" label="City journal" className="city-journal" onClose={() => store.close('city-journal')}>
      <header className="dossier-heading"><div><small>DEPARTMENT OF GETTING THINGS DONE</small><h2>The city is your quest.</h2></div><button onClick={() => store.close('city-journal')} aria-label="Close city journal">×</button></header>
      <p>Restore four districts. Reopen the festival. Become the NPC this city accidentally needed.</p>
      <div className="journal-layout">
        <svg viewBox="0 0 400 400" role="img" aria-label="Full city map with your location and current objective">
          <rect width="400" height="400" fill="#84997a" /><rect y={scale(75)} width="400" height="40" fill="#548991" />
          <path d="M0 200H400M200 0V400" stroke="#c4bba1" strokeWidth="30" /><path d="M0 200H400M200 0V400" stroke="#566c69" strokeWidth="19" />
          {BUILDINGS.map((b, i) => <rect key={i} x={scale(b.x - b.w / 2)} y={scale(b.z - b.d / 2)} width={b.w * unit} height={b.d * unit} fill={b.roof} stroke="#d0c5a5" />)}
          {DISTRICTS.map(d => <g key={d.id}><circle cx={scale(d.x)} cy={scale(d.z)} r="9" fill={d.color} /><text x={scale(d.x)} y={scale(d.z) + 23} textAnchor="middle" fill="#fff4d6" stroke="#243a35" strokeWidth="3" paintOrder="stroke" fontSize="12" fontWeight="bold">{d.name}</text></g>)}
          <circle cx={scale(task.x)} cy={scale(task.z)} r="12" fill="none" stroke="#ffdf83" strokeWidth="3" /><text x={scale(task.x)} y={scale(task.z) + 4} textAnchor="middle" fill="#fff3bf" fontSize="15">!</text>
          <circle cx={scale(player.x)} cy={scale(player.z)} r="5" fill="#fff" stroke="#152b29" strokeWidth="2" />
        </svg>
        <div><small className="journal-label">{completed ? 'REPEATABLE CONTRACT' : 'TRACKED OBJECTIVE'}</small><h3>{task.title}</h3><p>{task.description}</p><p className="journal-reward">◆ {task.coins} COINS · +{task.rep} REP</p><p>Follow the gold marker. Hold <kbd>Q</kbd> beside it to work. Leaving the marker cancels the action.</p><button onClick={() => store.close('city-journal')}>Back to the streets</button></div>
      </div>
      <ol className="mission-log">{MISSIONS.map((m, i) => <li key={m.id} className={i < campaign.step ? 'done' : i === campaign.step ? 'current' : ''}><span>{i < campaign.step ? '✓' : String(i + 1).padStart(2, '0')}</span><div><strong>{m.title}</strong><small>{DISTRICTS.find(d => d.id === m.district)?.name}</small></div><b>{i < campaign.step ? 'DONE' : i === campaign.step ? 'ACTIVE' : 'LOCKED'}</b></li>)}</ol>
      {completed && <p>City Keeper earned. Courier contracts completed: {campaign.deliveries}. New contracts cycle between the restored districts.</p>}
    </GameDialog>
  </>;
}
