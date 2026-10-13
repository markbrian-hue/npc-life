import {rounded} from './vehicleGeometry';
import {memo,type RefObject} from 'react';
import type {Group} from 'three';
type Rig=RefObject<Group|null>;
type Props={shirt:string;hair?:string;pants?:string;skin?:string;gender?:'woman'|'man';style?:number;riding?:'sport'|'upright';bodyRef?:Rig;leftArmRef?:Rig;rightArmRef?:Rig;leftLegRef?:Rig;rightLegRef?:Rig};
/** Local +Z facing, proportional landmarks shared by player, residents and riders. */
export const Character=memo(function Character({shirt,hair='#49382e',pants='#354653',skin='#d5a17a',gender='man',style=0,riding,bodyRef,leftArmRef,rightArmRef,leftLegRef,rightLegRef}:Props){const female=gender==='woman';return <group ref={bodyRef} scale={.72}>
 <mesh castShadow position={[0,1.62,0]} scale={[female?.81:.91,1,.51]}><capsuleGeometry args={[.43,.36,6,16]}/><meshStandardMaterial color={shirt} roughness={.88}/></mesh>
 <mesh position={[0,2.14,0]}><cylinderGeometry args={[.115,.14,.24,10]}/><meshStandardMaterial color={skin}/></mesh>
 <mesh castShadow position={[0,2.44,0]} scale={[.265,.29,.245]}><sphereGeometry args={[1,24,20]}/><meshStandardMaterial color={skin} roughness={.8}/></mesh>
 <mesh position={[0,2.28,.03]} scale={[.2,.12,.19]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={skin}/></mesh>
 <mesh position={[0,2.43,.25]} rotation={[Math.PI/2,0,0]}><coneGeometry args={[.036,.11,12]}/><meshStandardMaterial color={skin}/></mesh>
 <mesh position={[0,2.29,.23]}><boxGeometry args={[.105,.015,.014]}/><meshStandardMaterial color="#986458"/></mesh>
 <mesh castShadow position={[0,2.64,-.02]} scale={[.28,.16,.265]}><sphereGeometry args={[1,24,16,0,Math.PI*2,0,Math.PI*.68]}/><meshStandardMaterial color={hair} roughness={.94}/></mesh>
 {style===1&&<mesh castShadow position={[.07,2.72,.04]} rotation={[0,0,-.2]} scale={[.22,.06,.19]}><sphereGeometry args={[1,10,6]}/><meshStandardMaterial color={hair}/></mesh>}
 {[-1,1].map(side=><group key={side}>
  <mesh position={[side*.266,2.43,0]} scale={[.045,.08,.045]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color={skin}/></mesh>
  <mesh position={[side*.103,2.48,.219]} scale={[.055,.025,.015]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color="#e1ddd1"/></mesh>
  <mesh position={[side*.103,2.48,.237]}><circleGeometry args={[.017,14]}/><meshBasicMaterial color={style%2?'#6a8069':'#604c3d'}/></mesh>
  <mesh position={[side*.103,2.48,.239]}><circleGeometry args={[.008,12]}/><meshBasicMaterial color="#242b2b"/></mesh>
  <mesh position={[side*.103,2.55,.219]} rotation={[0,0,side*-.07]}><boxGeometry args={[.12,.017,.017]}/><meshStandardMaterial color={hair}/></mesh>
  {(female||style===2)&&<mesh castShadow position={[side*.246,2.42,-.08]} scale={[.055,female?.29:.13,.16]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color={hair}/></mesh>}
  <group ref={side<0?leftArmRef:rightArmRef} position={[side*.46,1.98,0]} rotation={[riding?-.9:0,0,side*.05]}>
   <mesh castShadow position={[0,-.2,0]}><cylinderGeometry args={[.13,.11,.4,9]}/><meshStandardMaterial color={shirt}/></mesh>
   <mesh castShadow position={[0,-.51,0]}><cylinderGeometry args={[.1,.075,.29,9]}/><meshStandardMaterial color={skin}/></mesh>
   <mesh position={[0,-.72,.01]} scale={[.08,.12,.07]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color={skin}/></mesh>
  </group>
  <group ref={side<0?leftLegRef:rightLegRef} position={[side*.19,1.16,0]} rotation={[riding?-.85:0,0,0]}>
   <mesh castShadow position={[0,-.27,0]}><cylinderGeometry args={[.16,.13,.54,9]}/><meshStandardMaterial color={pants}/></mesh>
   <mesh castShadow position={[0,-.77,.025]}><cylinderGeometry args={[.13,.105,.47,9]}/><meshStandardMaterial color={pants}/></mesh>
   <mesh castShadow position={[0,-1.075,.09]} geometry={rounded([.25,.17,.42],.065)}><meshStandardMaterial color="#343c3d"/></mesh>
   <mesh position={[0,-1.15,.09]}><boxGeometry args={[.26,.025,.43]}/><meshStandardMaterial color="#92948a"/></mesh>
  </group>
 </group>)}
 {female&&style===1&&<mesh castShadow position={[0,2.52,-.29]} scale={[.13,.24,.13]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={hair}/></mesh>}
 <mesh position={[0,1.14,.01]}><boxGeometry args={[.71,.06,.43]}/><meshStandardMaterial color="#514638"/></mesh>
 <mesh position={[0,1.78,.255]}><boxGeometry args={[.017,.38,.01]}/><meshStandardMaterial color="#bdbdaf"/></mesh>
</group>;});
