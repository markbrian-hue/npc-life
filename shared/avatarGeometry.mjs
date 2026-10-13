import {BoxGeometry,Float32BufferAttribute,Color} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
/** Original six-limb block rig. Vertex colors keep each moving part to one draw. */
function part(boxes){
 const geometries=boxes.map(([size,pos,color])=>{const g=new BoxGeometry(...size).toNonIndexed(),c=new Color(color),colors=[];for(let i=0;i<g.attributes.position.count;i++)colors.push(c.r,c.g,c.b);g.setAttribute('color',new Float32BufferAttribute(colors,3));g.translate(...pos);return g;});
 const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());return merged;
}
export function blockRig({shirt,hair='#49382e',pants='#354653',skin='#d5a17a',gender='man',style=0}){
 const long=gender==='woman'||style===2;
 return {
  body:part([[[.9,.94,.52],[0,1.67,0],shirt],[[.87,.09,.54],[0,1.24,0],pants],[[.17,.12,.015],[.23,1.83,.27],'#e4dbc5']]),
  head:part([[[.61,.6,.57],[0,2.44,0],skin],[[.65,.16,.6],[0,2.77,-.015],hair],[[.65,long?.57:.28,.15],[0,long?2.47:2.6,-.25],hair],[[.35,.12,.11],[style===1?.13:-.13,2.65,.27],hair],...(long?[[[.12,.45,.49],[-.29,2.45,-.02],hair],[[.12,.45,.49],[.29,2.45,-.02],hair]]:[])]),
  arm:part([[[.3,.38,.48],[0,-.16,0],shirt],[[.29,.45,.45],[0,-.57,0],skin]]),
  leg:part([[[.39,.94,.48],[0,-.49,0],pants],[[.4,.16,.57],[0,-1.045,.045],'#303840'],[[.4,.035,.58],[0,-1.14,.045],'#d0cbbd']]),
 };
}
