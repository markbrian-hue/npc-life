// Original traffic-calming tables. One profile drives both the mesh and physics.
export const SPEED_TABLES=[
 {id:'park-crossing',x:-58,z:0,axis:'x',length:3.4,width:8.4,height:.12},
 {id:'juniper-local',x:-92,z:-58,axis:'z',length:3.4,width:6.8,height:.12},
];
export function tableHeight(table,along,across){
 if(Math.abs(along)>=table.length/2||Math.abs(across)>=table.width/2)return 0;
 const edge=Math.min(1,(table.width/2-Math.abs(across))/.25);
 return table.height*(.5+.5*Math.cos(along/table.length*Math.PI*2))*edge;
}
export function roadSurfaceHeight(x,z){let height=0;for(const t of SPEED_TABLES){const dx=x-t.x,dz=z-t.z;height=Math.max(height,tableHeight(t,t.axis==='x'?dx:dz,t.axis==='x'?dz:dx));}return height;}
