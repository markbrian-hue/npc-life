/** Original, unbranded silhouettes. Dimensions in metres, speeds in m/s. */
// Class handling. Grip scales the lateral acceleration a body can hold in a corner
// (1.0 ≈ 0.76 g); steering is the maximum road-wheel angle in radians. Sports and
// exotic bodies corner flatter and turn in sharper; tall and heavy bodies understeer.
export const BODY_GRIP={hatch:1.02,sedan:1,wagon:.98,suv:.9,pickup:.88,van:.86,
 coupe:1.12,muscle:.98,tuner:1.15,roadster:1.12,luxury:1,gt:1.1,supercar:1.28,hypercar:1.32,
 scooter:.92,standard:1,sportbike:1.15,naked:1.08,cruiser:.9,touring:.92,offroad:1.05,
 taxi:1,police:1.06,ambulance:.82,delivery:.8,bus:.72,service:.8};
export const BODY_STEERING={bus:.38,ambulance:.42,delivery:.42,service:.42,van:.45,pickup:.45,suv:.46,
 coupe:.5,tuner:.5,roadster:.5,supercar:.5,hypercar:.5,gt:.49};
const model=(id,name,category,body,price,rep,length,width,height,power,maxSpeed,brake,mass,wheelbase=2.65)=>({id,name,category,body,price,rep,length,width,height,power,maxSpeed,brake,mass,wheelbase,grip:BODY_GRIP[body]??1,steering:BODY_STEERING[body]??(category==='Motorcycles'?.52:.48),chapters:price>=1800?3:price>=1000?2:0});
export const VEHICLE_CATALOG=[
 model('hatch','Mica Hatch','Everyday','hatch',120,0,3.8,1.7,1.45,4.5,22,11,1100,2.4),
 model('sedan','Civic Meridian','Everyday','sedan',220,15,4.35,1.8,1.4,5.2,25,12,1400),
 model('suv','Trail Family','Everyday','suv',360,30,4.6,1.95,1.85,4.8,24,11,1900,2.85),
 model('pickup','Parcel Pickup','Everyday','pickup',340,25,4.8,1.9,1.75,4.7,23,10.5,2000,3),
 model('minivan','Seven Seat Miracle','Everyday','van',300,20,4.65,1.85,1.85,4.3,22,10.5,1800,2.9),
 model('wagon','Municipal Estate','Everyday','wagon',260,20,4.55,1.8,1.48,4.9,24,11.5,1550,2.85),
 model('coupe','Kestrel GT','Performance','coupe',550,65,4.3,1.9,1.2,6.7,31,13,1300,2.55),
 model('muscle','Ironwood V8','Performance','muscle',650,90,4.7,1.95,1.3,7.4,32,12,1750,2.8),
 model('tuner','Mica RS','Performance','tuner',480,60,4.05,1.85,1.28,6.4,29,13,1200,2.5),
 model('sport-sedan','Meridian R','Performance','sedan',720,110,4.4,1.9,1.35,7.1,32,13.5,1500),
 model('roadster','Solstice Open','Performance','roadster',600,80,4.1,1.85,1.1,6.5,30,13,1150,2.4),
 model('luxury','Aster Executive','Premium','luxury',1100,180,5,1.95,1.45,6.5,31,13,2050,3.1),
 model('executive-suv','Aster Summit','Premium','suv',1250,200,4.9,2.05,1.95,6.1,29,12.5,2300,3),
 model('exotic','Vireo S','Premium','supercar',1800,300,4.5,2.05,1.05,8.8,38,15,1350,2.7),
 model('hyper','Vireo Apex','Premium','hypercar',2800,450,4.75,2.1,.98,10.2,42,16,1400,2.85),
 model('grand-tourer','Aster Horizon','Premium','gt',1400,240,4.8,1.98,1.25,7.7,35,14,1750,2.9),
 model('track','Kestrel Track','Premium','supercar',1600,270,4.4,2,1.04,8.3,36,15.5,1250,2.6),
 model('scooter','Pocket Commuter','Motorcycles','scooter',70,0,1.95,.7,1.2,3.8,17,10,140,1.35),
 model('commuter','Metro 250','Motorcycles','standard',110,0,2.05,.75,1.1,5.3,23,11,180,1.45),
 model('sport-bike','Vireo Two','Motorcycles','sportbike',400,50,2.15,.76,1.1,8.5,34,13,210,1.45),
 model('naked-bike','Metro Naked','Motorcycles','naked',280,30,2.1,.78,1.1,6.9,28,12,200,1.45),
 model('cruiser','Ironwood Twin','Motorcycles','cruiser',320,40,2.45,.85,1.05,5.8,26,11,280,1.65),
 model('touring','Horizon Touring','Motorcycles','touring',480,60,2.5,.92,1.35,6.2,28,12,330,1.65),
 model('dirt-bike','Trail Hopper','Motorcycles','offroad',240,20,2.15,.78,1.3,5.8,24,11,150,1.45),
 model('taxi','Meridian City Taxi','City service','taxi',350,30,4.35,1.8,1.45,5.2,25,12,1450),
 model('police','Municipal Patrol','City service','police',700,100,4.55,1.9,1.45,6.8,31,13,1600),
 model('ambulance','Community Medic','City service','ambulance',800,120,5.4,2.05,2.5,4.6,23,11,3000,3.2),
 model('delivery','Parcel Panel Van','City service','delivery',420,35,4.9,1.95,2,4.5,22,11,2200,3),
 model('bus','Neighborhood Shuttle','City service','bus',950,150,7.4,2.3,2.7,3.4,19,10,6500,4.5),
 model('service','Department of Trucks','City service','service',600,75,5.5,2.1,2.25,4.1,21,10.5,3400,3.4),
];
export const VEHICLE_BY_ID=Object.fromEntries(VEHICLE_CATALOG.map(v=>[v.id,v]));
export const DEFAULT_PAINTS=['#678e85','#b96648','#416988','#d4c6a5','#242e36','#a7b9c2','#c6ab55','#8c6586'];
export const GARAGE_KEY='npc-life:garage-v1';
export const GARAGES=[{id:'northgate',name:'Northgate Motor Stop',x:-28,z:-141,pads:[{x:-43,z:-141,heading:0},{x:-17,z:-141,heading:0}]},{id:'eastbank',name:'Eastbank Motor Stop',x:157,z:-38,pads:[{x:158,z:-22,heading:Math.PI/2},{x:158,z:-10,heading:Math.PI/2}]},{id:'juniper',name:'Juniper Motor Club',x:-82,z:-71,pads:[{x:-80,z:-64,heading:Math.PI/2},{x:-78,z:-52,heading:Math.PI/2}]},{id:'dispatch',name:'Dispatch Motor Pool',x:8,z:-82,pads:[{x:12,z:-70,heading:Math.PI/2},{x:12,z:-58,heading:Math.PI/2}]}];
export const freshGarage=()=>({version:1,owned:/** @type {string[]} */([]),paints:/** @type {Record<string,string>} */({}),rims:/** @type {Record<string,string>} */({}),selected:''});
export function validateGarage(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1||!Array.isArray(value.owned)||value.owned.some(id=>!VEHICLE_BY_ID[id]))throw new Error('Invalid garage record');
 const paints=value.paints??{},rims=value.rims??{};
 if(!paints||typeof paints!=='object'||Array.isArray(paints)||!rims||typeof rims!=='object'||Array.isArray(rims))throw new Error('Invalid vehicle finish');
 for(const [id,color]of Object.entries(paints))if(!value.owned.includes(id)||typeof color!=='string'||!/^#[0-9a-f]{6}$/i.test(color))throw new Error('Invalid paint');
 for(const [id,rim]of Object.entries(rims))if(!value.owned.includes(id)||!['alloy','dark','gold'].includes(/** @type {string} */(rim)))throw new Error('Invalid rims');
 if(value.selected&&!value.owned.includes(value.selected))throw new Error('Unowned garage selection');
 return {version:1,owned:[...new Set(/** @type {string[]} */(value.owned))],paints:{...paints},rims:{...rims},selected:value.selected||''};
}
export function loadGarage(){try{return validateGarage(JSON.parse(localStorage.getItem(GARAGE_KEY)||'null'));}catch{return freshGarage();}}
export function buyVehicle(state,id,balance,reputation,chapters=0){const v=VEHICLE_BY_ID[id];if(!v||state.owned.includes(id))return {ok:false,reason:'Already owned or unavailable.'};if(reputation<v.rep||chapters<v.chapters)return {ok:false,reason:'Earn the listed reputation and career promotions first.'};if(!Number.isFinite(balance)||balance<v.price)return {ok:false,reason:'Not enough coins. Resident shifts in L pay into this same wallet.'};return {ok:true,price:v.price,state:{...state,owned:[...state.owned,id],selected:id}};}
