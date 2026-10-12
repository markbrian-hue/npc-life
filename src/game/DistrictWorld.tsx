import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, DoubleSide, NearestFilter, type Group } from 'three';
import { DISTRICTS, MISSIONS, currentTask, type Campaign } from './campaign';
import { StreetLamp, Bench } from './CityProps';

export function WorldSign({ text, color = '#edbe56', width = 5 }: { text: string; color?: string; width?: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 96;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#202d2c'; ctx.fillRect(0, 0, 512, 96);
    ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.strokeRect(4, 4, 504, 88);
    ctx.fillStyle = color; ctx.font = 'bold 30px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text.toUpperCase(), 256, 49, 480);
    const map = new CanvasTexture(canvas); map.magFilter = NearestFilter; return map;
  }, [text, color]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh><planeGeometry args={[width, width * 96 / 512]} /><meshBasicMaterial map={texture} side={DoubleSide} toneMapped={false} /></mesh>;
}
function Block({ at, size, color }: { at: [number, number, number]; size: [number, number, number]; color: string }) {
  return <mesh position={at} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.9} /></mesh>;
}
function Beacon({ done }: { done: boolean }) {
  const rotor = useRef<Group>(null);
  useFrame((_, dt) => { if (rotor.current && done) rotor.current.rotation.y += dt * .65; });
  return <group position={[10, 0, 70]}>
    <mesh position={[0, 3, 0]} castShadow><cylinderGeometry args={[.7, 1.1, 6, 8]} /><meshStandardMaterial color="#ece0bc" /></mesh>
    <group ref={rotor} position={[0, 6.6, 0]}>
      <mesh><cylinderGeometry args={[1.1, 1.1, 1.3, 8]} /><meshStandardMaterial color={done ? '#ffe39a' : '#627b80'} emissive={done ? '#ffd26b' : '#000000'} emissiveIntensity={1.2} /></mesh>
      <mesh position={[0, 1, 0]}><coneGeometry args={[1.5, 1, 8]} /><meshStandardMaterial color="#b95c4b" /></mesh>
    </group>
  </group>;
}
export const DistrictWorld = memo(function DistrictWorld({ campaign, carrying }: { campaign: Campaign; carrying: boolean }) {
  const task = currentTask(campaign, carrying);
  const marker = useRef<Group>(null);
  const power = campaign.step > 2, market = campaign.step > 4, park = campaign.step > 6, harbor = campaign.step > 7, festival = campaign.step >= MISSIONS.length;
  useFrame(({ clock }) => {
    if (marker.current) marker.current.position.y = 2.5 + Math.sin(clock.elapsedTime * 2) * .15;
  });
  return <>
    {/* Small district squares give the street network a readable rhythm. */}
    {DISTRICTS.slice(1).map(d => <group key={d.id} position={[d.x, 0, d.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.017, 0]} receiveShadow><circleGeometry args={[11, 32]} /><meshStandardMaterial color={d.id === 'park' ? '#879f6c' : '#c4bba1'} /></mesh>
      <group position={[0, 5, -9]}><WorldSign text={d.name} color={d.color} width={9} /></group>
      {[-5, 5].map(x => <Block key={x} at={[x, 2.5, -9]} size={[.18, 5, .18]} color="#455952" />)}
    </group>)}
    {[-62, -44, 44, 62].flatMap(v => [<StreetLamp key={`x${v}`} x={v} z={8} />, <StreetLamp key={`z${v}`} x={-8} z={v} />])}
    <Bench x={-56} z={10} rotation={0} /><Bench x={-64} z={10} rotation={0} />
    <Bench x={17} z={68} rotation={Math.PI} />
    {/* Switchyard: transformer bank and power indicators. */}
    {[-6, 0, 6].map(x => <group key={x} position={[x, 0, -73]}>
      <Block at={[0, 1.7, 0]} size={[3, 3.4, 3]} color="#5b7474" />
      <Block at={[0, 2.2, 1.53]} size={[1.8, .25, .1]} color={power ? '#b9ed9a' : '#d48361'} />
      {[-.9, .9].map(dx => <mesh key={dx} position={[dx, 4.1, 0]}><cylinderGeometry args={[.25, .4, 1.5, 8]} /><meshStandardMaterial color="#b6c5b7" /></mesh>)}
    </group>)}
    <group position={[6, 0, -62]}><Block at={[0, 1, 0]} size={[1.8, 2, .8]} color={power ? '#8aaf7d' : '#a16d57'} /><group position={[0, 1.5, .42]}><WorldSign text={power ? 'ONLINE' : 'NO POWER'} width={1.6} /></group></group>
    {/* Market stalls, stocked as a result of the delivery. */}
    {[48, 60, 72].map((x, i) => <group key={x} position={[x, 0, 10]}>
      <Block at={[0, .7, 0]} size={[5, 1.4, 2]} color="#a27e56" />
      {[-2.2, 2.2].map(dx => <Block key={dx} at={[dx, 1.9, 0]} size={[.12, 3.8, .12]} color="#576b62" />)}
      {Array.from({ length: 6 }, (_, stripe) => <Block key={stripe} at={[-2.25 + stripe * .9, 3.7, 0]} size={[.9, .18, 3.4]} color={stripe % 2 ? '#f1ddba' : ['#b55f62', '#ccaa5b', '#639788'][i]} />)}
      {market && [-1.6, 0, 1.6].map(dx => <mesh key={dx} position={[dx, 1.55, 0]}><dodecahedronGeometry args={[.55, 0]} /><meshStandardMaterial color={i % 2 ? '#e6b568' : '#a4b861'} /></mesh>)}
    </group>)}
    {/* Community garden: bare beds become a field of flowers. */}
    {[-72, -62, -52].flatMap(x => [-17, 18].map(z => <group key={`${x}${z}`} position={[x, 0, z]}>
      <Block at={[0, .13, 0]} size={[6, .26, 4]} color="#b6a483" /><Block at={[0, .28, 0]} size={[5.5, .12, 3.5]} color="#645846" />
      {park && [-2, 0, 2].flatMap(dx => [-1, 1].map(dz => <group key={`${dx}${dz}`} position={[dx, 0, dz]}>
        <Block at={[0, .65, 0]} size={[.12, .8, .12]} color="#567756" /><mesh position={[0, 1.1, 0]}><dodecahedronGeometry args={[.42, 0]} /><meshStandardMaterial color={dx === 0 ? '#e6b980' : '#d59fb0'} /></mesh>
      </group>))}
    </group>))}
    {/* Harbor: actual shore, timber pier, moored boats and beacon. */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.04, 98]}><planeGeometry args={[260, 46]} /><meshStandardMaterial color="#578f9b" roughness={.3} metalness={.25} /></mesh>
    <Block at={[0, -.02, 83]} size={[20, .24, 20]} color="#a89676" />
    {[-1, 1].flatMap(side => Array.from({ length: 8 }, (_, i) => <Block key={`${side}${i}`} at={[side * (16 + i * 10), .3, 75]} size={[9.8, .7, .8]} color="#b5b7a0" />))}
    {Array.from({ length: 12 }, (_, i) => <Block key={i} at={[0, .12, 75 + i * 1.1]} size={[20, .05, .06]} color="#7b725e" />)}
    {[-24, 27].map((x, i) => <group key={x} position={[x, 0, 84]} rotation={[0, i ? -.4 : .2, 0]}>
      <mesh position={[0, .5, 0]} scale={[1, .6, 2.3]}><cylinderGeometry args={[2, 1.2, 1.8, 6]} /><meshStandardMaterial color={i ? '#c38b72' : '#ddd6bb'} /></mesh>
      <Block at={[0, 1.3, 0]} size={[2.8, .6, 4]} color="#5b8588" /><Block at={[0, 3.2, 0]} size={[.12, 5, .12]} color="#e3d7b9" />
    </group>)}
    <Beacon done={harbor} />
    {/* Council booth and festival stage. */}
    <group position={[6, 0, -13]}><Block at={[0, 1, 0]} size={[2.5, 2, 1.2]} color="#b59656" /><group position={[0, 2.9, 0]}><WorldSign text="COUNCIL" width={3.5} /></group></group>
    <group position={[-19, 0, -32]}><Block at={[0, .3, 0]} size={[13, .6, 6]} color="#84725d" /><group position={[0, 4.8, 0]}><WorldSign text={festival ? 'FESTIVAL OPEN!' : 'FESTIVAL: CANCELLED'} color={festival ? '#b6d797' : '#d9a091'} width={12} /></group>
      {[-6, 6].map(x => <Block key={x} at={[x, 2.5, 0]} size={[.22, 5, .22]} color="#586c64" />)}
      {festival && [-4, -2, 0, 2, 4].map((x, i) => <mesh key={x} position={[x, 3.3, 0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[.55, 1, 3]} /><meshStandardMaterial color={['#d79183', '#edbe56', '#97c4b6'][i % 3]} /></mesh>)}
    </group>
    {/* Mission props stay beyond the reachable interaction point. */}
    {MISSIONS.filter(m => ['fuse', 'stock', 'seeds'].includes(m.id)).map(m => <group key={m.id} position={[m.x, 0, m.z - 1.7]}>
      <Block at={[0, .5, 0]} size={[1.2, 1, 1.2]} color="#b68b53" /><Block at={[0, .53, .61]} size={[.15, 1.05, .03]} color="#ead5a5" />
    </group>)}
    <group position={[task.x, 0, task.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .07, 0]}><ringGeometry args={[1.6, 1.82, 32]} /><meshBasicMaterial color="#ffdc79" side={DoubleSide} /></mesh>
      <group ref={marker} position={[0, 2.5, 0]}><mesh rotation={[0, 0, Math.PI]}><coneGeometry args={[.38, .65, 4]} /><meshBasicMaterial color="#ffe395" /></mesh></group>
    </group>
  </>;
});
