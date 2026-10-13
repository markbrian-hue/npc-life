import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { build } from 'vite';

// Compile with the project's existing Vite toolchain; no extra test dependencies.
async function source(entry) {
  const result = await build({
    configFile: false, publicDir: false, logLevel: 'silent',
    build: { write: false, minify: false, lib: { entry: resolve(entry), formats: ['es'] } },
  });
  const [{ output }] = Array.isArray(result) ? result : [result];
  const code = output.find(part => part.type === 'chunk').code;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}
const { createMenuStore } = await source('src/game/ui/menuStore.ts');
const { importSave, getSettings, readGoals, RELEASE_KEYS, setSettings } = await source('src/game/releaseData.ts');

function storage(values = {}) {
  const data = new Map(Object.entries(values));
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key), data };
}
function file(data) {
  const text = JSON.stringify({ format: 'npc-life-save', version: 1, data });
  return { size: text.length, text: async () => text };
}

test('one dialog owns input; competing opens and stale closes cannot replace it', () => {
  const ui = createMenuStore();
  assert.equal(ui.open('wardrobe'), true);
  assert.equal(ui.open('release'), false);
  ui.close('release');
  assert.equal(ui.getSnapshot(), 'wardrobe');
  ui.close('wardrobe');
  assert.equal(ui.open('work-dodge'), true);
  ui.close('wardrobe');
  assert.equal(ui.getSnapshot(), 'work-dodge');
});

test('UI state is local to a player/session, not a shared-world pause', () => {
  const first = createMenuStore();
  const second = createMenuStore();
  first.open('release');
  assert.equal(second.getSnapshot(), null);
  second.open('daily');
  first.close('release');
  assert.equal(second.getSnapshot(), 'daily');
});

test('opening/closing dialogs neither reads nor writes a saved game', () => {
  globalThis.localStorage = storage({ 'npc-life:coins-v1': '123' });
  const before = [...localStorage.data];
  const ui = createMenuStore('welcome');
  ui.close('welcome');
  ui.open('shop');
  ui.close('shop');
  assert.deepEqual([...localStorage.data], before);
});

test('import clears an equipped item when inventory is omitted', async () => {
  globalThis.localStorage = storage({ 'npc-life:inventory-v1': '["cone"]' });
  await importSave(file({ 'npc-life:equipped-v1': 'cone', 'npc-life:coins-v1': '35' }));
  assert.equal(localStorage.getItem('npc-life:equipped-v1'), 'none');
});

test('import preserves owned equipment, coins and unrelated browser keys', async () => {
  globalThis.localStorage = storage({ unrelated: 'keep' });
  await importSave(file({ 'npc-life:inventory-v1': '["cone"]', 'npc-life:equipped-v1': 'cone', 'npc-life:coins-v1': '125' }));
  assert.equal(localStorage.getItem('npc-life:equipped-v1'), 'cone');
  assert.equal(localStorage.getItem('npc-life:coins-v1'), '125');
  assert.equal(localStorage.getItem('unrelated'), 'keep');
});

test('invalid imported data cannot erase a pre-existing save', async () => {
  globalThis.localStorage = storage({ 'npc-life:coins-v1': '200' });
  await assert.rejects(importSave(file({ 'npc-life:coins-v1': '-1' })));
  assert.equal(localStorage.getItem('npc-life:coins-v1'), '200');
});

test('a failed import write rolls back the prior save', async () => {
  const saved = { 'npc-life:coins-v1': '200', 'npc-life:equipped-v1': 'none' };
  const memory = storage(saved);
  const write = memory.setItem;
  let fail = true;
  memory.setItem = (key, value) => {
    if (fail) { fail = false; throw new Error('Storage full'); }
    write(key, value);
  };
  globalThis.localStorage = memory;
  await assert.rejects(importSave(file({ 'npc-life:coins-v1': '10' })));
  assert.deepEqual(Object.fromEntries(memory.data), saved);
});

test('goals and settings tolerate blocked storage', () => {
  globalThis.localStorage = { getItem: () => { throw new Error('Blocked'); } };
  assert.equal(readGoals().length, 5);
  assert.ok(readGoals().every(goal => goal.value === 0));
  assert.equal(getSettings().reducedMotion, false);
});

test('display preferences apply even when persistence fails', () => {
  const applied = new Map();
  globalThis.document = { documentElement: { classList: { toggle: (key, value) => applied.set(key, value) } } };
  globalThis.localStorage = { setItem: () => { throw new Error('Blocked'); } };
  assert.throws(() => setSettings({ reducedMotion: true, compactHud: false, hideMinimap: true }));
  assert.equal(applied.get('npc-reduce-motion'), true);
  assert.equal(applied.get('npc-hide-minimap'), true);
  assert.equal(RELEASE_KEYS.length, 18);
});

test('city revival progress participates in import and invalid progress preserves the prior save', async () => {
  globalThis.localStorage = storage({ 'npc-life:coins-v1': '200' });
  await assert.rejects(importSave(file({ 'npc-life:city-revival-v1': '{"step":900,"deliveries":0}' })));
  assert.equal(localStorage.getItem('npc-life:coins-v1'), '200');
  await importSave(file({ 'npc-life:coins-v1': '615', 'npc-life:city-revival-v1': '{"step":9,"deliveries":2}' }));
  assert.equal(localStorage.getItem('npc-life:city-revival-v1'), '{"step":9,"deliveries":2}');
});

test('resident unlocks round-trip through backup and invalid records cannot erase saves', async()=>{
  const key='npc-life:resident-life-v1';const resident={completed:{milk:3},upgrades:['club'],benches:[1],wins:2,secret:false};
  globalThis.localStorage=storage({'npc-life:coins-v1':'150'});
  await assert.rejects(importSave(file({[key]:JSON.stringify({...resident,wins:-1})})));assert.equal(localStorage.getItem('npc-life:coins-v1'),'150');
  await importSave(file({'npc-life:coins-v1':'150',[key]:JSON.stringify(resident)}));const saved=JSON.parse(localStorage.getItem(key));assert.equal(saved.completed.milk,3);assert.deepEqual(saved.upgrades,['club']);assert.equal(saved.wins,2);
});

test('living city backups preserve needs, quantities and preferences; malformed data cannot erase old progress',async()=>{
 const key='npc-life:living-city-v1';globalThis.localStorage=storage({'npc-life:coins-v1':'99'});
 await assert.rejects(importSave(file({[key]:JSON.stringify({inventory:{water:-2}})})));assert.equal(localStorage.getItem('npc-life:coins-v1'),'99');
 await importSave(file({'npc-life:coins-v1':'99',[key]:JSON.stringify({needs:{hunger:42,thirst:33,energy:55},inventory:{water:2},relaxed:true,quality:'low'})}));
 const value=JSON.parse(localStorage.getItem(key));assert.equal(value.needs.hunger,42);assert.equal(value.inventory.water,2);assert.equal(value.relaxed,true);
});

test('kiosk camera preserves open headroom instead of hitting a phantom wall',async()=>{
 const {safeCameraDistance}=await source('src/game/cameraCollision.ts');
 const direction={x:Math.sin(.6)*Math.cos(.65),y:Math.sin(.65),z:Math.cos(.6)*Math.cos(.65)};
 assert.ok(safeCameraDistance({x:57,y:1.7,z:6},direction,13)>2);
});
