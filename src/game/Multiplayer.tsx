import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, type Group } from 'three';
import { WorldSign } from './DistrictWorld';
import { GameDialog } from './ui/GameDialog';
import { isTyping, useGameUI } from './ui/GameUI';

export type Resident = { id: string; name: string; color: string; x: number; y: number; z: number; heading: number; waving: boolean };
type Session = { id: string; token: string; code: string };
export function useMultiplayer() {
  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Resident[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const local = useRef({ x: 0, y: 0, z: 0, heading: 0, wave: false });
  const joining = useRef(false);
  useEffect(() => {
    const position = (event: Event) => { const p = (event as CustomEvent).detail; local.current = { ...local.current, x: p.x, y: p.y || 0, z: p.z, heading: p.heading }; };
    const wave = () => { local.current.wave = true; };
    window.addEventListener('npc-life:position', position); window.addEventListener('npc-life:wave', wave);
    return () => { window.removeEventListener('npc-life:position', position); window.removeEventListener('npc-life:wave', wave); };
  }, []);
  const join = useCallback(async (name: string, code = '') => {
    if (joining.current) return;
    joining.current = true; setBusy(true); setError('');
    try {
      const response = await fetch('/api/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, code }), signal: AbortSignal.timeout(6000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not join room.');
      setSession({ id: data.id, token: data.token, code: data.code }); setPlayers(data.players);
    } catch (e) {
      setError(e instanceof Error && !['SyntaxError', 'TimeoutError', 'TypeError'].includes(e.name) ? e.message : 'Multiplayer server unavailable. Start the game with npm run dev:multi, or connect to a running host.');
    } finally { joining.current = false; setBusy(false); }
  }, []);
  useEffect(() => {
    if (!session) return;
    let active = true, sending = false;
    const events = new EventSource(`/api/events?token=${encodeURIComponent(session.token)}`);
    events.onmessage = event => {
      if (!active) return;
      try { const data = JSON.parse(event.data); if (Array.isArray(data.players)) { setPlayers(data.players); setConnected(true); setError(''); } } catch { /* Ignore incomplete packets. */ }
    };
    events.onerror = () => { if (active) { setConnected(false); setError('Connection interrupted. Reconnecting…'); } };
    const send = async () => {
      if (sending) return; sending = true;
      const data = { ...local.current }; local.current.wave = false;
      try {
        const response = await fetch('/api/move', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify(data), signal: AbortSignal.timeout(4000) });
        if (response.status === 401 && active) { setSession(null); setError('Your session expired. Join the room again.'); }
      } catch { if (active) setConnected(false); }
      finally { sending = false; }
    };
    void send();
    const timer = window.setInterval(send, 200);
    const leave = () => { void fetch('/api/leave', { method: 'POST', headers: { Authorization: `Bearer ${session.token}` }, keepalive: true }).catch(() => {}); };
    window.addEventListener('pagehide', leave);
    return () => { active = false; events.close(); window.clearInterval(timer); window.removeEventListener('pagehide', leave); leave(); setConnected(false); setPlayers([]); };
  }, [session]);
  return { session, players, connected, error, busy, join, leave: () => setSession(null) };
}
export type Multiplayer = ReturnType<typeof useMultiplayer>;
export function MultiplayerMenu({ multiplayer }: { multiplayer: Multiplayer }) {
  const { store } = useGameUI();
  const [name, setName] = useState('Resident');
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.code === 'KeyN' && !event.repeat && !isTyping(event.target) && store.getSnapshot() === null) store.open('multiplayer'); };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [store]);
  const { session, players, connected, error, busy, join, leave } = multiplayer;
  return <>
    <div className="room-control"><button onClick={() => store.open('multiplayer')}>{session && connected && <span className="online-dot" />}{session ? `${connected ? 'ROOM' : 'CONNECTING'} ${session.code} · ${players.length}/8` : 'PLAY WITH FRIENDS'} <kbd>N</kbd></button></div>
    <GameDialog id="multiplayer" label="Play with friends" className="multiplayer-menu" onClose={() => store.close('multiplayer')}>
      <header className="dossier-heading"><div><small>IDIOT CITY / RESIDENT ASSEMBLY</small><h2>{session ? `Room ${session.code}` : 'Better with other idiots.'}</h2></div><button onClick={() => store.close('multiplayer')} aria-label="Close multiplayer">×</button></header>
      {session ? <>
        <p>{connected ? 'Connected' : 'Connecting'} · {players.length} of 8 residents. Share this room code with friends on the same game server.</p>
        <ul className="room-roster">{players.map(p => <li key={p.id}><i style={{ background: p.color }} /><strong>{p.name}</strong><small>{p.id === session.id ? 'YOU' : p.waving ? 'WAVING' : 'IN THE CITY'}</small></li>)}</ul>
        <div className="room-actions"><button onClick={async () => { try { await navigator.clipboard.writeText(session.code); setCopied(true); } catch { setCopied(false); } }}>{copied ? 'Code copied' : 'Copy room code'}</button><button onClick={() => store.close('multiplayer')}>Return to city</button><button onClick={leave}>Leave room</button></div>
      </> : <>
        <p>Explore the five districts together. See your friends move, jump, and wave with <kbd>B</kbd>. Up to eight residents per room.</p>
        <label>RESIDENT NAME<input value={name} onChange={e => setName(e.target.value)} maxLength={16} autoComplete="nickname" /></label>
        <div className="room-actions"><button disabled={busy || !name.trim()} onClick={() => void join(name)}>Create room</button></div>
        <label>HAVE A ROOM CODE?<input value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" autoComplete="off" /></label>
        <button disabled={busy || !name.trim() || code.length !== 6} onClick={() => void join(name, code)}>{busy ? 'Connecting…' : 'Join room'}</button>
      </>}
      {error && <p className="room-error" role="status">{error}</p>}
      <p className="room-note">This first multiplayer slice shares movement and waves. Missions, district restoration, coins, and saves are personal. Rooms close when everyone leaves.</p>
    </GameDialog>
  </>;
}
function RemoteResident({ player }: { player: Resident }) {
  const actor = useRef<Group>(null), label = useRef<Group>(null), arm = useRef<Group>(null), legs = useRef<Group>(null);
  const previous = useRef({ x: player.x, z: player.z });
  const initialPosition = useRef<[number, number, number]>([player.x, player.y, player.z]);
  useFrame(({ camera, clock }, dt) => {
    if (!actor.current) return;
    const group = actor.current;
    const movement = Math.hypot(player.x - previous.current.x, player.z - previous.current.z);
    group.position.x = MathUtils.damp(group.position.x, player.x, 12, dt);
    group.position.z = MathUtils.damp(group.position.z, player.z, 12, dt);
    group.position.y = MathUtils.damp(group.position.y, player.y, 12, dt);
    const angle = Math.atan2(Math.sin(player.heading - group.rotation.y), Math.cos(player.heading - group.rotation.y));
    group.rotation.y += angle * (1 - Math.exp(-12 * dt));
    if (arm.current) arm.current.rotation.z = player.waving ? -2.3 + Math.sin(clock.elapsedTime * 14) * .3 : -.08;
    if (legs.current) legs.current.rotation.x = movement > .03 ? Math.sin(clock.elapsedTime * 10) * .25 : 0;
    if (label.current) label.current.rotation.y = Math.atan2(camera.position.x - group.position.x, camera.position.z - group.position.z) - group.rotation.y;
    previous.current = { x: group.position.x, z: group.position.z };
  });
  return <group ref={actor} position={initialPosition.current}>
    <mesh position={[0, 1.3, 0]} castShadow><boxGeometry args={[.95, 1.1, .6]} /><meshStandardMaterial color={player.color} /></mesh>
    <mesh position={[0, 2.2, 0]} castShadow><boxGeometry args={[.85, .85, .8]} /><meshStandardMaterial color="#e8c49d" /></mesh>
    <mesh position={[0, 2.65, 0]}><boxGeometry args={[.92, .18, .88]} /><meshStandardMaterial color="#534a40" /></mesh>
    {[-.2, .2].map(x => <mesh key={x} position={[x, 2.26, .41]}><boxGeometry args={[.1, .12, .03]} /><meshBasicMaterial color="#303933" /></mesh>)}
    <group ref={legs}>{[-.26, .26].map(x => <mesh key={x} position={[x, .38, 0]} castShadow><boxGeometry args={[.34, .76, .42]} /><meshStandardMaterial color="#475765" /></mesh>)}</group>
    <group ref={arm} position={[.64, 1.7, 0]}><mesh position={[0, -.4, 0]}><boxGeometry args={[.25, .85, .3]} /><meshStandardMaterial color="#e8c49d" /></mesh></group>
    <mesh position={[-.64, 1.3, 0]}><boxGeometry args={[.25, .85, .3]} /><meshStandardMaterial color="#e8c49d" /></mesh>
    <group ref={label} position={[0, 3.3, 0]}><WorldSign text={player.name} color={player.color} width={3.5} /></group>
  </group>;
}
export function RemoteResidents({ multiplayer }: { multiplayer: Multiplayer }) {
  return <>{multiplayer.players.filter(p => p.id !== multiplayer.session?.id).map(p => <RemoteResident key={p.id} player={p} />)}</>;
}
