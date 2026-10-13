import assert from 'node:assert/strict';
import { walkingRoute } from './pathing.mjs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer } from 'vite';

// Optional browser tooling, deliberately separate from production dependencies.
const { chromium } = await import(process.env.NPC_LIFE_PLAYWRIGHT_MODULE || 'playwright');
const output = resolve(process.env.NPC_LIFE_QA_OUTPUT || 'qa-output');
await mkdir(output, { recursive: true });
const server = await createServer({ server: { hmr: false, host: '127.0.0.1', port: 5181, strictPort: true } });
await server.listen();
let browser;
const launchOptions = {
  headless: true,
  ...(process.env.NPC_LIFE_CHROMIUM ? { executablePath: process.env.NPC_LIFE_CHROMIUM } : {}),
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
};
let checks = 0;
const pass = message => { checks++; console.log(`PASS ${message}`); };
const errors = [];
try {
  browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await context.addInitScript(() => {
    window.__npcQA = { position: { x: 0, z: 0 }, samples: 0 };
    window.addEventListener('npc-life:position', event => {
      window.__npcQA.position = event.detail;
      window.__npcQA.samples++;
    });
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5181/');
  await page.getByRole('dialog', { name: 'Welcome to Idiot City' }).waitFor();
  await page.waitForFunction(() => window.__npcQA.samples > 1);
  const position = () => page.evaluate(() => window.__npcQA.position);
  const stable = (a, b) => Math.hypot(a.x - b.x, a.z - b.z) < 0.025;
  const initial = await position();
  await page.keyboard.down('w');
  await page.waitForTimeout(350);
  await page.keyboard.up('w');
  for (const key of ['i', 'j', 'k', 'm', 'p', 'h', 'f', 'e', 'Space']) await page.keyboard.press(key);
  assert.equal(await page.getByRole('dialog').count(), 1);
  assert.ok(stable(initial, await position()));
  pass('fresh onboarding owns input and blocks competing menus');
  await page.screenshot({ path: `${output}/welcome.png` });
  await page.getByRole('button', { name: 'Skip, I live here already' }).click();
  assert.equal(await page.getByRole('dialog').count(), 0);
  pass('onboarding dismisses cleanly');
  await page.screenshot({ path: `${output}/hud.png` });

  // Hold a key while opening a dialog, release it inside, then verify no drift.
  await page.keyboard.down('w');
  await page.waitForTimeout(350);
  await page.keyboard.press('p');
  await page.getByRole('dialog', { name: 'NPC LIFE game menu' }).waitFor();
  await page.keyboard.up('w');
  await page.waitForTimeout(200);
  const stopped = await position();
  await page.keyboard.down('w');
  await page.waitForTimeout(300);
  await page.keyboard.up('w');
  assert.ok(stable(stopped, await position()));
  pass('release menu locks local movement');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  assert.equal(await page.getByRole('dialog').count(), 0);
  assert.ok(stable(stopped, await position()));
  pass('Escape closes one dialog and held keys do not drift');

  await page.getByRole('button', { name: /Wardrobe I/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  for (let i = 0; i < 22; i++) {
    await page.keyboard.press(i < 11 ? 'Tab' : 'Shift+Tab');
    assert.equal(await page.evaluate(() => !!document.activeElement?.closest('dialog')), true);
  }
  pass('Tab and Shift+Tab remain within the active dialog');
  await page.getByRole('button', { name: 'Wear Mint Condition' }).click();
  assert.equal(await page.evaluate(() => localStorage.getItem('npc-life:shirt-v1')), 'mint');
  await page.screenshot({ path: `${output}/wardrobe.png` });
  await page.keyboard.press('j');
  await page.getByText('achievements unlocked', { exact: false }).waitFor();
  await page.keyboard.press('j');
  assert.equal(await page.getByRole('dialog').count(), 0);
  assert.match(await page.evaluate(() => document.activeElement.textContent), /Wardrobe/);
  pass('wardrobe updates saves, I/J navigation works, and focus returns to opener');

  for (const [key, label] of [['k', 'Daily challenges'], ['h', 'How to be an NPC']]) {
    await page.keyboard.press(key);
    await page.getByRole('dialog', { name: label }).waitFor();
    await page.keyboard.press('p');
    assert.equal(await page.getByRole('dialog').count(), 1);
    await page.keyboard.press(key);
    assert.equal(await page.getByRole('dialog').count(), 0);
    pass(`${label}: shared lock and matching-key close`);
  }

  await page.keyboard.press('m');
  await page.getByRole('dialog', { name: 'Unemployment Simulator' }).waitFor();
  const beforeGame = await position();
  const tile = () => page.locator('.alpha9-tile.is-player').evaluate(el => [...el.parentElement.children].indexOf(el));
  const beforeTile = await tile();
  await page.getByRole('button', { name: 'Start 30-second shift' }).focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  assert.notEqual(await tile(), beforeTile);
  await page.waitForTimeout(200);
  assert.ok(stable(beforeGame, await position()));
  await page.keyboard.press('p');
  assert.equal(await page.getByRole('dialog', { name: 'Unemployment Simulator' }).count(), 1);
  await page.screenshot({ path: `${output}/arcade.png` });
  await page.keyboard.press('Escape');
  pass('Space starts minigame; arrows move only the minigame character');

  await page.keyboard.press('p');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const reduced = page.getByRole('checkbox', { name: 'Reduce UI animations' });
  await reduced.focus();
  await page.keyboard.press('Space');
  assert.equal(await reduced.isChecked(), true);
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('npc-reduce-motion')), true);
  await page.getByRole('checkbox', { name: 'Hide minimap' }).check();
  assert.equal(await page.locator('.alpha8-minimap').isVisible(), false);
  pass('native checkbox keyboard activation and display settings work');
  await page.getByRole('checkbox', { name: 'Hide minimap' }).uncheck();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.screenshot({ path: `${output}/menu.png` });
  await page.keyboard.press('Escape');

  // Client reload retains progression without turning menu state into saved data.
  await page.reload();
  await page.getByRole('dialog', { name: 'NPC LIFE game menu' }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('npc-life:shirt-v1')), 'mint');
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('npc-reduce-motion')), true);
  pass('returning player menu and preferences survive reload');

  for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 600 }]) {
    await page.setViewportSize(viewport);
    const box = await page.getByRole('dialog').boundingBox();
    assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1);
    assert.equal(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
    await page.screenshot({ path: `${output}/menu-${viewport.width}.png` });
    await page.keyboard.press('Escape');
    await page.screenshot({ path: `${output}/hud-${viewport.width}.png` });
    await page.keyboard.press('i');
    assert.equal(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
    await page.keyboard.press('Escape');
    await page.keyboard.press('p');
    pass(`menu and wardrobe fit ${viewport.width}x${viewport.height}`);
  }
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.keyboard.press('Escape');
  await page.locator('.npc-sound-panel summary').click();
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click();
  await page.getByRole('button', { name: 'Sound ON', exact: true }).waitFor();
  pass('audio engine starts on a user gesture (audibility requires a real device)');

  // Walk the real 3D controller to the interaction points in this isolated profile.
  await page.evaluate(() => localStorage.setItem('npc-life:coins-v1', '500'));
  await page.reload();
  await page.getByRole('dialog', { name: 'NPC LIFE game menu' }).waitFor();
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => window.__npcQA.samples > 1);
  async function walkSegment(x, z) {
    let held = [];
    try {
      for (let step = 0; step < 130; step++) {
        const here = await position();
        const dx = x - here.x, dz = z - here.z;
        if (Math.hypot(dx, dz) < .65) return;
        const side = Math.cos(.6) * dx - Math.sin(.6) * dz;
        const forward = -Math.sin(.6) * dx - Math.cos(.6) * dz;
        const max = Math.max(Math.abs(side), Math.abs(forward));
        const next = [];
        if (Math.abs(side) > max * .4) next.push(side > 0 ? 'd' : 'a');
        if (Math.abs(forward) > max * .4) next.push(forward > 0 ? 'w' : 's');
        for (const key of held) if (!next.includes(key)) await page.keyboard.up(key);
        for (const key of next) if (!held.includes(key)) await page.keyboard.down(key);
        held = next;
        await page.waitForTimeout(Math.hypot(dx,dz)>2?200:70);
      }
      throw new Error(`Could not walk to ${x},${z}; at ${JSON.stringify(await position())}`);
    } finally {
      for (const key of held) await page.keyboard.up(key);
      await page.waitForTimeout(180);
    }
  }
  async function walkTo(x,z){for(const [px,pz] of walkingRoute(await position(),{x,z})) await walkSegment(px,pz);}
  await walkTo(-8, -16);
  await page.getByRole('button', { name: 'E Browse the Stupid Shop', exact: true }).click();
  await page.getByRole('dialog', { name: 'Stupid Shop' }).waitFor();
  await page.locator('.shop-item').filter({ hasText: 'Traffic Cone Hat' }).getByRole('button', { name: 'Buy', exact: true }).click();
  assert.ok(JSON.parse(await page.evaluate(() => localStorage.getItem('npc-life:inventory-v1'))).includes('cone'));
  assert.equal(await page.evaluate(() => localStorage.getItem('npc-life:coins-v1')), '440');
  await page.screenshot({ path: `${output}/shop.png` });
  await page.keyboard.press('Escape');
  pass('shop opens via real movement; purchase and save retain the correct price');

  await walkTo(8, -16);
  await page.getByRole('button', { name: 'E Talk to Marty', exact: true }).click();
  await page.getByRole('dialog', { name: 'Talk to Marty' }).waitFor();
  await page.getByRole('button', { name: 'Give me a job (+45 ◆)' }).click();
  assert.equal(await page.getByRole('dialog').count(), 0);
  assert.equal(JSON.parse(await page.evaluate(() => localStorage.getItem('npc-life:active-quest-v1'))).job, 'grass');
  pass('Marty dialog starts the existing grass quest');

  await walkTo(8.5, 10.5);
  await page.getByRole('button', { name: 'E Play Pigeon Panic', exact: true }).click();
  await page.getByRole('dialog', { name: 'Pigeon Panic arcade' }).waitFor();
  await page.getByRole('button', { name: 'Start round', exact: true }).click();
  for (let i = 0; i < 7; i++) await page.getByRole('button', { name: 'Catch pigeon', exact: true }).click();
  await page.getByText('You won. The pigeon union is furious.').waitFor();
  const afterWin = await page.evaluate(() => localStorage.getItem('npc-life:coins-v1'));
  assert.equal(afterWin, '460');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  for (let i = 0; i < 7; i++) await page.getByRole('button', { name: 'Catch pigeon', exact: true }).click();
  assert.equal(await page.evaluate(() => localStorage.getItem('npc-life:coins-v1')), afterWin);
  await page.keyboard.press('Escape');
  pass('Pigeon Panic plays and repeat wins do not duplicate the daily payout');

  await walkTo(7, 19);
  await page.getByRole('button', { name: /Talk to Dot/ }).waitFor();
  await page.keyboard.press('f');
  await page.getByRole('dialog', { name: 'Talk to Dot' }).waitFor();
  await page.locator('.encounter-choices button').first().click();
  await page.getByRole('button', { name: 'Leave dramatically' }).waitFor();
  await page.screenshot({ path: `${output}/dialogue.png` });
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);
  pass('patrolling citizen conversation, choice and close remain functional');

  assert.deepEqual(errors, []);
  pass('no uncaught browser errors during tested flows');
  console.log(`${checks} browser checks passed; screenshots: ${output}`);
} finally {
  await browser?.close();
  await server.close();
}
