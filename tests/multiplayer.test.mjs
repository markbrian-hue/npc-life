import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGameServer } from '../server/multiplayer.mjs';

test('rooms isolate residents, relay movement, enforce limits and expire sessions', async () => {
  let time = Date.now();
  const server = createGameServer({ now: () => time });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, data, token, headers = {}) => {
    const r = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, body: JSON.stringify(data) });
    return { status: r.status, ...await r.json() };
  };
  let reader;
  try {
    const host = await request('/api/join', { name: 'Host' }); assert.equal(host.status, 200);
    const guest = await request('/api/join', { name: 'Guest', code: host.code }); assert.equal(guest.players.length, 2);
    const separate = await request('/api/join', { name: 'Other' }); assert.notEqual(separate.code, host.code); assert.equal(separate.players.length, 1);
    const events = await fetch(`${base}/api/events?token=${guest.token}`); reader = events.body.getReader();
    const decode = chunk => JSON.parse(new TextDecoder().decode(chunk).trim().slice(6));
    assert.equal(decode((await reader.read()).value).players.length, 2);
    time += 200;
    const moved = await request('/api/move', { x: 18, y: 2, z: 4, heading: 1.3, wave: true }, host.token); assert.equal(moved.status, 200);
    const update = decode((await reader.read()).value);
    const remote = update.players.find(p => p.id === host.id);
    assert.equal(remote.x, 18); assert.equal(remote.y, 2); assert.equal(remote.waving, true);
    assert.ok(!update.players.some(p => p.id === separate.id));
    assert.ok(!JSON.stringify(update).includes(host.token));
    assert.equal((await request('/api/move', { x: 999, y: 0, z: 0, heading: 0 }, host.token)).status, 400);
    assert.equal((await request('/api/move', { x: 0, y: 0, z: 0, heading: 0 }, 'fake')).status, 401);
    assert.equal((await request('/api/join', { name: 'Bad' }, null, { Origin: 'https://other.example' })).status, 403);
    for (let i = 0; i < 6; i++) assert.equal((await request('/api/join', { name: `Resident${i}`, code: host.code })).status, 200);
    assert.equal((await request('/api/join', { name: 'Overflow', code: host.code })).status, 409);
    await reader.cancel(); reader = null;
    assert.equal((await request('/api/leave', {}, guest.token)).status, 200);
    assert.equal((await request('/api/join', { name: 'Replacement', code: host.code })).status, 200);
    time += 21000; await new Promise(resolve => setTimeout(resolve, 250));
    assert.equal((await request('/api/move', { x: 0, y: 0, z: 0, heading: 0 }, host.token)).status, 401);
    assert.equal((await request('/api/join', { name: 'Late', code: host.code })).status, 404);
  } finally { await reader?.cancel(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
