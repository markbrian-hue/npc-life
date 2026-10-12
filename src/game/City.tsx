import { Character } from './Character';
import { GroveNeighborhood } from './GroveNeighborhood';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DirectionalLight, Object3D } from 'three';

import {
  BENCHES, BUILDINGS, GARY, LAMP_POSTS,
  PIGEONS, PLANTERS, TREES, WORLD_RADIUS, type BuildingDef,
} from './world';

import {
  Bench, StreetLamp, Planter, BusStop, Fountain,
  Bin, Hydrant,
} from './CityProps';



function Building({
  data,
  index,
}: {
  data: BuildingDef;
  index: number;
}) {
  const { x, z, w, d, h, color, roof } = data;

  const floorHeights = Array.from(
    { length: Math.ceil(h / 2.7) },
    (_, i) => (data.kind === 'bungalow' ? 1.9 : 3.45) + i * 2.48
  ).filter((y) => y + 0.8 < h);

  return (
    <group position={[x, 0, z]} rotation={[0, data.rotation || 0, 0]}>
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.91} />
      </mesh>

      {/* Concrete base */}
      <mesh receiveShadow position={[0, 0.22, 0]}>
        <boxGeometry args={[w + 0.2, 0.44, d + 0.2]} />
        <meshStandardMaterial color="#a8a49c" roughness={1} />
      </mesh>

      {data.kind === 'bungalow' && <>
        {[-1, 1].map(side => <mesh key={side} castShadow position={[0, h + .8, side * d / 4]} rotation={[side * -.32, 0, 0]}><boxGeometry args={[w + .9, .22, d / 2 + .8]} /><meshStandardMaterial color={roof} /></mesh>)}
        <mesh receiveShadow position={[0, .09, d / 2 + 2]}><boxGeometry args={[2.2, .18, 4]} /><meshStandardMaterial color="#c8bdaa" /></mesh>
      </>}
      {/* Roof and rooftop equipment */}
      <mesh castShadow position={[0, h + 0.26, 0]}>
        <boxGeometry args={[w + 0.38, 0.53, d + 0.38]} />
        <meshStandardMaterial color={roof} roughness={0.76} />
      </mesh>

      <mesh castShadow position={[w / 3, h + 0.7, -d / 4]}>
        <boxGeometry args={[1.22, 0.52, 1]} />
        <meshStandardMaterial color="#9eabae" roughness={0.7} />
      </mesh>

      {/* Entrance frame */}
      <mesh position={[0, 1.39, d / 2 + 0.07]}>
        <boxGeometry args={[1.94, 2.76, 0.12]} />
        <meshStandardMaterial color="#3d4549" roughness={0.8} />
      </mesh>

      {/* Glass entrance */}
      <mesh position={[0, 1.5, d / 2 + 0.15]}>
        <boxGeometry args={[1.52, 2.13, 0.045]} />
        <meshStandardMaterial
          color="#83a5b1"
          metalness={0.18}
          roughness={0.19}
        />
      </mesh>

      <mesh position={[0, 1.5, d / 2 + 0.18]}>
        <boxGeometry args={[0.07, 2.12, 0.04]} />
        <meshStandardMaterial color="#bbc4c8" />
      </mesh>

      <mesh position={[0.56, 1.04, d / 2 + 0.23]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshStandardMaterial color="#e1c484" metalness={0.5} />
      </mesh>

      {/* Entrance canopy */}
      <mesh castShadow position={[0, 3.02, d / 2 + 0.6]}>
        <boxGeometry args={[2.85, 0.17, 1.12]} />
        <meshStandardMaterial color={roof} />
      </mesh>

      {/* Framed windows */}
      {floorHeights.flatMap((y, floor) =>
        [-w / 3, w / 3].map((offset, side) => (
          <group
            key={`${floor}-${side}`}
            position={[offset, y, d / 2 + 0.065]}
          >
            <mesh>
              <boxGeometry args={[1.97, 1.76, 0.11]} />
              <meshStandardMaterial
                color="#e6e6e1"
                roughness={1}
              />
            </mesh>

            <mesh position={[0, 0, 0.075]}>
              <boxGeometry args={[1.65, 1.47, 0.035]} />
              <meshStandardMaterial
                color={index % 2 ? '#8caab4' : '#97bac5'}
                metalness={0.16}
                roughness={0.22}
              />
            </mesh>

            <mesh position={[0, 0, 0.11]}>
              <boxGeometry args={[0.07, 1.47, 0.045]} />
              <meshStandardMaterial color="#e2e4e1" />
            </mesh>

            <mesh position={[0, -0.81, 0.13]}>
              <boxGeometry args={[2.1, 0.12, 0.23]} />
              <meshStandardMaterial color="#d3d1c7" />
            </mesh>
          </group>
        ))
      )}

      {/* Corner details */}
      {[-w / 2 + 0.14, w / 2 - 0.14].map((dx) => (
        <mesh key={dx} position={[dx, h / 2, d / 2 + 0.04]}>
          <boxGeometry args={[0.19, h, 0.09]} />
          <meshStandardMaterial
            color={index % 2 ? '#bfc9c6' : '#dfd3c4'}
          />
        </mesh>
      ))}
    </group>
  );
}

