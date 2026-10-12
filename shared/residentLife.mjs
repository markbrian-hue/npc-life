export const LIFE_KEY='npc-life:resident-life-v1';
export const UPGRADES=[
  {id:'club',name:'Motor Club licence',price:75,description:'Unlock the taxi shift at Juniper Motor Club.'},
  {id:'bag',name:'Official-looking courier bag',price:90,description:'Earn 10 extra coins on delivery and milk shifts.'},
  {id:'guide',name:'Hand-drawn city guide',price:45,description:'Reveal the location of the hidden municipal survey marker.'},
];
const stop=(x,z,action,drive=false)=>({x,z,action,drive});
export const JOBS=[
  {id:'milk',title:'Go Buy Milk',subtitle:'An epic quest for one extremely normal carton.',coins:25,rep:8,minimum:0,licence:false,seconds:0,stops:[stop(-6,-16,'Collect the milk'),stop(6,22,'Deliver to the bureau')]},
  {id:'cleanup',title:'Parks & Mild Recreation',subtitle:'Collect three suspicious litter bags. Nobody is thanking you.',coins:45,rep:12,minimum:0,licence:false,seconds:0,stops:[stop(-44,-8,'Collect bag 1'),stop(-60,-10,'Collect bag 2'),stop(-76,-8,'Collect bag 3'),stop(-44,6,'Recycle the evidence')]},
  {id:'courier',title:'Definitely Legal Delivery',subtitle:'Take a sealed box from dispatch to the dock. Do not ask it questions.',coins:65,rep:18,minimum:25,licence:false,seconds:180,stops:[stop(8,-82,'Pick up the box'),stop(6,68,'Deliver to the dock')]},
  {id:'taxi',title:'Five-Star Background Driver',subtitle:'Collect a passenger in Juniper Close and bring them to Market Mile.',coins:80,rep:20,minimum:40,licence:true,seconds:210,stops:[stop(-92,-77,'Collect passenger (stop car)',true),stop(80,1.8,'Drop passenger (stop car)',true)]},
];
export const LIFE_ACHIEVEMENTS=[
  {id:'first',name:'Briefly Employed',description:'Finish one resident shift.'},
  {id:'regular',name:'Professional NPC',description:'Finish ten resident shifts.'},
  {id:'bench',name:'Bench Warmer',description:'Sit on three different benches.'},
  {id:'court',name:'Local Hoop Legend',description:'Win a round at Juniper Court.'},
  {id:'secret',name:'Municipal Conspiracy',description:'Find the hidden survey marker.'},
];
export const freshLife=()=>({completed:/** @type {Record<string,number>} */ ({}),upgrades:[],benches:[],wins:0,secret:false});
export function validateLife(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid resident record');
  const n=v=>Number.isInteger(v)&&v>=0&&v<=100000;
  if(!value.completed||typeof value.completed!=='object'||Array.isArray(value.completed)||!Object.values(value.completed).every(n)||!n(value.wins)||typeof value.secret!=='boolean')throw new Error('Invalid resident progress');
  if(!Array.isArray(value.upgrades)||value.upgrades.some(id=>!UPGRADES.some(u=>u.id===id))||!Array.isArray(value.benches)||value.benches.some(id=>!Number.isInteger(id)||id<0||id>100))throw new Error('Invalid resident unlocks');
  return {completed:Object.fromEntries(JOBS.map(j=>[j.id,value.completed[j.id]||0])),upgrades:[...new Set(value.upgrades)],benches:[...new Set(value.benches)],wins:value.wins,secret:value.secret};
}
export function loadLife(){try{return validateLife(JSON.parse(localStorage.getItem(LIFE_KEY)||'null'));}catch{return freshLife();}}
export function lifeAchievements(s){const total=Object.values(s.completed).reduce((a,b)=>a+b,0);return LIFE_ACHIEVEMENTS.filter(a=>({first:total>=1,regular:total>=10,bench:s.benches.length>=3,court:s.wins>0,secret:s.secret})[a.id]);}
export function canStart(job,rep,state){return rep>=job.minimum&&(!job.licence||state.upgrades.includes('club'));}
export function startShift(id,rep,state,now){const job=JOBS.find(j=>j.id===id);if(!job||!canStart(job,rep,state))return null;return {id,stage:0,started:now,deadline:job.seconds?now+job.seconds*1000:0};}
export function advanceShift(active,position,{driving=false,speed=0,now=0}={}){
  if(!active)return {active:null,status:'idle'};
  const job=JOBS.find(j=>j.id===active.id),point=job?.stops[active.stage];
  if(!point)return {active:null,status:'invalid'};
  if(active.deadline&&now>active.deadline)return {active:null,status:'expired'};
  if(Math.hypot(position.x-point.x,position.z-point.z)>2.8)return {active,status:'far'};
  if(point.drive&&(!driving||Math.abs(speed)>.65))return {active,status:'stop-car'};
  if(!point.drive&&driving)return {active,status:'on-foot'};
  return active.stage+1===job.stops.length?{active:null,status:'complete'}:{active:{...active,stage:active.stage+1},status:'advanced'};
}
export function shiftReward(id,state){const j=JOBS.find(j=>j.id===id);return {coins:j.coins+(state.upgrades.includes('bag')&&['milk','courier'].includes(id)?10:0),rep:j.rep};}
