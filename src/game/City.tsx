
import {
  BENCHES, BUILDINGS, GARY, LAMP_POSTS, PARKED_CARS,
  PIGEONS, PLANTERS, TREES, type BuildingDef,
} from './world';

import {
  CarModel, Bench, StreetLamp, Planter, BusStop, Fountain,
  Bin, Hydrant,
} from './CityProps';

import { CityTraffic } from './CityTraffic';

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
    (_, i) => 3.45 + i * 2.48
  ).filter((y) => y + 0.8 < h);

  return (
    <group position={[x, 0, z]}>
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.91} />
      </mesh>

      {/* Concrete base */}
      <mesh receiveShadow position={[0, 0.22, 0]}>
        <boxGeometry args={[w + 0.2, 0.44, d + 0.2]} />
        <meshStandardMaterial color="#a8a49c" roughness={1} />
      </mesh>

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

      <mesh castShadow position={[0, 3.33, 0]}>
        <dodecahedronGeometry args={[1.56, 0]} />
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
      <mesh castShadow position={[0, 1.2, 0]}>
        <boxGeometry args={[1, 1.45, 0.6]} />
        <meshStandardMaterial color="#df8c5a" />
      </mesh>

      <mesh castShadow position={[0, 2.28, 0]}>
        <sphereGeometry args={[0.65, 10, 8]} />
        <meshStandardMaterial color="#f4c69a" />
      </mesh>

      <mesh castShadow position={[0, 2.75, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.28, 10]} />
        <meshStandardMaterial color="#473c52" />
      </mesh>

      {[-0.25, 0.25].map((offset) => (
        <mesh key={offset} position={[offset, 2.35, 0.56]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color="#24262a" />
        </mesh>
      ))}

      <mesh position={[0, 3.52, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.35, 0.8, 6]} />
        <meshStandardMaterial
          color="#ffe16d"
          emissive="#c37b10"
          emissiveIntensity={0.35}
        />
      </mesh>

      {[-0.25, 0.25].map((offset) => (
        <mesh
          key={offset}
          castShadow
          position={[offset, 0.38, 0]}
        >
          <boxGeometry args={[0.34, 0.77, 0.5]} />
          <meshStandardMaterial color="#344c75" />
        </mesh>
      ))}
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
        <planeGeometry args={[95, 95]} />
        <meshStandardMaterial color="#8ab184" roughness={1} />
      </mesh>

      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.055, 0]}
      >
        <planeGeometry args={[95, 8.5]} />
        <meshStandardMaterial color="#66737a" roughness={1} />
      </mesh>

      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
      >
        <planeGeometry args={[8.5, 95]} />
        <meshStandardMaterial color="#66737a" roughness={1} />
      </mesh>

      {/* Sidewalks */}
      {[-1, 1].flatMap((side) =>
        [-1, 1].map((half) => (
          <group key={`${side}-${half}`}>
            <mesh
              receiveShadow
              position={[side * 5.85, -0.064, half * 25]}
            >
              <boxGeometry args={[2.65, 0.12, 31]} />
              <meshStandardMaterial
                color="#c9c5b9"
                roughness={1}
              />
            </mesh>

            <mesh
              receiveShadow
              position={[half * 25, -0.064, side * 5.85]}
            >
              <boxGeometry args={[31, 0.12, 2.65]} />
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
        <circleGeometry args={[8.3, 48]} />
        <meshStandardMaterial color="#e2cfac" roughness={1} />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.017, 0]}
      >
        <ringGeometry args={[7.65, 8.15, 48]} />
        <meshStandardMaterial color="#c7a981" side={2} />
      </mesh>
    </>
  );
}

function LaneMarkings() {
  return (
    <>
      {Array.from({ length: 17 }, (_, i) => -40 + i * 5).map((v) => (
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
            position={[0, -0.027, v]}
          >
            <planeGeometry args={[0.13, 2.3]} />
            <meshBasicMaterial color="#e8e4c6" />
          </mesh>
        </group>
      ))}

      {/* Crossings */}
      {[-11, 11].flatMap((v) =>
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

export function City({ caught }: { caught: number[] }) {
  return (
    <>
      <color attach="background" args={['#b7d8e7']} />
      <fog attach="fog" args={['#b7d8e7', 65, 135]} />

      <hemisphereLight args={['#eaf5ff', '#72876f', 1.15]} />
      <ambientLight intensity={0.35} />

      <directionalLight
        position={[25, 40, 18]}
        intensity={2.05}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-44}
        shadow-camera-right={44}
        shadow-camera-top={44}
        shadow-camera-bottom={-44}
        shadow-bias={-0.0002}
      />

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

      {PARKED_CARS.map((car) => (
        <group
          key={`${car.x}-${car.z}`}
          position={[car.x, 0, car.z]}
          rotation={[0, car.rotation, 0]}
        >
          <CarModel color={car.color} />
        </group>
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

      <CityTraffic />

      <GaryNPC />

      {PIGEONS.map((pigeon, index) =>
        caught.includes(index) ? null : (
          <Pigeon key={index} {...pigeon} />
        )
      )}
    </>
  );
}