function Tree({
  x, z, index,
}: {
  x: number;
  z: number;
  index: number;
}) {
  const dark = [
    '#4f805a', '#608d5c', '#477554', '#719a66',
  ][index % 4];

  const light = [
    '#719e70', '#88ae77', '#628f61', '#5b8b60',
  ][index % 4];

  const scale = 0.9 + (index % 3) * 0.08;

  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh castShadow position={[0, 1.52, 0]}>
        <cylinderGeometry args={[0.22, 0.35, 3.04, 8]} />
        <meshStandardMaterial color="#795a41" roughness={1} />
      </mesh>

      {[-1, 1].map(side => <mesh key={side} castShadow position={[side * .38, 2.55, 0]} rotation={[0, 0, side * -.65]}><cylinderGeometry args={[.09, .17, 1.5, 7]} /><meshStandardMaterial color="#76573f" /></mesh>)}
      <mesh castShadow position={[0, 3.33, 0]}>
        <icosahedronGeometry args={[1.56, 1]} />
        <meshStandardMaterial
          color={dark}
          flatShading
          roughness={1}
        />
      </mesh>

      <mesh castShadow position={[-0.72, 3.04, -0.2]}>
        <dodecahedronGeometry args={[0.92, 0]} />
        <meshStandardMaterial
          color={light}
          flatShading
          roughness={1}
        />
      </mesh>

      <mesh castShadow position={[0.8, 3.15, 0.29]}>
        <dodecahedronGeometry args={[1.01, 0]} />
        <meshStandardMaterial
          color={dark}
          flatShading
          roughness={1}
        />
      </mesh>

      <mesh castShadow position={[0.08, 4.15, -0.15]}>
        <dodecahedronGeometry args={[0.84, 0]} />
        <meshStandardMaterial
          color={light}
          flatShading
          roughness={1}
        />
      </mesh>
    </group>
  );
}

function Pigeon({
  x, z,
}: {
  x: number;
  z: number;
}) {
  return (
    <group position={[x, 0.43, z]}>
      <mesh castShadow>
        <sphereGeometry args={[0.37, 10, 8]} />
        <meshStandardMaterial color="#98abb6" flatShading />
      </mesh>

      <mesh castShadow position={[0, 0.25, 0.18]}>
        <sphereGeometry args={[0.23, 9, 7]} />
        <meshStandardMaterial color="#ccd8df" />
      </mesh>

      <mesh position={[0, 0.22, 0.46]} rotation={[0.35, 0, 0]}>
        <coneGeometry args={[0.11, 0.25, 4]} />
        <meshStandardMaterial color="#edaf55" />
      </mesh>

      {[-0.16, 0.16].map((offset) => (
        <mesh key={offset} position={[offset, 0.36, 0.35]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color="#1b2227" />
        </mesh>
      ))}
    </group>
  );
}

function GaryNPC() {
  return (
    <group position={[GARY.x, 0, GARY.z]}>
      <Character shirt="#df8c5a" hair="#62534d" style={2} />
      <mesh position={[0, 3.52, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.35, 0.8, 6]} />
        <meshStandardMaterial
          color="#ffe16d"
          emissive="#c37b10"
          emissiveIntensity={0.35}
        />
      </mesh>

    </group>
  );
}

function GroundAndRoads() {
  return (
    <>
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.085, 0]}
      >
        <planeGeometry args={[WORLD_RADIUS * 2 + 12, WORLD_RADIUS * 2 + 12]} />
        <meshStandardMaterial color="#8ab184" roughness={1} />
      </mesh>

      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.055, 0]}
      >
        <planeGeometry args={[WORLD_RADIUS * 2, 8.5]} />
        <meshStandardMaterial color="#66737a" roughness={1} />
      </mesh>

      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
      >
        <planeGeometry args={[8.5, WORLD_RADIUS * 2]} />
        <meshStandardMaterial color="#66737a" roughness={1} />
      </mesh>

      {/* Sidewalks */}
      {[-1, 1].flatMap((side) =>
        [-1, 1].map((half) => (
          <group key={`${side}-${half}`}>
            <mesh
              receiveShadow
              position={[side * 5.85, -0.064, half > 0 ? 44 : -75]}
            >
              <boxGeometry args={[2.65, 0.12, half > 0 ? 60 : 122]} />
              <meshStandardMaterial
                color="#c9c5b9"
                roughness={1}
              />
            </mesh>

            <mesh
              receiveShadow
              position={[half * 75, -0.064, side * 5.85]}
            >
              <boxGeometry args={[122, 0.12, 2.65]} />
              <meshStandardMaterial
                color="#c9c5b9"
                roughness={1}
              />
            </mesh>
          </group>
        ))
      )}

      {/* Plaza */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.025, 0]}
      >
        <circleGeometry args={[14, 64]} />
        <meshStandardMaterial color="#e2cfac" roughness={1} />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.017, 0]}
      >
        <ringGeometry args={[5.5, 12, 64]} />
        <meshStandardMaterial color="#586166" side={2} />
      </mesh>
    </>
  );
}

