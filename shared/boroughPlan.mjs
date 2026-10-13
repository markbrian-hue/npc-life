// Original borough-inspired zoning: adds density without replacing prior Northgate,
// Eastbank, Grove, mission, garage or road layouts. All footprints pass placeCandidates.
export const BOROUGHS = [
 {id:'midtown',name:'NEON CROSSING',label:'Midtown / Neon Crossing',x:18,z:-168,w:234,d:96,color:'#6d8494'},
 {id:'brownstone',name:'EASTBANK ROW',label:'Eastbank / Brownstone Row',x:166,z:-46,w:86,d:165,color:'#a56f5f'},
];
export const BOROUGH_PARCELS = [
 // Additional block infill: previous buildings are evaluated first, so these
 // never erase an original feature, road crossing or gameplay destination.
 ...[[-70,-121,10,9],[-40,-121,10,9],[-18,-177,10,10],[12,-174,10,10],
     [46,-189,10,9],[81,-192,9,9],[17,-125,9,9],[47,-124,10,9],
     [80,-122,9,9],[104,-181,10,9]].map(([x,z,w,d],i)=>({
      x,z,w,d,h:18+(i%4)*4,color:'#97aeb9',roof:'#3c515d',
      rotation:0,kind:'tower',borough:'midtown'
     })),
 ...[[142,-91],[190,-91],[142,-21],[190,-21],[142,38],[190,38],
     [142,-60],[190,-60],[141,-117],[190,-117]].map(([x,z],i)=>({
      x,z,w:6.2,d:6.8,h:10+(i%3)*2,color:'#b88e79',roof:'#735954',
      rotation:Math.PI/2,kind:'brownstone',borough:'brownstone'
     }))
];
export function styleBoroughBuilding(b,i=0){
 // A building is styled only after existing footprint and road-clearance filtering.
 // The height change automatically updates the same player/vehicle/camera colliders.
 if(b.kind==='bungalow'){
  // Preserve every Juniper/Grove home's exact footprint while replacing
  // suburban single-storey art with Brooklyn-inspired brick townhouses.
  return {...b,kind:'brownstone',borough:'brooklyn',h:10.8+(i%3)*1.3,
   color:['#a98272','#bb9784','#a87566','#b5a090'][i%4],roof:'#675a58'};
 }
 if(b.kind==='warehouse')return b;
 if(b.borough)return b;
 if(b.z<=-113&&b.z>=-196&&b.x>=-42&&b.x<=110){
  const height=24+(i%5)*5;
  return {...b,kind:'tower',borough:'midtown',h:height,
   color:['#9aafbb','#a9b7b9','#829ba7','#a1a8af'][i%4],roof:'#415661'};
 }
 // The starter civic square becomes a recognizable lower Manhattan streetscape,
 // while original footprints, storefront interaction sites and missions remain fixed.
 if(Math.abs(b.x)<=36&&Math.abs(b.z)<=23){
  return {...b,kind:'prewar',borough:'civic',h:15+(i%3)*3,
   color:['#ad8c79','#a99183','#bdafa0','#a88376'][i%4],roof:'#625956'};
 }
 if(b.x>=45&&b.x<=76&&Math.abs(b.z)<=29){
  return {...b,kind:'tower',borough:'civic',h:25+(i%4)*4,
   color:['#91a6ae','#a4afb1','#9aa4b0'][i%3],roof:'#515d65'};
 }
 if(b.x>=130&&b.x<=201&&b.z>=-120&&b.z<=58){
  return {...b,kind:'brownstone',borough:'brownstone',
   h:11+(i%3)*2,color:['#b88e7b','#bd9a86','#a67c6e','#c6a18e'][i%4],roof:'#795d54'};
 }
 return b;
}
export const boroughAt=(x,z)=>BOROUGHS.find(d=>Math.abs(x-d.x)<d.w/2&&Math.abs(z-d.z)<d.d/2)||null;

// Crossings are authored on the existing connector roads; asphalt and map routing
// continue to come from cityPlan, so this adds markings, not an overlapping road.
export const BOROUGH_CROSSINGS=[
 {id:'neon-west',x:-13,z:-150,axis:'x',width:8.5},
 {id:'neon-east',x:73,z:-150,axis:'x',width:8.5},
 {id:'eastbank-north',x:168,z:-66,axis:'z',width:8.5},
 {id:'eastbank-central',x:168,z:20,axis:'z',width:8.5},
 {id:'eastbank-market',x:144,z:0,axis:'x',width:8.5}
];
export const BOROUGH_SIGNAL_CANDIDATES=BOROUGH_CROSSINGS.flatMap(c=>
 [-1,1].map((side)=>({
  id:c.id+':'+side,
  x:c.x+(c.axis==='z'?side*(c.width/2+2.45):2.8*side),
  z:c.z+(c.axis==='x'?side*(c.width/2+2.45):2.8*side),
  w:.35,d:.35,
  rotation:0,
  boroughSignal:true
 }))
);
