import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'vite';
import { createGameServer } from '../server/multiplayer.mjs';
const { chromium } = await import(process.env.NPC_LIFE_PLAYWRIGHT_MODULE || 'playwright');
const output = process.env.NPC_LIFE_QA_OUTPUT || 'qa-output'; await mkdir(output, { recursive: true });
const game = createGameServer(); await new Promise(r => game.listen(3001, '127.0.0.1', r));
const vite = await createServer({ server: { host: '127.0.0.1', port: 5182, strictPort: true } }); await vite.listen();
let browser;
const errors = [];
try {
  browser = await chromium.launch({ headless: true, ...(process.env.NPC_LIFE_CHROMIUM ? { executablePath: process.env.NPC_LIFE_CHROMIUM } : {}), args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await context.addInitScript(startAt => {
    if (startAt === 9 && !sessionStorage.getItem('qa-seeded')) {
      localStorage.setItem('npc-life:city-revival-v1', JSON.stringify({ step: 9, deliveries: 0 }));
      localStorage.setItem('npc-life:coins-v1', '515');
      sessionStorage.setItem('qa-seeded', '1');
    }
    window.__position = { x: 0, z: 0 };
    window.addEventListener('npc-life:position', e => window.__position = e.detail);
    localStorage.setItem('npc-life:orientation-v1', JSON.stringify({ status: 'skipped', distance: 20, visitedGary: true, visitedArcade: true }));
  }, Number(process.env.NPC_CITY_START_AT || 0));
  const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:5182'); await page.getByRole('dialog').waitFor(); await page.keyboard.press('Escape');
  await page.keyboard.press('c'); await page.getByRole('dialog', { name: 'City journal' }).waitFor();
  await page.screenshot({ path: `${output}/city-journal.png` });
  await page.keyboard.press('Escape');
  async function walkSegment(x, z) {
    let held = [];
    try {
      for (let step = 0; step < 300; step++) {
        const p = await page.evaluate(() => window.__position);
        const dx = x - p.x, dz = z - p.z, distance = Math.hypot(dx, dz);
        if (distance < .8) return;
        const side = Math.cos(.6) * dx - Math.sin(.6) * dz, forward = -Math.sin(.6) * dx - Math.cos(.6) * dz;
        const max = Math.max(Math.abs(side), Math.abs(forward));
        const next = distance > 4 ? ['Shift'] : [];
        if (Math.abs(side) > max * .4) next.push(side > 0 ? 'd' : 'a');
        if (Math.abs(forward) > max * .4) next.push(forward > 0 ? 'w' : 's');
        for (const key of held) if (!next.includes(key)) await page.keyboard.up(key);
        for (const key of next) if (!held.includes(key)) await page.keyboard.down(key);
        held = next; await page.waitForTimeout(distance > 4 ? 220 : 90);
      }
      throw new Error(`Route blocked to ${x},${z}: ${JSON.stringify(await page.evaluate(() => window.__position))}`);
    } finally { for (const key of held) await page.keyboard.up(key); await page.waitForTimeout(200); }
  }
  async function walkTo(x, z) {
    const start = await page.evaluate(() => window.__position);
    const count = Math.max(1, Math.ceil(Math.hypot(x - start.x, z - start.z) / 5));
    for (let i = 1; i <= count; i++) await walkSegment(start.x + (x - start.x) * i / count, start.z + (z - start.z) * i / count);
  }
  const progress = () => page.evaluate(() => JSON.parse(localStorage.getItem('npc-life:city-revival-v1') || '{"step":0,"deliveries":0}'));
  // Real keyboard movement through all five districts; no teleport debug hooks.
  const routes = [
    [[0,-11],[6,-11]], [[0,-11],[0,-46],[-7,-46]], [[0,-46],[0,-60],[6,-60]],
    [[0,-60],[0,61],[-6,61]], [[0,61],[0,0],[60,0],[60,6]], [[60,0],[70,0],[70,-6]],
    [[70,0],[-60,0],[-60,-6]], [[-60,0],[0,0],[0,70],[6,70]], [[0,70],[0,-11],[6,-11]],
  ];
  if (!process.env.NPC_CITY_ONLY_NETWORK) {
  for (let i = Number(process.env.NPC_CITY_START_AT || 0); i < routes.length; i++) {
    for (const [x,z] of routes[i]) await walkTo(x,z);
    if (i === 0) {
      await page.keyboard.down('q'); await page.waitForTimeout(250); await page.keyboard.up('q');
      assert.equal((await progress()).step, 0, 'partial hold must not finish work');
      await page.waitForTimeout(150);
    }
    await page.keyboard.down('q'); await page.waitForFunction(step => JSON.parse(localStorage.getItem('npc-life:city-revival-v1') || '{"step":0}').step === step, i + 1, { timeout: 12000 });
    await page.waitForTimeout(250); await page.keyboard.up('q');
    assert.equal((await progress()).step, i + 1, 'hold rewards exactly once');
    if ([2,4,6,7,8].includes(i)) await page.screenshot({ path: `${output}/district-${i}.png` });
    console.log(`PASS city mission ${i + 1}/9 through real movement`);
  }
  assert.equal(await page.evaluate(() => localStorage.getItem('npc-life:coins-v1')), '515');
  // Complete a repeatable courier delivery.
  for (const [x,z] of [[0,-11],[0,0],[60,0],[60,6]]) await walkTo(x,z);
  await page.keyboard.down('q'); await page.waitForTimeout(2300); await page.keyboard.up('q');
  assert.equal((await progress()).deliveries, 0);
  assert.equal(await page.evaluate(() => localStorage.getItem('npc-life:coins-v1')), '515');
  for (const [x,z] of [[60,0],[0,0],[0,-60],[6,-60]]) await walkTo(x,z);
  await page.keyboard.down('q'); await page.waitForFunction(() => JSON.parse(localStorage.getItem('npc-life:city-revival-v1')).deliveries === 1); await page.keyboard.up('q');
  assert.equal(await page.evaluate(() => localStorage.getItem('npc-life:coins-v1')), '560');
  await page.reload(); await page.getByRole('dialog').waitFor(); await page.keyboard.press('Escape');
  assert.deepEqual(await progress(), { step: 9, deliveries: 1 }); console.log('PASS campaign completion, courier rewards and reload persistence');
  }
  // Two separate storage contexts on the same real room server.
  await page.keyboard.press('n'); await page.getByLabel('RESIDENT NAME').fill('Alice'); await page.getByRole('button', { name: 'Create room', exact: true }).click();
  await page.getByRole('heading', { name: /^Room / }).waitFor().catch(async error => { console.log(await page.getByRole('dialog').innerText()); await page.screenshot({ path: `${output}/room-failure.png` }); throw error; });
  const code = (await page.getByRole('heading', { name: /^Room / }).innerText()).split(' ')[1];
  const second = await browser.newContext({ viewport: { width: 1100, height: 760 } });
  await second.addInitScript(() => { window.__position = { x: 0, z: 0 }; window.addEventListener('npc-life:position', e => window.__position = e.detail); });
  const guest = await second.newPage(); guest.on('pageerror', e => errors.push(e.message));
  await guest.goto('http://127.0.0.1:5182'); await guest.getByRole('button', { name: 'Skip, I live here already' }).click();
  await guest.keyboard.press('n'); await guest.getByLabel('RESIDENT NAME').fill('Bob'); await guest.getByLabel('HAVE A ROOM CODE?').fill(code); await guest.getByRole('button', { name: 'Join room', exact: true }).click();
  await guest.getByRole('heading', { name: `Room ${code}` }).waitFor();
  await page.getByText('Bob', { exact: true }).waitFor();
  await guest.getByRole('button', { name: 'Return to city' }).click();
  const positionBefore = await page.evaluate(() => window.__position);
  await guest.waitForTimeout(300);
  await guest.keyboard.down('w'); await guest.waitForFunction(() => Math.hypot(window.__position.x, window.__position.z) > 2); await guest.keyboard.up('w'); await guest.keyboard.press('b');
  await page.getByText('WAVING', { exact: true }).waitFor();
  const positionAfter = await page.evaluate(() => window.__position);
  assert.ok(Math.hypot(positionAfter.x-positionBefore.x, positionAfter.z-positionBefore.z) < .05, 'host dialog locks only host');
  await page.screenshot({ path: `${output}/multiplayer-room.png` });
  await page.getByRole('button', { name: 'Return to city' }).click(); await page.screenshot({ path: `${output}/multiplayer-world.png` });
  await guest.keyboard.press('n'); await guest.getByRole('button', { name: 'Leave room', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.room-control').textContent.includes('1/8'));
  console.log('PASS two-browser room join, live waves, local dialog isolation and disconnect');
  for (const [width,height] of [[390,844],[768,600]]) {
    await page.setViewportSize({width,height}); await page.keyboard.press('c');
    const rect = await page.getByRole('dialog', { name: 'City journal' }).boundingBox();
    assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= width + 1 && rect.y + rect.height <= height + 1);
    await page.screenshot({ path: `${output}/city-${width}.png` }); await page.keyboard.press('Escape');
    await page.screenshot({ path: `${output}/city-hud-${width}.png` });
    const map = await page.locator('.alpha8-minimap').boundingBox();
    assert.ok(map.height < 300, 'minimap should not stretch between top and bottom in portrait');
  }
  assert.deepEqual(errors, []); console.log('PASS responsive city journal and no browser errors');
} finally { await browser?.close(); await vite.close(); game.closeAllConnections(); await new Promise(r => game.close(r)); }
