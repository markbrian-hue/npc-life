import { WORLD_RADIUS, SPAWN, blocked } from '../shared/world.mjs';
import { createFleet, stepVehicle, neutralControls, exitPosition } from '../shared/vehicles.mjs';
import { createServer } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const COLORS = ['#e5b36a', '#a3c6b0', '#c2a3cc', '#8dc5d7', '#df9385', '#c8c878', '#b3b7e0', '#e7bac7'];
const MAX_PLAYERS = 8;
export function createGameServer({ dist = resolve('dist'), now = Date.now } = {}) {
  const rooms = new Map(), sessions = new Map(), joins = new Map();
  function snapshot(room) { return { code: room.code, cars: room.cars, players: [...room.players.values()].map(({ id, name, color, x, y, z, heading, waveUntil, vehicleId }) => ({ id, name, color, x, y, z, heading, vehicleId, waving: waveUntil > now() })) }; }
  function broadcast(room) { const data = `data: ${JSON.stringify(snapshot(room))}\n\n`; for (const player of room.players.values()) if (player.stream && !player.stream.writableEnded) player.stream.write(data); }
  function remove(player) { player.stream?.end(); sessions.delete(player.token); const room = rooms.get(player.room); if (room) { for (const car of room.cars) if (car.driver === player.id) { car.driver = ''; car.speed = 0; } room.players.delete(player.id); if (!room.players.size) rooms.delete(room.code); else broadcast(room); } }
  let lastPhysics = now();
  const physics = setInterval(() => {
    const time = now(), dt = Math.min((time-lastPhysics)/1000,.1); lastPhysics=time;
    for (const room of rooms.values()) for (const car of room.cars) {
      const driver=room.players.get(car.driver);
      stepVehicle(car,driver && time-driver.lastMove<750 ? driver.controls : neutralControls(),dt,room.cars);
      if (driver) Object.assign(driver,{x:car.x,z:car.z,y:0,heading:car.heading+Math.PI/2});
    }
  }, 1000/60);
  physics.unref();
  const tick = setInterval(() => {
    for (const player of sessions.values()) if (now() - player.lastSeen > 20000) remove(player);
    for (const room of rooms.values()) broadcast(room);
    for (const [ip, entry] of joins) if (now() - entry.start > 60000) joins.delete(ip);
  }, 200);
  tick.unref();
  function reply(res, code, body) { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); }
  async function body(req) { let text = ''; for await (const chunk of req) { text += chunk; if (text.length > 2048) throw new Error('Request too large'); } return JSON.parse(text || '{}'); }
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) {
        // Same-origin requests only. Vite forwards the original Host in development.
        if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return reply(res, 403, { error: 'Use the game page on this server.' });
        if (req.headers['sec-fetch-site'] === 'cross-site') return reply(res, 403, { error: 'Cross-site request rejected.' });
        if (url.pathname === '/api/health' && req.method === 'GET') return reply(res, 200, { ok: true, maxPlayers: MAX_PLAYERS });
        if (url.pathname === '/api/join' && req.method === 'POST') {
          const ip = req.socket.remoteAddress || 'unknown';
          const entry = joins.get(ip) || { start: now(), count: 0 };
          if (now() - entry.start > 60000) { entry.start = now(); entry.count = 0; }
          entry.count++; joins.set(ip, entry);
          if (entry.count > 30) return reply(res, 429, { error: 'Too many joins. Try again in a minute.' });
          const input = await body(req);
          const name = typeof input.name === 'string' ? input.name.trim() : '';
          if (!/^[a-zA-Z0-9 _-]{1,16}$/.test(name)) return reply(res, 400, { error: 'Name: 1–16 letters, numbers, spaces, - or _.' });
          const code = typeof input.code === 'string' ? input.code.trim().toUpperCase() : '';
          let room;
          if (code) {
            if (!/^[A-F0-9]{6}$/.test(code)) return reply(res, 400, { error: 'Room codes contain six letters/numbers.' });
            room = rooms.get(code);
            if (!room) return reply(res, 404, { error: 'Room not found. Ask your friend to create one.' });
          } else {
            if (rooms.size >= 64) return reply(res, 503, { error: 'Server is full. Try again later.' });
            let nextCode; do { nextCode = randomBytes(3).toString('hex').toUpperCase(); } while (rooms.has(nextCode));
            room = { code: nextCode, players: new Map(), cars: createFleet() }; rooms.set(nextCode, room);
          }
          if (room.players.size >= MAX_PLAYERS) return reply(res, 409, { error: 'This room is full (8 residents).' });
          const taken = new Set([...room.players.values()].map(p => p.color));
          const player = { id: randomUUID(), token: randomBytes(24).toString('hex'), room: room.code, name, color: COLORS.find(c => !taken.has(c)), x: SPAWN.x, y: 0, z: SPAWN.z, heading: 0, vehicleId: '', controls: neutralControls(), waveUntil: 0, lastSeen: now(), lastMove: now(), stream: null };
          room.players.set(player.id, player); sessions.set(player.token, player);
          return reply(res, 200, { id: player.id, token: player.token, ...snapshot(room) });
        }
        const token = req.headers.authorization?.replace(/^Bearer /, '') || url.searchParams.get('token');
        const player = sessions.get(token);
        if (!player) return reply(res, 401, { error: 'Session expired. Rejoin the room.' });
        if (url.pathname === '/api/events' && req.method === 'GET') {
          player.stream?.end();
          res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
          player.stream = res;
          res.write(`data: ${JSON.stringify(snapshot(rooms.get(player.room)))}\n\n`);
          req.on('close', () => { if (player.stream === res) player.stream = null; });
          return;
        }
        if (url.pathname === '/api/leave' && req.method === 'POST') { remove(player); return reply(res, 200, { ok: true }); }
        if (url.pathname === '/api/vehicle' && req.method === 'POST') {
          const input = await body(req), room = rooms.get(player.room);
          player.lastSeen = now();
          if (input.action === 'enter') {
            const car=room.cars.find(c=>c.id===input.id);
            if (!car || car.driver || player.vehicleId || Math.abs(car.speed)>.65 || Math.hypot(player.x-car.x,player.z-car.z)>4) return reply(res,409,{error:'Walk beside an unoccupied, stopped car.'});
            car.driver=player.id; player.vehicleId=car.id; player.controls=neutralControls();
            Object.assign(player,{x:car.x,z:car.z,y:0,heading:car.heading+Math.PI/2});
            broadcast(room); return reply(res,200,{...snapshot(room)});
          }
          if (input.action === 'exit') {
            const car=room.cars.find(c=>c.driver===player.id);
            const position=car && exitPosition(car,room.cars);
            if (!position) return reply(res,409,{error:'Stop the car where a door has clear space before exiting.'});
            car.driver=''; car.speed=0; player.vehicleId=''; player.controls=neutralControls(); Object.assign(player,position);
            broadcast(room); return reply(res,200,{position,...snapshot(room)});
          }
          return reply(res,400,{error:'Invalid vehicle action.'});
        }
        if (url.pathname === '/api/move'  && req.method === 'POST') {
          const input = await body(req);
          if (![input.x, input.y, input.z, input.heading].every(Number.isFinite) || Math.abs(input.x) > WORLD_RADIUS || Math.abs(input.z) > WORLD_RADIUS || input.y < 0 || input.y > 30 || Math.abs(input.heading) > 1000) return reply(res, 400, { error: 'Invalid position.' });
          player.lastSeen = now();
          if (now() - player.lastMove < 70) return reply(res, 429, { error: 'Movement rate exceeded.' });
          // Presence relay only; personal progression is never accepted by this server.
          player.lastMove=now();
          const c=input.controls;
          player.controls=c && [-1,0,1].includes(c.throttle) && [-1,0,1].includes(c.steer) && typeof c.brake==='boolean' ? c : neutralControls();
          if (!player.vehicleId && !blocked(input.x,input.z)) Object.assign(player, { x: input.x, y: input.y, z: input.z, heading: input.heading });
          if (input.wave === true) player.waveUntil = now() + 1600;
          return reply(res, 200, { ok: true });
        }
        return reply(res, 404, { error: 'Unknown endpoint.' });
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return reply(res, 405, { error: 'Method not allowed' });
      const pathname = decodeURIComponent(url.pathname);
      let file = resolve(dist, `.${pathname === '/' ? '/index.html' : pathname}`);
      if (file !== dist && !file.startsWith(dist + sep)) return reply(res, 403, { error: 'Forbidden' });
      try { if (!(await stat(file)).isFile()) throw new Error(); } catch { file = resolve(dist, 'index.html'); }
      const data = await readFile(file);
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
      res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' }); res.end(req.method === 'HEAD' ? undefined : data);
    } catch (error) { if (!res.headersSent) reply(res, 400, { error: error.code === 'ENOENT' ? 'Build the game with npm run build first.' : 'Invalid request.' }); else res.end(); }
  });
  server.on('close', () => { clearInterval(tick); clearInterval(physics); for (const player of sessions.values()) player.stream?.end(); });
  server.requestTimeout = 10000;
  return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3001);
  createGameServer().listen(port, '0.0.0.0', () => console.log(`NPC LIFE server: http://localhost:${port} (8 residents per room)`));
}
