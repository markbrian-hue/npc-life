// NPC LIFE - NYC street reconstruction. Single set of planned street corridors,
// infill lots, crossings and paved districts consumed by physics and renderers.
// The old center fountain/traffic circle is intentionally removed.
export const REBUILT_CIVIC_ROADS=[
 {id:'civic-broadway-cross',kind:'avenue',axis:'x',x:0,z:0,length:35,width:8.5},
 {id:'civic-broadway-spine',kind:'avenue',axis:'z',x:0,z:0,length:35,width:8.5},
 {id:'civic-west-local',kind:'collector',axis:'z',x:-48,z:-34,length:140,width:8.5},
 {id:'civic-east-local',kind:'collector',axis:'z',x:48,z:-34,length:140,width:8.5},
 {id:'civic-38th-street',kind:'collector',axis:'x',x:0,z:-38,length:126,width:8.5},
 {id:'civic-43rd-street',kind:'collector',axis:'x',x:0,z:38,length:126,width:8.5},
 // Fill the old industrial disconnect, but preserve all job and shop positions.
 {id:'west-grid-link',kind:'collector',axis:'z',x:-48,z:-115,length:39,width:8.5},
 {id:'midtown-north-link',kind:'collector',axis:'x',x:18,z:-190,length:211,width:8.5},
];
const avenueXs=[-235,-190,-146,-100,-51,0,50,116,168,217,261];
export const EXTENDED_NYC_ROADS=[
 // Each connects at z=-335 with the previous avenue, crossing W 24th/21st/18th.
 ...avenueXs.map((x,i)=>({
  id:'uptown-north-'+i,kind:i===7?'highway':'avenue',
  axis:'z',x,z:-396,length:128,width:i===7?12:9.5
 })),
 // A second row of western avenues reaches the preexisting -219/-263/-307 blocks.
 ...[-235,-190].map((x,i)=>({
  id:'uptown-west-'+i,kind:'avenue',axis:'z',x,z:-270,length:130,width:9.5
 })),
 ...[-219,-263,-307,-332].map((z,i)=>({
  id:'uptown-west-connector-'+i,kind:'collector',axis:'x',
  x:-198,z,length:92,width:9.5
 })),
 ...[-362,-400,-438].map((z,i)=>({
  id:'uptown-cross-street-'+i,kind:'collector',axis:'x',
  x:14,z,length:522,width:9.5
 })),
];
export const NEW_CITY_ROADS=[...REBUILT_CIVIC_ROADS,...EXTENDED_NYC_ROADS];
// Paved ground replaces the original central green meadows. Roads still use their
// own asphalt/sidewalk geometries on top of these lower base surfaces.
export const URBAN_GROUND_ZONES=[
 {id:'downtown-core',x:12,z:-26,w:170,d:210},
 {id:'warehouse-district',x:134,z:-47,w:178,d:245},
 {id:'west-end',x:-105,z:-67,w:125,d:195},
 {id:'northgate-approach',x:-10,z:-153,w:260,d:86},
 {id:'upper-grid',x:14,z:-383,w:536,d:154},
];
export const CITY_CROSSINGS=[
 {id:'civic-times-cross-x',x:0,z:0,axis:'x',width:8.5},
 {id:'civic-times-cross-z',x:0,z:0,axis:'z',width:8.5},
 ...[-48,48].flatMap((x,i)=>[-38,0,38].map((z,j)=>({
   id:'civic-cross-'+i+'-'+j,x,z,axis:'z',width:8.5
 }))),
 ...[-362,-400,-438].flatMap((z,j)=>
   [-235,-190,-146,-100,-51,0,50,116,168,217,261].map((x,i)=>({
    id:'uptown-cross-'+j+'-'+i,x,z,axis:'z',width:9.5
   }))
];
// Traffic poles occupy physically clear sidewalk quadrants, not roads.
export const CORNER_SIGNAL_CANDIDATES=CITY_CROSSINGS.filter((p,i)=>
  p.id.startsWith('uptown-')?i%2===0:true).map((p,i)=>({
    id:'nyc-signal-'+i,
    x:p.x+p.width/2+2.85,z:p.z+p.width/2+2.85,
    w:.3,d:.3,rotation:0,
  }));
// Generate actual low/mid-rise infill next to roads. The world's shared
// placeCandidates function chooses real accepted lots; rejected lots are
// neither drawn nor collidable. Never introduce invisible building facades.
const facade=['#b9a794','#a89180','#c1b2a1','#8699a7','#a5aaae','#b19d91','#b2a39b'];
export function generateStreetInfill(roads){
 const candidates=[];
 const corridors=roads.filter(r=>r.id.startsWith('civic-')||r.id==='midtown-north-link'||r.id.startsWith('north-')||
 r.id.startsWith('east-')||r.id.startsWith('west-')||r.id.startsWith('uptown-')||r.id.startsWith('bypass-')||
 r.id.startsWith('dock-')||r.id.startsWith('campus-'));
 for(const r of corridors){
  const count=Math.min(24,Math.floor(r.length/21));
  for(let j=0;j<count;j++)for(const side of [-1,1]){
   // Two rows of buildings on selected long Manhattan streets for visible depth.
   const along=(j+.5-count/2)*21,depth=r.width/2+9.2+(j%5===0?13:0);
   const x=r.x+(r.axis==='x'?along:side*depth),z=r.z+(r.axis==='z'?along:side*depth);
   if(z>76||z< -455||x<-276||x>289)continue;
   const index=candidates.length,west=x<-72,east=x>145,office=!west&&!east&&z< -155;
   const kind=west||east?'brownstone':office?'tower':'prewar';
   candidates.push({x,z,w:r.axis==='z'?9.5:11,d:r.axis==='z'?12:9.5,
    h:kind==='brownstone'?10+index%5*1.7:kind==='tower'?23+index%8*4:13+index%6*2.8,
    kind,color:facade[index%facade.length],roof:'#505c61',rotation:0,
    borough:west?'west-end':east?'eastbank':office?'midtown':'civic'});
  }
 }
 return candidates;
}
