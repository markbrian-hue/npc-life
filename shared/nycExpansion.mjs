// NPC LIFE: original NYC-inspired northern expansion.
// This module is data-only: renderers, collisions, camera and minimap consume the
// same roads, buildings and public-space footprints. Never depend on Three.js here.
export const NYC_EXPANSION_ROADS = [
  // Manhattan grid: 9th–1st Ave-style parallel corridors and numbered cross streets.
  ...[-146,-100,-51,0,50,116,168,217,261].map((x,i)=>({
    id:'nyc-avenue-'+(i+1),kind:i===5?'highway':'avenue',axis:'z',
    x,z:-270,length:130,width:i===5?12:9.5
  })),
  ...[-219,-263,-307,-332].map((z,i)=>({
    id:'nyc-street-'+(i+1),kind:'collector',axis:'x',
    x:61,z,length:428,width:9.5
  })),
  // Exactly anchored to the old road ends: no isolated, decorative road strips.
  {id:'nyc-broadway-connector',kind:'avenue',axis:'z',x:0,z:-195,length:30,width:8.5},
  {id:'nyc-fdr-connector',kind:'highway',axis:'z',x:116,z:-195,length:30,width:12},
  {id:'nyc-eastbank-connector',kind:'avenue',axis:'z',x:168,z:-179,length:64,width:8.5}
];
export const NYC_PUBLIC_SPACES=[
 {id:'neon-plaza',name:'Neon Plaza',x:25,z:-241,w:26,d:25,kind:'plaza',color:'#aab0aa'},
 {id:'liberty-park',name:'Liberty Pocket Park',x:-123,z:-284,w:26,d:28,kind:'park',color:'#758c64'},
 {id:'east-promenade',name:'East River Promenade',x:285,z:-265,w:12,d:86,kind:'waterfront',color:'#8ca8a1'},
];
export const NYC_DISTRICTS=[
 {id:'uptown',name:'UPTOWN',x:-83,z:-308,w:130,d:52,color:'#a89f89'},
 {id:'theater',name:'THEATER DISTRICT',x:25,z:-253,w:130,d:72,color:'#836d9f'},
 {id:'financial',name:'FINANCIAL DISTRICT',x:153,z:-282,w:85,d:96,color:'#66798b'},
 {id:'brooklyn',name:'BROOKLYN ROW',x:230,z:-260,w:74,d:144,color:'#a87b6a'},
];
// Prewar, Midtown towers, financial offices, and Brooklyn-style blocks.
// Only placements that pass shared placeCandidates become world buildings.
const palette=['#9caeb8','#8a9eaa','#a9afaa','#c1b4a4','#a49b90','#9ba6b7','#b0a79b'];
const roof=['#4a555c','#515962','#555b5a','#71645f'];
const blockXs=[-123,-75,-25,25,82,142,191,239];
export const NYC_BLOCK_CANDIDATES=[];
for(const [column,x] of blockXs.entries()){
 for(const [row,z] of [-241,-285,-320].entries()){
  for(const [i,offset] of [-8,8].entries()){
   for(const [j,dz] of (row===2?[0]:[-7,7]).entries()){
    const index=column*20+row*5+i*2+j;
    const brooklyn=column>=6,prewar=column<=1,financial=column===5;
    const kind=brooklyn?'brownstone':prewar?'prewar':'tower';
    NYC_BLOCK_CANDIDATES.push({
      x:x+offset,z:z+dz,w:10.8,d:11.8,
      h:brooklyn?10+(index%3)*2:prewar?16+(index%4)*3:financial?35+(index%5)*7:28+(index%7)*7,
      color:brooklyn?['#a87968','#b58f7e','#c09c85'][index%3]:palette[index%palette.length],
      roof:roof[index%roof.length],rotation:0,kind,
      borough:brooklyn?'brooklyn':prewar?'uptown':financial?'financial':'theater'
    });
   }
  }
 }
}
// Street crossings line up with the actual road centerlines (never a vehicle spawn pad).
export const NYC_CROSSINGS = [
 ...[-219,-263,-307].flatMap((z,row)=>[-100,0,50,168,261].map((x,col)=>({
  id:'nyc-cross-'+row+'-'+col,x,z,axis:'z',width:9.5
 })))
];
export const NYC_STREET_SIGNS=[
 {x:-100,z:-219,name:'9TH AVE / W 42ND ST'},
 {x:0,z:-263,name:'BROADWAY / W 34TH ST'},
 {x:50,z:-307,name:'5TH AVE / W 23RD ST'},
 {x:168,z:-219,name:'EAST RIVER DRIVE'},
 {x:261,z:-307,name:'BROOKLYN ROW'},
];
export const NYC_RIVER={x:318,z:-266,w:44,d:148};
export function inNYCExpansion(x,z){return z<=-205&&z>=-340&&x>=-155&&x<=290;}
