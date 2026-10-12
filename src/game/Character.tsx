import { memo, type RefObject } from 'react';
import type { Group } from 'three';

type Rig = RefObject<Group | null>;
type Props = { shirt: string; hair?: string; pants?: string; skin?: string; gender?: 'woman' | 'man'; style?: number; bodyRef?: Rig; leftArmRef?: Rig; rightArmRef?: Rig; leftLegRef?: Rig; rightLegRef?: Rig };
/** All residents face local +Z. Shared anatomical landmarks keep animations and hats aligned. */
export const Character=memo(function Character({ shirt, hair = '#49382e', pants = '#354653', skin = '#d5a17a', gender = 'man', style = 0, bodyRef, leftArmRef, rightArmRef, leftLegRef, rightLegRef }: Props) {
  const female = gender === 'woman';
  return <group ref={bodyRef}>
    <mesh castShadow position={[0, 1.44, 0]} scale={[female ? .76 : .88, 1, .49]}><cylinderGeometry args={[.56, .45, .88, 8]} /><meshStandardMaterial color={shirt} roughness={.9} /></mesh>
    <mesh position={[0, 1.9, 0]}><cylinderGeometry args={[.14, .18, .25, 8]} /><meshStandardMaterial color={skin} /></mesh>
    <mesh castShadow position={[0, 2.28, 0]} scale={[female ? .32 : .35, .43, .3]}><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color={skin} roughness={.86} /></mesh>
    <mesh position={[0, 2.08, .075]} scale={[.24, .16, .21]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color={skin} /></mesh>
    <mesh position={[0, 2.27, .303]} rotation={[.15, 0, 0]}><coneGeometry args={[.067, .18, 5]} /><meshStandardMaterial color={skin} /></mesh>
    <mesh position={[0, 2.105, .281]}><boxGeometry args={[.15, .023, .017]} /><meshStandardMaterial color={female ? '#a6655c' : '#845a4b'} /></mesh>
    <mesh castShadow position={[0, 2.53, -.025]} scale={[.36, .24, .32]}><sphereGeometry args={[1, 12, 8, 0, Math.PI * 2, 0, Math.PI * .72]} /><meshStandardMaterial color={hair} roughness={1} /></mesh>
    {[-1, 1].map(s => <group key={s}>
      <mesh position={[s * .337, 2.28, -.005]} scale={[.065, .115, .06]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color={skin} /></mesh>
      <mesh position={[s * .137, 2.345, .272]} scale={[.087, .046, .026]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#eee4d3" /></mesh>
      <mesh position={[s * .137, 2.345, .295]}><circleGeometry args={[.029, 10]} /><meshBasicMaterial color={style % 2 ? '#687e65' : '#564638'} /></mesh>
      <mesh position={[s * .137, 2.345, .297]}><circleGeometry args={[.014, 8]} /><meshBasicMaterial color="#212724" /></mesh>
      <mesh position={[s * .137, 2.425, .278]} rotation={[0, 0, s * -.08]}><boxGeometry args={[.17, .026, .025]} /><meshStandardMaterial color={hair} /></mesh>
      {(female || style === 2) && <mesh castShadow position={[s * .305, 2.25, -.06]} scale={[.1, female ? .35 : .17, .22]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color={hair} /></mesh>}
      <group ref={s < 0 ? leftArmRef : rightArmRef} position={[s * .49, 1.76, 0]} rotation={[0, 0, s * .07]}>
        <mesh castShadow position={[0, -.19, 0]}><cylinderGeometry args={[.145, .12, .4, 8]} /><meshStandardMaterial color={shirt} /></mesh>
        <mesh castShadow position={[0, -.51, 0]}><cylinderGeometry args={[.115, .085, .3, 8]} /><meshStandardMaterial color={skin} /></mesh>
        <mesh position={[0, -.72, .02]} scale={[.09, .14, .08]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color={skin} /></mesh>
      </group>
      <group ref={s < 0 ? leftLegRef : rightLegRef} position={[s * .21, 1.03, 0]}>
        <mesh castShadow position={[0, -.43, 0]}><cylinderGeometry args={[.17, .13, .86, 8]} /><meshStandardMaterial color={pants} /></mesh>
        <mesh castShadow position={[0, -.91, .085]}><boxGeometry args={[.29, .18, .48]} /><meshStandardMaterial color="#353733" /></mesh>
        <mesh position={[0, -.995, .085]}><boxGeometry args={[.3, .025, .49]} /><meshStandardMaterial color="#b5ac97" /></mesh>
      </group>
    </group>)}
    {female && style % 2 === 1 && <mesh castShadow position={[0, 2.3, -.39]} scale={[.15, .31, .16]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color={hair} /></mesh>}
    <mesh position={[0, 1.06, .005]}><boxGeometry args={[.76, .07, .45]} /><meshStandardMaterial color="#514638" /></mesh>
  </group>;
});
