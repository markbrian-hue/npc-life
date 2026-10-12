import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'vite';
import { resolve } from 'node:path';
async function source(entry) {
  const result = await build({ configFile: false, publicDir: false, logLevel: 'silent', build: { write: false, minify: false, lib: { entry: resolve(entry), formats: ['es'] } } });
  const [{ output }] = Array.isArray(result) ? result : [result];
  return import(`data:text/javascript;base64,${Buffer.from(output.find(p => p.type === 'chunk').code).toString('base64')}`);
}
const { WORLD_RADIUS, blocked } = await source('src/game/world.ts');
const { MISSIONS, CONTRACTS, currentTask, validateCampaign, loadCampaign } = await source('src/game/campaign.ts');
test('all campaign and courier targets are reachable from spawn through collision geometry', () => {
  const seen = new Set(['0,0']), queue = [[0, 0]];
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz, key = `${nx},${nz}`;
      if (!seen.has(key) && !blocked(nx, nz)) { seen.add(key); queue.push([nx, nz]); }
    }
  }
  for (const p of [...MISSIONS, ...CONTRACTS.flatMap(c => [c.from, c.to])]) assert.ok(seen.has(`${p.x},${p.z}`), `unreachable: ${JSON.stringify(p)}`);
  assert.ok(seen.size > 18000);
  assert.equal(blocked(WORLD_RADIUS + 1, 0), true);
  assert.equal(blocked(40, 80), true, 'cannot walk into harbor water');
  assert.equal(blocked(0, 82), false, 'pier is accessible');
});
test('campaign persists valid progress and rejects corrupt imported values', () => {
  assert.deepEqual(validateCampaign({ step: 9, deliveries: 2, extra: true }), { step: 9, deliveries: 2 });
  for (const bad of [null, {}, { step: -1, deliveries: 0 }, { step: 10, deliveries: 0 }, { step: 2.5, deliveries: 0 }, { step: 1, deliveries: Infinity }]) assert.throws(() => validateCampaign(bad));
  globalThis.localStorage = { getItem: () => '{broken' };
  assert.deepEqual(loadCampaign(), { step: 0, deliveries: 0 });
});
test('post-campaign courier loop alternates pickup and delivery without pickup rewards', () => {
  for (let deliveries = 0; deliveries < 6; deliveries++) {
    const state = { step: MISSIONS.length, deliveries };
    const pickup = currentTask(state, false), delivery = currentTask(state, true);
    assert.equal(pickup.coins, 0); assert.equal(delivery.coins, 45);
    assert.equal(delivery.x, CONTRACTS[deliveries % 3].to.x);
    assert.equal(delivery.z, CONTRACTS[deliveries % 3].to.z);
  }
});

test('camera avoids the new market awnings while open street views retain their distance', async () => {
  const { safeCameraDistance } = await source('src/game/cameraCollision.ts');
  assert.ok(safeCameraDistance({ x: 60, y: 1.7, z: 6 }, { x: 0, y: 0, z: 1 }, 13) < 3);
  assert.equal(safeCameraDistance({ x: 0, y: 2, z: 0 }, { x: 0, y: 1, z: 0 }, 13), 13);
});
