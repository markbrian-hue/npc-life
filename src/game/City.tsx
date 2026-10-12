import type { ThreeElements } from '@react-three/fiber';
import { BUILDINGS, GARY, PIGEONS, type BuildingDef } from './world';

function Building({ data }: { data: BuildingDef }) {
  const { x, z, w, d, h, color, roof } = data;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, h + 0.45, 0]} castShadow>
        <boxGeometry args={[w + 0.6, 0.9, d + 0.6]} />
        <meshStandardMaterial color={roof} />
      </mesh>
      <mesh position={[0, 1.45, d / 2 + 0.025]}>
        <boxGeometry args={[1.8, 2.9, 0.09]} />
        <meshStandardMaterial color="#493c3c" />
      </mesh>
      {[-w / 3, w / 3].map((dx) =>
        [4, 7].filter((y) => y + 0.9 < h).map((y) => (
          <mesh key={`${dx}-${y}`} position={[dx, y, d / 2 + 0.06]}>
            <boxGeometry args={[1.8, 1.55, 0.12]} />
            <meshStandardMaterial color="#ccefff" emissive="#16343f" emissiveIntensity={0.2} />
          </mesh>
        )),
      )}
    </group>
  );
}

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.35, 2.4, 7]} />
        <meshStandardMaterial color="#835a42" />
      </mesh>
      <mesh position={[0, 3.1, 0]} castShadow>
        <dodecahedronGeometry args={[1.7, 0]} />
        <meshStandardMaterial color="#4eaa81" flatShading />
      </mesh>
    </group>
  );
}

function Pigeon({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.42, z]}>
      <mesh castShadow>
        <sphereGeometry args={[0.4, 9, 7]} />
        <meshStandardMaterial color="#9eb4c2" flatShading />
      </mesh>
      <mesh position={[0, 0.25, 0.2]} castShadow>
        <sphereGeometry args={[0.23, 8, 6]} />
        <meshStandardMaterial color="#c4d3de" />
      </mesh>
      <mesh position={[0, 0.22, 0.46]} rotation={[0.35, 0, 0]}>
        <coneGeometry args={[0.12, 0.26, 4]} />
        <meshStandardMaterial color="#ffbb56" />
      </mesh>
      <mesh position={[-0.19, 0.37, 0.36]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshBasicMaterial color="#17212c" />
      </mesh>
      <mesh position={[0.19, 0.37, 0.36]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshBasicMaterial color="#17212c" />
      </mesh>
    </group>
  );
}

function Gary() {
  return (
    <group position={[GARY.x, 0, GARY.z]}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[1, 1.45, 0.6]} />
        <meshStandardMaterial color="#e48c55" />
      </mesh>
      <mesh position={[0, 2.28, 0]} castShadow>
        <sphereGeometry args={[0.65, 10, 8]} />
        <meshStandardMaterial color="#f4c69a" />
      </mesh>
      <mesh position={[0, 2.75, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.6, 0.28, 10]} />
        <meshStandardMaterial color="#473c52" />
      </mesh>
      {[-0.25, 0.25].map((x) => (
        <mesh key={x} position={[x, 2.35, 0.56]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color="#24262a" />
        </mesh>
      ))}
      <mesh position={[0, 3.52, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.35, 0.8, 6]} />
        <meshStandardMaterial color="#ffe16d" emissive="#c37b10" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[-0.25, 0.38, 0]} castShadow>
        <boxGeometry args={[0.34, 0.77, 0.5]} />
        <meshStandardMaterial color="#344c75" />
      </mesh>
      <mesh position={[0.25, 0.38, 0]} castShadow>
        <boxGeometry args={[0.34, 0.77, 0.5]} />
        <meshStandardMaterial color="#344c75" />
      </mesh>
    </group>
  );
}

function RoadMarkings() {
  return (
    <>
      {Array.from({ length: 17 }, (_, i) => {
        const p = -40 + i * 5;
        return (
          <group key={i}>
            <mesh position={[p, 0.029, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[2.6, 0.16]} />
              <meshBasicMaterial color="#fff5c9" />
            </mesh>
            <mesh position={[0, 0.031, p]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.16, 2.6]} />
              <meshBasicMaterial color="#fff5c9" />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

export function City({ caught }: { caught: number[] }) {
  const grass: ThreeElements['meshStandardMaterial'] = { color: '#9ec999' };
  return (
    <>
      <color attach="background" args={['#b7ddf5']} />
      <fog attach="fog" args={['#b7ddf5', 45, 105]} />
      <ambientLight intensity={1.4} />
      <directionalLight position={[24, 35, 15]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-45} shadow-camera-right={45} shadow-camera-top={45} shadow-camera-bottom={-45} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.085, 0]} receiveShadow>
        <planeGeometry args={[95, 95]} />
        <meshStandardMaterial {...grass} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.057, 0]} receiveShadow>
        <planeGeometry args={[95, 8.5]} />
        <meshStandardMaterial color="#7f8994" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.049, 0]} receiveShadow>
        <planeGeometry args={[8.5, 95]} />
        <meshStandardMaterial color="#7f8994" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]} receiveShadow>
        <circleGeometry args={[8.3, 48]} />
        <meshStandardMaterial color="#e8d3a3" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.017, 0]}>
        <ringGeometry args={[7.6, 8.15, 48]} />
        <meshStandardMaterial color="#d8b989" side={2} />
      </mesh>
      <RoadMarkings />
      {BUILDINGS.map((building, index) => <Building key={index} data={building} />)}
      {[
        [-24, 0, -31], [-10, 0, -31], [9, 0, -31], [24, 0, -31],
        [-24, 0, 31], [-9, 0, 31], [10, 0, 31], [24, 0, 31],
        [-9, 0, 11], [9, 0, 14], [-9, 0, -11], [10, 0, -13],
      ].map((position, index) => <Tree key={index} position={position as [number, number, number]} />)}
      <Gary />
      {PIGEONS.map((pigeon, index) => !caught.includes(index) && <Pigeon key={index} {...pigeon} />)}
    </>
  );
}
