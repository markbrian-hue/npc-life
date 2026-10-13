// Persistent NPC career progression. Pure helpers keep legacy save migration safe.
export const CAREER_DISTRICTS=[
 {id:'civic',name:'Civic Square',x:6,z:16,radius:23},
 {id:'switchyard',name:'Switchyard',x:8,z:-82,radius:22},
 {id:'market',name:'Market Mile',x:57,z:6,radius:25},
 {id:'park',name:'Willow Park',x:-60,z:-8,radius:25},
 {id:'dock',name:'Saltwater Dock',x:6,z:68,radius:22},
 {id:'juniper',name:'Juniper Close',x:-82,z:-71,radius:27},
];
export const CAREER_CHAPTERS=[
 {id:'badge',title:'Badge of Bare Minimum',story:'The city issued you a badge. It is made of receipt paper.',needs:{shifts:1},coins:35,rep:5},
 {id:'tour',title:'Local Geography Expert',story:'You can now get lost in at least three different neighborhoods.',needs:{districts:3},coins:45,rep:7},
 {id:'versatile',title:'Gainfully Confused',story:'Three employers have agreed not to ask for references.',needs:{jobTypes:3},coins:60,rep:10},
 {id:'trusted',title:'Officially Employable',story:'A signed permit authorizes you to continue being a problem.',needs:{shifts:7,upgrades:1},coins:95,rep:14},
 {id:'legend',title:'Main Character by Accident',story:'After years in the background, the city finally knows your name.',needs:{shifts:12,districts:6,court:1,rep:150},coins:180,rep:25},
];
export const DAILY_BULLETIN=[
 {id:'shifts',title:'Clock In Twice',description:'Finish 2 resident shifts today.',target:2,coins:35,rep:5},
 {id:'districts',title:'Touch Three Zip Codes',description:'Visit 3 distinct city districts today.',target:3,coins:25,rep:5},
 {id:'court',title:'Prove You Have Hobbies',description:'Win a Juniper Court match today.',target:1,coins:30,rep:5},
];
export const freshBulletin=(day='')=>({day,shifts:0,districts:[],courtWins:0,claimed:[]});
export function careerDayStamp(at=new Date()) {
 const pad=n=>String(n).padStart(2,'0');
 return [at.getFullYear(),pad(at.getMonth()+1),pad(at.getDate())].join('-');
}
export function currentBulletin(daily,day=careerDayStamp()){
 return daily?.day===day?daily:freshBulletin(day);
}
export function addDistrict(record,id,day=careerDayStamp()){
 if(!CAREER_DISTRICTS.some(d=>d.id===id))return record;
 const daily=currentBulletin(record.daily,day);
 if(record.visited.includes(id)&&daily.districts.includes(id))return record;
 return {...record,visited:[...new Set([...record.visited,id])],daily:{...daily,districts:[...new Set([...daily.districts,id])]}};
}
export function finishCareerShift(record,id,day=careerDayStamp()){
 const daily=currentBulletin(record.daily,day);
 return {...record,completed:{...record.completed,[id]:(record.completed[id]||0)+1},daily:{...daily,shifts:daily.shifts+1}};
}
export function finishCareerCourt(record,day=careerDayStamp()){
 const daily=currentBulletin(record.daily,day);
 return {...record,wins:record.wins+1,daily:{...daily,courtWins:daily.courtWins+1}};
}
export function careerMetrics(chapter,record,reputation){
 const total=Object.values(record.completed).reduce((sum,n)=>sum+n,0);
 const kinds=Object.values(record.completed).filter(n=>n>0).length;
 const values={shifts:total,districts:record.visited.length,jobTypes:kinds,upgrades:record.upgrades.length,court:record.wins,rep:reputation};
 const labels={shifts:'Shifts completed',districts:'Districts explored',jobTypes:'Different jobs',upgrades:'Upgrades owned',court:'Court wins',rep:'Reputation'};
 return Object.entries(chapter.needs).map(([key,required])=>({label:labels[key],current:Math.min(values[key],required),required}));
}
export function careerReady(chapter,record,reputation){
 return careerMetrics(chapter,record,reputation).every(m=>m.current>=m.required);
}
export function claimCareerChapter(record,id,reputation){
 const chapter=CAREER_CHAPTERS.find(c=>!record.chapters.includes(c.id));
 if(!chapter||chapter.id!==id||!careerReady(chapter,record,reputation))return null;
 return {record:{...record,chapters:[...record.chapters,id]},coins:chapter.coins,rep:chapter.rep,title:chapter.title};
}
export function dailyProgress(task,daily){
 return task.id==='districts'?daily.districts.length:task.id==='court'?daily.courtWins:daily.shifts;
}
export function claimBulletin(record,id,day=careerDayStamp()){
 const daily=currentBulletin(record.daily,day),task=DAILY_BULLETIN.find(t=>t.id===id);
 if(!task||daily.claimed.includes(id)||dailyProgress(task,daily)<task.target)return null;
 return {record:{...record,daily:{...daily,claimed:[...daily.claimed,id]}},coins:task.coins,rep:task.rep,title:task.title};
}
export function districtNear(position){
 return CAREER_DISTRICTS.find(d=>Math.hypot(position.x-d.x,position.z-d.z)<=d.radius)||null;
}