function LaneMarkings() {
  return (
    <>
      {Array.from({ length: 53 }, (_, i) => -130 + i * 5).filter(v => Math.abs(v) > 15).map((v) => (
        <group key={v}>
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[v, -0.03, 0]}
          >
            <planeGeometry args={[2.3, 0.13]} />
            <meshBasicMaterial color="#e8e4c6" />
          </mesh>

          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            visible={v < 74}
            position={[0, -0.027, v]}
          >
            <planeGeometry args={[0.13, 2.3]} />
            <meshBasicMaterial color="#e8e4c6" />
          </mesh>
        </group>
      ))}

      {/* Crossings */}
      {[-18, 18].flatMap((v) =>
        Array.from({ length: 7 }, (_, i) => (
          <group key={`${v}-${i}`}>
            <mesh position={[v + (i - 3) * 0.54, -0.021, 0]}>
              <boxGeometry args={[0.3, 0.012, 7.1]} />
              <meshBasicMaterial color="#efeee6" />
            </mesh>

            <mesh position={[0, -0.019, v + (i - 3) * 0.54]}>
              <boxGeometry args={[7.1, 0.012, 0.3]} />
              <meshBasicMaterial color="#efeee6" />
            </mesh>
          </group>
        ))
      )}
    </>
  );
}

function LocalSun() {
  const light = useRef<DirectionalLight>(null);
  const target = useMemo(() => new Object3D(), []);
  const player = useRef({ x: 0, z: 0 });
  useEffect(() => {
    const update = (event: Event) => { player.current = (event as CustomEvent<{ x: number; z: number }>).detail; };
    window.addEventListener('npc-life:position', update);
    return () => window.removeEventListener('npc-life:position', update);
  }, []);
  useFrame(() => {
    // Quantize the local shadow camera: sharper nearby shadows without rendering
    // every distant neighborhood into a giant shadow map each frame.
    const x = Math.round(player.current.x * 16) / 16;
    const z = Math.round(player.current.z * 16) / 16;
    target.position.set(x, 0, z);
    light.current?.position.set(x + 25, 40, z + 18);
  });
  return <>
    <primitive object={target} />
    <directionalLight ref={light} target={target} position={[25, 40, 18]} color="#ffe2b1" intensity={2.3}
      castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-32} shadow-camera-right={32}
      shadow-camera-top={32} shadow-camera-bottom={-32} shadow-bias={-.0002} />
  </>;
}

export const City = memo(function City({ caught }: { caught: number[] }) {
  return (
    <>
      <color attach="background" args={['#c6d6c8']} />
      <fog attach="fog" args={['#c6d6c8', 85, 185]} />

      <hemisphereLight args={['#ffefd0', '#677e70', 1.5]} />
      <ambientLight intensity={0.35} />

      <LocalSun />

      <GroundAndRoads />
      <LaneMarkings />

      {BUILDINGS.map((building, index) => (
        <Building
          key={index}
          data={building}
          index={index}
        />
      ))}

      {TREES.map((tree, index) => (
        <Tree
          key={`${tree.x}-${tree.z}`}
          {...tree}
          index={index}
        />
      ))}

      {BENCHES.map((bench) => (
        <Bench
          key={`${bench.x}-${bench.z}`}
          {...bench}
        />
      ))}

      {LAMP_POSTS.map((lamp) => (
        <StreetLamp
          key={`${lamp.x}-${lamp.z}`}
          {...lamp}
        />
      ))}

      {PLANTERS.map((planter) => (
        <Planter
          key={`${planter.x}-${planter.z}`}
          {...planter}
        />
      ))}

      <BusStop />
      <Fountain />

      <Bin x={-11} z={-8.5} />
      <Bin x={29} z={9} />

      <Hydrant x={-10} z={8.5} />
      <Hydrant x={11} z={-8.5} />

      <GroveNeighborhood />

      <GaryNPC />

      {PIGEONS.map((pigeon, index) =>
        caught.includes(index) ? null : (
          <Pigeon key={index} {...pigeon} />
        )
      )}
    </>
  );
});
