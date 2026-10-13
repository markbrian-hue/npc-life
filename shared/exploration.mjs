export const EXPLORATION_KEY='npc-life:exploration-v1';
export const EXPLORER_SITES=[
 {id:'civic',name:'Civic Square',x:6,z:22,station:true,detail:'The first stamp in a less ordinary life.'},
 {id:'juniper',name:'Juniper Motor Club',x:-82,z:-71,station:true,detail:'A starting point for the long way home.'},
 {id:'campus',name:'Northgate Campus',x:-28,z:-141,station:true,detail:'New ideas. Old overdue library books.'},
 {id:'observatory',name:'Hilltop Observatory',x:-65,z:-174,station:false,detail:'Look up. Your performance review is not in the stars.'},
 {id:'eastbank',name:'Eastbank Works',x:157,z:-38,station:true,detail:'Solar-powered ambition, locally assembled.'},
 {id:'solar',name:'Solar Gardens',x:184,z:-100,station:false,detail:'The only city employees that enjoy every sunny day.'},
 {id:'lookout',name:'Coastal Lookout',x:184,z:42,station:false,detail:'The road ends. Your next chapter does not.'},
];
export const EXPLORER_BY_ID=Object.fromEntries(EXPLORER_SITES.map(s=>[s.id,s]));
export const CONTRACTS=[
 {id:'welcome',title:'Neighborhood post',description:'Collect the welcome packs and deliver them to the new campus.',stops:['civic','juniper','campus'],actions:['Collect welcome packs','Collect the club newsletter','Deliver campus welcome packs'],coins:85,rep:15,required:0},
 {id:'books',title:'Campus courier',description:'Return some very overdue books. No late fee for the messenger.',stops:['civic','campus','observatory'],actions:['Collect returned books','Check in library returns','Deliver the star atlas'],coins:85,rep:15,required:0},
 {id:'survey',title:'Coastal survey',description:'Help map the new east side on foot. Vehicles are welcome between stops.',stops:['eastbank','solar','lookout'],actions:['Collect the field notebook','Survey the solar garden','Record the coastal view'],coins:105,rep:20,required:0},
 {id:'power',title:'Clean energy circuit',description:'Carry test reports from the gardens to the campus engineers.',stops:['eastbank','solar','campus'],actions:['Collect the inspection kit','Record panel readings','Deliver the energy report'],coins:105,rep:20,required:0},
 {id:'stargazer',title:'Stargazer supplies',description:'Take the club telescope kit up to the observatory.',stops:['juniper','campus','observatory'],actions:['Collect the telescope kit','Collect the star chart','Set up the viewing kit'],coins:95,rep:18,required:0},
 {id:'grand-tour',title:'The grand tour',description:'A longer commission for residents who have earned three passport stamps.',stops:['civic','observatory','solar','lookout'],actions:['Collect the tour manifest','Stamp the hilltop stop','Stamp the energy stop','Finish the tour report'],coins:145,rep:25,required:3},
 {id:'cross-city',title:'Cross-city express',description:'Connect the city from Juniper to Eastbank. Explore three landmarks to qualify.',stops:['juniper','campus','eastbank','lookout'],actions:['Collect express parcels','Deliver the campus parcel','Deliver the workshop parcel','Deliver the coastal parcel'],coins:145,rep:25,required:3},
];
export const CONTRACT_BY_ID=Object.fromEntries(CONTRACTS.map(c=>[c.id,c]));
export const explorerDay=(now=Date.now())=>Math.floor(now/86400000);
export const dailyContracts=day=>[CONTRACTS[day%2],CONTRACTS[2+day%3],CONTRACTS[5+day%2]];
export const freshExploration=()=>({version:1,day:0,visits:/** @type {string[]} */([]),claimed:/** @type {string[]} */([]),active:/** @type {{id:string,day:number,stage:number}|null} */(null),finished:0,passportRewarded:false});
export function validateExploration(v){
 if(!v||typeof v!=='object'||Array.isArray(v)||v.version!==1)throw new Error('Invalid explorer passport');
 const s=freshExploration(),integer=(n,max)=>Number.isInteger(n)&&n>=0&&n<=max;
 if(!integer(v.day,100000)||!integer(v.finished,1000000)||typeof v.passportRewarded!=='boolean')throw new Error('Invalid explorer history');
 if(!Array.isArray(v.visits)||v.visits.some(id=>!EXPLORER_BY_ID[id]))throw new Error('Invalid passport stamp');
 s.visits=[...new Set(v.visits)];s.day=v.day;s.finished=v.finished;s.passportRewarded=v.passportRewarded;
 if(s.passportRewarded&&s.visits.length!==EXPLORER_SITES.length)throw new Error('Incomplete passport award');
 if(!Array.isArray(v.claimed)||v.claimed.length>100||v.claimed.some(k=>{if(typeof k!=='string')return true;const [day,id]=k.split(':');return k!==`${Number(day)}:${id}`||!integer(Number(day),s.day)||!dailyContracts(Number(day)).some(c=>c.id===id);}))throw new Error('Invalid contract claims');
 s.claimed=[...new Set(v.claimed)];
 if(v.active!==null){const a=v.active,c=CONTRACT_BY_ID[a?.id];if(!a||!c||!integer(a.day,s.day)||!dailyContracts(a.day).includes(c)||!integer(a.stage,c.stops.length-1)||s.claimed.includes(`${a.day}:${a.id}`))throw new Error('Invalid active route');s.active={id:a.id,day:a.day,stage:a.stage};}
 return s;
}
export function loadExploration(){try{return validateExploration(JSON.parse(localStorage.getItem(EXPLORATION_KEY)||'null'));}catch{return freshExploration();}}
export function acceptContract(s,id,day=explorerDay()){
 const c=dailyContracts(day).find(c=>c.id===id);if(!c||s.active||day<s.day||s.visits.length<c.required||s.claimed.includes(`${day}:${id}`))return null;
 return {...s,day,claimed:s.claimed.filter(k=>Number(k.split(':')[0])>=day-30),active:{id,day,stage:0}};
}
export function contractTarget(s){const a=s.active;if(!a)return null;const c=CONTRACT_BY_ID[a.id];return {...EXPLORER_BY_ID[c.stops[a.stage]],action:c.actions[a.stage]};}
export function advanceContract(s,position,driving=false){
 const target=contractTarget(s),a=s.active;if(!a||!target||!Number.isFinite(position.x)||!Number.isFinite(position.z)||Math.hypot(position.x-target.x,position.z-target.z)>2.8)return null;
 if(driving)return {state:s,status:'park',coins:0,rep:0};
 const c=CONTRACT_BY_ID[a.id],key=`${a.day}:${a.id}`;
 if(a.stage<c.stops.length-1)return {state:{...s,active:{...a,stage:a.stage+1}},status:'next',coins:0,rep:0};
 if(s.claimed.includes(key))return null;
 return {state:{...s,active:null,claimed:[...s.claimed,key],finished:s.finished+1},status:'complete',coins:c.coins,rep:c.rep};
}
export function stampPassport(s,position,driving=false){
 if(driving)return null;const site=EXPLORER_SITES.find(p=>Math.hypot(p.x-position.x,p.z-position.z)<2.8&&!s.visits.includes(p.id));if(!site)return null;
 const visits=[...s.visits,site.id],bonus=visits.length===EXPLORER_SITES.length&&!s.passportRewarded;
 return {state:{...s,visits,passportRewarded:s.passportRewarded||bonus},site,coins:12+(bonus?120:0),rep:3+(bonus?30:0),bonus};
}
export function shuttleDestination(s,position,id,{working=false,driving=false}={}){
 const from=EXPLORER_SITES.find(p=>p.station&&Math.hypot(p.x-position.x,p.z-position.z)<4),to=EXPLORER_BY_ID[id];
 return !s.active&&!working&&!driving&&from&&to?.station&&from.id!==id&&s.visits.includes(from.id)&&s.visits.includes(id)?to:null;
}
