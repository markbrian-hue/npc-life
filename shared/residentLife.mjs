import { CAREER_DISTRICTS, CAREER_CHAPTERS, DAILY_BULLETIN, freshBulletin, currentBulletin, careerDayStamp } from './career.mjs';
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

// More reasons to work: new assignments alternate routes on successive completions.
JOBS.push(
 {id:'post',title:'Lost Mail Department',subtitle:'One envelope, multiple cities, zero addresses.',coins:35,rep:10,minimum:10,licence:false,seconds:0,stops:[stop(6,22,'Collect undelivered mail'),stop(57,6,'Find intended customer'),stop(6,22,'File a successful mistake')],routes:[
  [stop(6,22,'Collect undelivered mail'),stop(57,6,'Find intended customer'),stop(6,22,'File a successful mistake')],
  [stop(6,22,'Collect undelivered mail'),stop(8,-82,'Check dispatch records'),stop(6,22,'Return with no answers')]
 ]},
 {id:'lunch',title:'Questionable Lunch Run',subtitle:'A three-star meal for a one-star economy.',coins:55,rep:14,minimum:30,licence:false,seconds:0,stops:[stop(57,6,'Collect the suspicious lunch'),stop(8,-82,'Deliver to dispatch')],routes:[
  [stop(57,6,'Collect the suspicious lunch'),stop(8,-82,'Deliver to dispatch')],
  [stop(57,6,'Collect the suspicious lunch'),stop(-82,-71,'Deliver to Juniper Motor Club')]
 ]},
 {id:'surveyor',title:'Sidewalk Quality Inspector',subtitle:'Walk around and approve the existence of sidewalks.',coins:65,rep:17,minimum:55,licence:false,seconds:0,stops:[stop(6,22,'Collect inspection forms'),stop(-44,-8,'Inspect park sidewalk'),stop(21,6,'Inspect bus stop'),stop(6,22,'Submit review')],routes:[
  [stop(6,22,'Collect inspection forms'),stop(-44,-8,'Inspect park sidewalk'),stop(21,6,'Inspect bus stop'),stop(6,22,'Submit review')],
  [stop(6,22,'Collect inspection forms'),stop(57,6,'Inspect market sidewalk'),stop(8,-82,'Inspect depot sidewalk'),stop(6,22,'Submit review')]
 ]}
);
export function shiftStops(job,active){return job.routes?.[active?.variant||0]||job.stops;}

export const LIFE_ACHIEVEMENTS=[
  {id:'first',name:'Briefly Employed',description:'Finish one resident shift.'},
  {id:'regular',name:'Professional NPC',description:'Finish ten resident shifts.'},
  {id:'bench',name:'Bench Warmer',description:'Sit on three different benches.'},
  {id:'court',name:'Local Hoop Legend',description:'Win a round at Juniper Court.'},
  {id:'secret',name:'Municipal Conspiracy',description:'Find the hidden survey marker.'},
];
export const freshLife=()=>({completed:/** @type {Record<string,number>} */ ({}),upgrades:[],benches:[],wins:0,secret:false,visited:[],chapters:[],daily:freshBulletin(careerDayStamp())});
export function validateLife(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid resident record');
  const n=v=>Number.isInteger(v)&&v>=0&&v<=100000;
  if(!value.completed||typeof value.completed!=='object'||Array.isArray(value.completed)||!Object.values(value.completed).every(n)||!n(value.wins)||typeof value.secret!=='boolean')throw new Error('Invalid resident progress');
  if(!Array.isArray(value.upgrades)||value.upgrades.some(id=>!UPGRADES.some(u=>u.id===id))||!Array.isArray(value.benches)||value.benches.some(id=>!Number.isInteger(id)||id<0||id>100))throw new Error('Invalid resident unlocks');
  // Optional career fields permit lossless migration from all prior resident v1 saves.
  const validIds=(items,allowed)=>Array.isArray(items)&&items.every(id=>typeof id==='string'&&allowed.includes(id));
  if(value.visited!==undefined&&!validIds(value.visited,CAREER_DISTRICTS.map(d=>d.id)))throw new Error('Invalid visited districts');
  if(value.chapters!==undefined&&!validIds(value.chapters,CAREER_CHAPTERS.map(c=>c.id)))throw new Error('Invalid career chapters');
  const daily=value.daily===undefined?freshBulletin(''):value.daily;
  if(!daily||typeof daily!=='object'||Array.isArray(daily)
    ||typeof daily.day!=='string'||(daily.day!==''&&!/^\d{4}-\d{2}-\d{2}$/.test(daily.day))
    ||!n(daily.shifts)||!n(daily.courtWins)
    ||!validIds(daily.districts,CAREER_DISTRICTS.map(d=>d.id))
    ||!validIds(daily.claimed,DAILY_BULLETIN.map(t=>t.id)))throw new Error('Invalid daily bulletin');
  return {completed:Object.fromEntries(JOBS.map(j=>[j.id,value.completed[j.id]||0])),upgrades:[...new Set(value.upgrades)],benches:[...new Set(value.benches)],wins:value.wins,secret:value.secret,
    visited:[...new Set(value.visited||[])],chapters:[...new Set(value.chapters||[])],
    daily:currentBulletin({...daily,districts:[...new Set(daily.districts)],claimed:[...new Set(daily.claimed)]})};
}
export function loadLife(){try{return validateLife(JSON.parse(localStorage.getItem(LIFE_KEY)||'null'));}catch{return freshLife();}}
export function lifeAchievements(s){const total=Object.values(s.completed).reduce((a,b)=>a+b,0);return LIFE_ACHIEVEMENTS.filter(a=>({first:total>=1,regular:total>=10,bench:s.benches.length>=3,court:s.wins>0,secret:s.secret})[a.id]);}
export function canStart(job,rep,state){return rep>=job.minimum&&(!job.licence||state.upgrades.includes('club'));}
export function startShift(id,rep,state,now){const job=JOBS.find(j=>j.id===id);if(!job||!canStart(job,rep,state))return null;return {id,stage:0,variant:job.routes?(state.completed[id]||0)%job.routes.length:0,started:now,deadline:job.seconds?now+job.seconds*1000:0};}
export function advanceShift(active,position,{driving=false,speed=0,now=0}={}){
  if(!active)return {active:null,status:'idle'};
  const job=JOBS.find(j=>j.id===active.id),point=job&&shiftStops(job,active)[active.stage];
  if(!point)return {active:null,status:'invalid'};
  if(active.deadline&&now>active.deadline)return {active:null,status:'expired'};
  if(Math.hypot(position.x-point.x,position.z-point.z)>2.8)return {active,status:'far'};
  if(point.drive&&(!driving||Math.abs(speed)>.65))return {active,status:'stop-car'};
  if(!point.drive&&driving)return {active,status:'on-foot'};
  return active.stage+1===shiftStops(job,active).length?{active:null,status:'complete'}:{active:{...active,stage:active.stage+1},status:'advanced'};
}
export function shiftReward(id,state){const j=JOBS.find(j=>j.id===id);return {coins:j.coins+(state.upgrades.includes('bag')&&['milk','courier'].includes(id)?10:0),rep:j.rep};}
