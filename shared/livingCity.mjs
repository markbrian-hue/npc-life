/** Shared deterministic environment and pure transactions. No browser APIs here. */
export const LIVING_KEY = 'npc-life:living-city-v1';
export const WEATHER = ['sunny','cloudy','light-rain','heavy-rain','thunderstorm','fog'];
export const WEATHER_LABELS = ['Sunny','Cloudy','Light rain','Heavy rain','Thunderstorm','Fog'];
export const WEATHER_SECONDS = 300;
export const DAY_SECONDS = 1440; // one real second = one game minute
export const ITEMS = [
 {id:'water',name:'Bottled water',category:'drink',price:3,hunger:0,thirst:40,energy:0,description:'Hydration with absolutely no qualifications.'},
 {id:'juice',name:'Juice',category:'drink',price:5,hunger:3,thirst:30,energy:3,description:'Fruit that gave up being solid.'},
 {id:'soda',name:'Soft drink',category:'drink',price:4,hunger:0,thirst:22,energy:5,description:'The bubbles have a better career than you.'},
 {id:'espresso',name:'Espresso',category:'drink',price:10,hunger:0,thirst:8,energy:28,description:'Tiny cup. Large consequences.',buff:60},
 {id:'americano',name:'Iced Americano',category:'drink',price:9,hunger:0,thirst:25,energy:22,description:'Coffee with a cooling-off period.',buff:60},
 {id:'latte',name:'Café Latte',category:'drink',price:12,hunger:8,thirst:18,energy:24,description:'Milk with a management position.',buff:60},
 {id:'caramel',name:'Iced Caramel Coffee',category:'drink',price:14,hunger:10,thirst:20,energy:26,description:'Your sweet escape from employability.',buff:60},
 {id:'croissant',name:'Croissant',category:'food',price:6,hunger:22,thirst:0,energy:5,description:'A flaky colleague you can actually eat.'},
 {id:'sandwich',name:'Sandwich',category:'food',price:9,hunger:35,thirst:0,energy:8,description:'A meeting between two breads.'},
 {id:'burger',name:'Burger',category:'food',price:12,hunger:45,thirst:0,energy:10,description:'Lunch with structural integrity.'},
 {id:'fries',name:'Fries',category:'food',price:5,hunger:20,thirst:0,energy:3,description:'Potatoes promoted to finger food.'},
 {id:'breakfast',name:'Breakfast meal',category:'food',price:10,hunger:40,thirst:5,energy:12,description:'Start your day with edible ambition.'},
 {id:'pancakes',name:'Pancakes',category:'food',price:8,hunger:30,thirst:0,energy:8,description:'Stacked better than your résumé.'},
 {id:'snack',name:'Packaged snack',category:'food',price:3,hunger:15,thirst:0,energy:2,description:'A small victory over an empty stomach.'},
 {id:'noodles',name:'Instant noodles',category:'food',price:5,hunger:28,thirst:5,energy:5,description:'Ready to eat. No imaginary kettle required.'},
 {id:'meal',name:'Packaged meal',category:'food',price:8,hunger:38,thirst:0,energy:8,description:'Convenience in a suspicious rectangle.'},
 {id:'energy-drink',name:'Energy drink',category:'drink',price:8,hunger:0,thirst:15,energy:35,description:'Now with 0% sensible decisions.',buff:45},
 {id:'hotdog',name:'Hotdog',category:'food',price:4,hunger:24,thirst:0,energy:4,description:'The dog is purely conceptual.'},
 {id:'skewers',name:'Street skewers',category:'food',price:4,hunger:25,thirst:0,energy:4,description:'Dinner on a tiny municipal spear.'},
];
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map(item=>[item.id,item]));
// Service positions are walkable; small kiosks sit three metres behind their counters.
export const BUSINESSES = [
 {id:'coffee',name:'Last Chance Coffee',x:57,z:6,color:'#b77650',cashier:'Beanjamin',open:6,close:23,products:['espresso','americano','latte','caramel','croissant','sandwich']},
 {id:'diner',name:'The Unemployed Diner',x:36,z:6,color:'#cf7879',cashier:'Patty',open:5,close:23,products:['burger','fries','breakfast','pancakes','sandwich','soda','juice']},
 {id:'store',name:'NPC Convenience Store',x:24,z:-6,color:'#79b5a2',cashier:'Receipt Rita',open:0,close:24,products:['water','snack','noodles','energy-drink','meal','juice']},
 {id:'vendor',name:'Dockside Dogs & Skewers',x:25,z:58,color:'#d6b65c',cashier:'Frank',open:8,close:22,products:['hotdog','skewers','water','soda']},
];
export const kioskPosition = shop=>({x:shop.x,z:shop.z+(shop.z<0?-3:3)});
export const clampNeed = n=>Math.min(100,Math.max(0,Number.isFinite(n)?n:100));
export const freshLiving = ()=>({version:1,needs:{hunger:100,thirst:100,energy:100},inventory:/** @type {Record<string,number>} */({}),elapsed:0,seed:17,relaxed:false,quality:'medium',buff:0,sampleCycle:-1});
export function validateLiving(value) {
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid living city save');
 const s=freshLiving(), valid=v=>Number.isFinite(v)&&v>=0;
 if(value.version!==undefined&&value.version!==1)throw new Error('Unsupported living city save');
 if(value.needs!==undefined){if(!value.needs||!['hunger','thirst','energy'].every(k=>valid(value.needs[k])&&value.needs[k]<=100))throw new Error('Invalid needs');s.needs={...value.needs};}
 if(value.inventory!==undefined){if(!value.inventory||typeof value.inventory!=='object'||Array.isArray(value.inventory))throw new Error('Invalid consumables');for(const [id,n] of Object.entries(value.inventory)){if(!ITEM_BY_ID[id]||!Number.isInteger(n)||n<0||n>99)throw new Error('Invalid consumable quantity');if(n)s.inventory[id]=n;}}
 if(Object.values(s.inventory).reduce((a,b)=>a+b,0)>60)throw new Error('Bag exceeds 60 items');
 for(const k of ['elapsed','seed','buff'])if(value[k]!==undefined){if(!valid(value[k])||value[k]>(k==='buff'?60:1e9))throw new Error('Invalid living city timing');s[k]=value[k];}
 if(value.sampleCycle!==undefined){if(!Number.isInteger(value.sampleCycle)||value.sampleCycle< -1||value.sampleCycle>1e9)throw new Error('Invalid sample cooldown');s.sampleCycle=value.sampleCycle;}
 if(value.relaxed!==undefined&&typeof value.relaxed!=='boolean')throw new Error('Invalid relaxed setting');
 if(value.quality!==undefined&&!['low','medium','high'].includes(value.quality))throw new Error('Invalid graphics quality');
 return {...s,relaxed:value.relaxed??s.relaxed,quality:value.quality??s.quality};
}
export function loadLiving(){try{return validateLiving(JSON.parse(localStorage.getItem(LIVING_KEY)||'null'));}catch{return freshLiving();}}
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export function environmentAt(elapsed,seed=17) {
 const seconds=Math.max(0,Number.isFinite(elapsed)?elapsed:0),cycle=Math.floor(seconds/WEATHER_SECONDS);
 const weatherIndex=n=>Math.floor(hash(n+seed)*WEATHER.length);
 const index=weatherIndex(cycle),previous=weatherIndex(Math.max(0,cycle-1));
 const mix=cycle===0?1:Math.min(1,(seconds%WEATHER_SECONDS)/20),rain=[0,0,.35,.8,1,0];
 const wet=rain[previous]+(rain[index]-rain[previous])*mix;
 const minute=(480+seconds)%1440,daylight=Math.max(0,Math.sin((minute-360)/1440*Math.PI*2));
 return {seconds,cycle,minute,day:Math.floor((480+seconds)/1440)+1,kind:WEATHER[index],previous:WEATHER[previous],label:WEATHER_LABELS[index],mix,rain:wet,daylight,night:1-daylight,heat:WEATHER[index]==='sunny'&&minute>660&&minute<960,remaining:WEATHER_SECONDS-seconds%WEATHER_SECONDS};
}
export const isOpen=(shop,minute)=>shop.open===0&&shop.close===24||minute/60>=shop.open&&minute/60<shop.close;
export function stepNeeds(needs,seconds,{moving=false,running=false,resting=false,working=false,hot=false,relaxed=false,paused=false}={}) {
 if(paused)return needs;
 const dt=Math.max(0,Math.min(seconds,2)),rate=relaxed?.35:1,work=working?1.15:1;
 return {hunger:clampNeed(needs.hunger-dt*rate*(moving?.021:.014)*work),thirst:clampNeed(needs.thirst-dt*rate*(moving?.03:.018)*(hot?1.3:1)*work),energy:clampNeed(needs.energy+dt*(resting?1.3:running&&moving?-.45*rate:working?-.045*rate:needs.hunger<20?.03:.12))};
}
export function purchaseItem(state,balance,shopId,itemId,environment) {
 const shop=BUSINESSES.find(s=>s.id===shopId),item=ITEM_BY_ID[itemId];
 if(!shop||!item||!shop.products.includes(itemId))return {ok:false,reason:'Not on this menu.'};
 if(!isOpen(shop,environment.minute))return {ok:false,reason:'Closed. The convenience store is always open.'};
 const price=Math.max(1,item.price-(eventAt(environment)?.id==='discount'&&shopId==='coffee'?2:0));
 if(!Number.isFinite(balance)||balance<price)return {ok:false,reason:'Not enough coins. Free water and meals are at the resident bureau.'};
 if(Object.values(state.inventory).reduce((a,b)=>a+b,0)>=60)return {ok:false,reason:'Your bag holds 60 items. Consume something first.'};
 return {ok:true,price,state:{...state,inventory:{...state.inventory,[itemId]:(state.inventory[itemId]||0)+1}}};
}
export function consumeItem(state,id) {
 const item=ITEM_BY_ID[id];if(!item||!(state.inventory[id]>0))return null;
 const inventory={...state.inventory};if(--inventory[id]===0)delete inventory[id];
 return {...state,inventory,needs:{hunger:clampNeed(state.needs.hunger+item.hunger),thirst:clampNeed(state.needs.thirst+item.thirst),energy:clampNeed(state.needs.energy+item.energy)},buff:Math.max(state.buff,item.buff||0)};
}
export function eventAt(env) {
 // One short, nonblocking event in each ten-minute window, with no notification spam.
 const slot=Math.floor(env.seconds/600),age=env.seconds%600;
 if(age<180||age>=300)return null;
 const id=['discount','sample','announcement'][slot%3];
 return {id,slot,title:{discount:'Coffee amnesty: 2 coins off all café items',sample:'Dockside free sample: one hotdog per resident',announcement:'Civic announcement: free emergency meals are a human right (even for NPCs)'}[id]};
}
export function claimSample(state,env) {
 const event=eventAt(env);if(event?.id!=='sample'||state.sampleCycle===event.slot||Object.values(state.inventory).reduce((a,b)=>a+b,0)>=60)return null;
 return {...state,sampleCycle:event.slot,inventory:{...state.inventory,hotdog:(state.inventory.hotdog||0)+1}};
}
export function jobAvailable(job,env){return !job.weather||env.rain>=.3 ? !job.hours||env.minute>=job.hours[0]*60&&env.minute<job.hours[1]*60 : false;}
