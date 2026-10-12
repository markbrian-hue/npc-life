export const CAMPAIGN_KEY = 'npc-life:city-revival-v1';
export const DISTRICTS = [
  { id: 'civic', name: 'Civic Square', x: 0, z: 0, color: '#edbe56', subtitle: 'Municipal incompetence HQ' },
  { id: 'power', name: 'Switchyard', x: 0, z: -58, color: '#e69967', subtitle: 'Power to the people. Eventually.' },
  { id: 'market', name: 'Market Mile', x: 58, z: 0, color: '#d89bba', subtitle: 'Open for questionable business' },
  { id: 'park', name: 'Willow Park', x: -58, z: 0, color: '#a7d5bc', subtitle: 'Grass you can actually touch' },
  { id: 'harbor', name: 'Saltwater Dock', x: 0, z: 58, color: '#89c7d4', subtitle: 'Please do not feed the boats' },
] as const;
export const MISSIONS = [
  { id: 'briefing', district: 'civic', title: 'Your city needs an NPC', description: 'Collect the emergency work order at the gold council kiosk. The festival is cancelled until someone fixes this place. That someone is, unfortunately, you.', action: 'Take work order', x: 6, z: -11, seconds: 1, coins: 15, rep: 5 },
  { id: 'fuse', district: 'power', title: 'A very important fuse', description: 'Follow the north road to the Switchyard. Recover the replacement fuse from the orange supply crate.', action: 'Collect fuse', x: -7, z: -46, seconds: 1.5, coins: 20, rep: 5 },
  { id: 'power', district: 'power', title: 'Have you tried turning it on?', description: 'Fit the fuse at the switchboard. Restore power and bring the district lights back online.', action: 'Restore power', x: 6, z: -60, seconds: 4, coins: 60, rep: 15 },
  { id: 'stock', district: 'harbor', title: 'Special delivery: vegetables', description: 'The market has no stock. Pick up the abandoned produce crate beside the dock. Carry it to Market Mile.', action: 'Collect produce', x: -6, z: 61, seconds: 2, coins: 25, rep: 5 },
  { id: 'market', district: 'market', title: 'Open for actual business', description: 'Deliver the produce to the striped market stalls on the east road. The merchants will finally have something to sell.', action: 'Stock the market', x: 60, z: 6, seconds: 3, coins: 70, rep: 15 },
  { id: 'seeds', district: 'market', title: 'Seeds of mild responsibility', description: 'Collect the seed box at the far end of Market Mile. The park is looking very unemployed.', action: 'Collect seed box', x: 70, z: -6, seconds: 1.5, coins: 25, rep: 5 },
  { id: 'park', district: 'park', title: 'Touch grass, professionally', description: 'Plant the community garden on the west road. Restore Willow Park and make the city a little less grey.', action: 'Plant the garden', x: -60, z: -6, seconds: 4, coins: 70, rep: 15 },
  { id: 'harbor', district: 'harbor', title: 'A light at the end of the dock', description: 'Repair the dock beacon. Power, food, greenery, and a harbor that works: an alarming amount of progress.', action: 'Repair the beacon', x: 6, z: 70, seconds: 4, coins: 80, rep: 20 },
  { id: 'festival', district: 'civic', title: 'The city is (mostly) saved', description: 'Return to the council kiosk to reopen the festival. Collect your City Keeper title, then keep the city moving with courier contracts.', action: 'Open the festival', x: 6, z: -11, seconds: 2, coins: 150, rep: 30 },
] as const;
export type Campaign = { step: number; deliveries: number };
export const CONTRACTS = [
  { title: 'Market lunch run', from: { x: 60, z: 6 }, to: { x: 6, z: -60 }, destination: 'Switchyard', cargo: 'lunch boxes' },
  { title: 'Garden supplies', from: { x: 70, z: -6 }, to: { x: -60, z: -6 }, destination: 'Willow Park', cargo: 'compost' },
  { title: 'Dockside picnic', from: { x: -60, z: -6 }, to: { x: -6, z: 61 }, destination: 'Saltwater Dock', cargo: 'picnic baskets' },
] as const;
export function validateCampaign(value: unknown): Campaign {
  if (!value || typeof value !== 'object') throw new Error('Invalid city revival save');
  const { step, deliveries } = value as Campaign;
  if (!Number.isInteger(step) || step < 0 || step > MISSIONS.length || !Number.isInteger(deliveries) || deliveries < 0 || deliveries > 100000) throw new Error('Invalid city revival progress');
  return { step, deliveries };
}
export function loadCampaign(): Campaign {
  try { return validateCampaign(JSON.parse(localStorage.getItem(CAMPAIGN_KEY) || 'null')); }
  catch { return { step: 0, deliveries: 0 }; }
}
export function currentTask(state: Campaign, carrying: boolean) {
  const mission = MISSIONS[state.step];
  if (mission) return mission;
  const contract = CONTRACTS[state.deliveries % CONTRACTS.length];
  return { id: 'courier', title: contract.title, district: 'civic', description: carrying ? `Deliver ${contract.cargo} to ${contract.destination}.` : `Collect ${contract.cargo}. Next stop: ${contract.destination}.`, action: carrying ? 'Deliver cargo' : 'Pick up cargo', ...(carrying ? contract.to : contract.from), seconds: 2, coins: carrying ? 45 : 0, rep: carrying ? 5 : 0 };
}
export function districtAt(x: number, z: number) {
  if(x<-80&&z<-42)return {id:'juniper',name:'Juniper Close',x:-92,z:-92,color:'#aac397',subtitle:'Ordinary lives, extraordinary paperwork'} as const;
  if(x>88)return {id:'bypass',name:'East Bypass',x:116,z:0,color:'#afb8a3',subtitle:'Keep right. Think occasionally.'} as const;
  return DISTRICTS.reduce((near, district) => Math.hypot(x - district.x, z - district.z) < Math.hypot(x - near.x, z - near.z) ? district : near, DISTRICTS[0] as typeof DISTRICTS[number]);
}
