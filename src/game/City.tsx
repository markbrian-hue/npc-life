import {
  BENCHES,
  BUILDINGS,
  GARY,
  LAMP_POSTS,
  PARKED_CARS,
  PIGEONS,
  PLANTERS,
  type BuildingDef,
} from './world';

const TREES: [number, number, number][] = [
  [-24, 0, -31],
  [-10, 0, -31],
  [9, 0, -31],
  [24, 0, -31],
  [-24, 0, 31],
  [-9, 0, 31],
  [10, 0, 31],
  [24, 0, 31],
  [-9, 0, 11],
  [9, 0, 14],
  [-9, 0, -11],
  [10, 0, -13],
  [-30, 0, -2],
  [30, 0, 2],
];

function Building({
  data,
  index,
}: {
  data: BuildingDef;
  index: number;
}) {
  const { x, z, w, d, h, color, roof } = data;

  const floors = Array.from(
    {
      length: Math.max(
        1,
        Math.floor((h - 2.6) / 2.6)
      ),
    },
    (_, i) => 3.4 + i * 2.45
  ).filter((y) => y + 0.8 < h);

  return (
    <group position={[x, 0, z]}>
      <mesh
        position={[0, h / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={color}
          roughness={0.94}
        />
      </mesh>

      <mesh position={[0, 0.22, 0]} receiveShadow>
        <boxGeometry
          args={[w + 0.25, 0.44, d + 0.25]}
        />
        <meshStandardMaterial
          color="#91877d"
          roughness={1}
        />
      </mesh>

      <mesh
        position={[0, h + 0.28, 0]}
        castShadow
      >
        <boxGeometry
          args={[w + 0.45, 0.55, d + 0.45]}
        />
        <meshStandardMaterial
          color={roof}
          roughness={0.82}
        />
      </mesh>

      <mesh
        position={[0, 1.3, d / 2 + 0.08]}
      >
        <boxGeometry args={[1.95, 2.8, 0.12]} />
        <meshStandardMaterial
          color="#4d4b4c"
          roughness={0.8}
        />
      </mesh>

      <mesh
        position={[0, 1.38, d / 2 + 0.16]}
      >
        <boxGeometry
          args={[1.35, 1.7, 0.04]}
        />
        <meshStandardMaterial
          color="#88a6b1"
          metalness={0.15}
          roughness={0.25}
        />
      </mesh>

      <mesh
        position={[0, 2.84, d / 2 + 0.62]}
        castShadow
      >
        <boxGeometry args={[2.8, 0.18, 1.2]} />
        <meshStandardMaterial
          color={roof}
          roughness={0.72}
        />
      </mesh>

      {floors.flatMap((height, floorIndex) =>
        [-w / 3, w / 3].map((offset, sideIndex) => (
          <group
            key={`${floorIndex}-${sideIndex}`}
            position={[
              offset,
              height,
              d / 2 + 0.06,
            ]}
          >
            <mesh>
              <boxGeometry
                args={[1.9, 1.6, 0.12]}
              />
              <meshStandardMaterial
                color="#ebe6dc"
                roughness={1}
              />
            </mesh>

            <mesh position={[0, 0, 0.08]}>
              <boxGeometry
                args={[1.56, 1.28, 0.04]}
              />
              <meshStandardMaterial
                color={
                  index % 2 === 0
                    ? '#8cadb8'
                    : '#a0bcc5'
                }
                metalness={0.12}
                roughness={0.25}
              />
            </mesh>

            <mesh position={[0, 0, 0.11]}>
              <boxGeometry
                args={[0.08, 1.28, 0.05]}
              />
              <meshStandardMaterial
                color="#d8dee0"
              />
            </mesh>

            <mesh position={[0, -0.68, 0.14]}>
              <boxGeometry
                args={[2, 0.12, 0.28]}
              />
              <meshStandardMaterial
                color="#cfc7ba"
              />
            </mesh>
          </group>
        ))
      )}

      {h > 9 && (
        <mesh
          position={[w / 2 + 0.05, 5.2, 0]}
        >
          <boxGeometry
            args={[0.1, 1.8, 1.8]}
          />
          <meshStandardMaterial
            color="#91a9b0"
            roughness={0.3}
          />
        </mesh>
      )}
    </group>
  );
}

function Tree({
  position,
  index,
}: {
  position: [number, number, number];
  index: number;
}) {
  const colors = [
    '#5e8f62',
    '#6e9f6f',
    '#4f7f57',
  ];

  return (
    <group position={position}>
      <mesh
        position={[0, 1.4, 0]}
        castShadow
      >
        <cylinderGeometry
          args={[0.22, 0.37, 2.8, 8]}
        />
        <meshStandardMaterial
          color="#725640"
          roughness={1}
        />
      </mesh>

      <mesh
        position={[0, 3.15, 0]}
        castShadow
      >
        <dodecahedronGeometry
          args={[1.7, 0]}
        />
        <meshStandardMaterial
          color={colors[index % colors.length]}
          flatShading
          roughness={1}
        />
      </mesh>

      <mesh
        position={[0.82, 2.78, 0.22]}
        castShadow
      >
        <dodecahedronGeometry
          args={[0.95, 0]}
        />
        <meshStandardMaterial
          color={colors[(index + 1) % colors.length]}
          flatShading
          roughness={1}
        />
      </mesh>

      <mesh
        position={[-0.76, 2.88, -0.3]}
        castShadow
      >
        <dodecahedronGeometry
          args={[0.9, 0]}
        />
        <meshStandardMaterial
          color={colors[(index + 2) % colors.length]}
          flatShading
          roughness={1}
        />
      </mesh>
    </group>
  );
}

function Pigeon({
  x,
  z,
}: {
  x: number;
  z: number;
}) {
  return (
    <group position={[x, 0.42, z]}>
      <mesh castShadow>
        <sphereGeometry args={[0.4, 9, 7]} />
        <meshStandardMaterial
          color="#9eb4c2"
          flatShading
        />
      </mesh>

      <mesh
        position={[0, 0.25, 0.2]}
        castShadow
      >
        <sphereGeometry
          args={[0.23, 8, 6]}
        />
        <meshStandardMaterial
          color="#c4d3de"
        />
      </mesh>

      <mesh
        position={[0, 0.22, 0.46]}
        rotation={[0.35, 0, 0]}
      >
        <coneGeometry args={[0.12, 0.26, 4]} />
        <meshStandardMaterial
          color="#ffbb56"
        />
      </mesh>

      {[-0.19, 0.19].map((offset) => (
        <mesh
          key={offset}
          position={[
            offset,
            0.37,
            0.36,
          ]}
        >
          <sphereGeometry
            args={[0.04, 6, 6]}
          />
          <meshBasicMaterial
            color="#17212c"
          />
        </mesh>
      ))}
    </group>
  );
}

function Gary() {
  return (
    <group position={[GARY.x, 0, GARY.z]}>
      <mesh
        position={[0, 1.2, 0]}
        castShadow
      >
        <boxGeometry args={[1, 1.45, 0.6]} />
        <meshStandardMaterial
          color="#df8c5a"
          roughness={0.95}
        />
      </mesh>

      <mesh
        position={[0, 2.28, 0]}
        castShadow
      >
        <sphereGeometry
          args={[0.65, 10, 8]}
        />
        <meshStandardMaterial
          color="#f4c69a"
        />
      </mesh>

      <mesh
        position={[0, 2.75, 0]}
        castShadow
      >
        <cylinderGeometry
          args={[0.6, 0.6, 0.28, 10]}
        />
        <meshStandardMaterial
          color="#473c52"
        />
      </mesh>

      {[-0.25, 0.25].map((offset) => (
        <mesh
          key={offset}
          position={[
            offset,
            2.35,
            0.56,
          ]}
        >
          <sphereGeometry
            args={[0.07, 8, 8]}
          />
          <meshBasicMaterial
            color="#24262a"
          />
        </mesh>
      ))}

      <mesh
        position={[0, 3.52, 0]}
        rotation={[0, 0, Math.PI]}
      >
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
          position={[
            offset,
            0.38,
            0,
          ]}
          castShadow
        >
          <boxGeometry args={[0.34, 0.77, 0.5]} />
          <meshStandardMaterial
            color="#344c75"
          />
        </mesh>
      ))}
    </group>
  );
}

function StreetSurfaces() {
  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.085, 0]}
        receiveShadow
      >
        <planeGeometry args={[95, 95]} />
        <meshStandardMaterial
          color="#84ab7f"
          roughness={1}
        />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.057, 0]}
        receiveShadow
      >
        <planeGeometry args={[95, 8.5]} />
        <meshStandardMaterial
          color="#6c737a"
          roughness={1}
        />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.049, 0]}
        receiveShadow
      >
        <planeGeometry args={[8.5, 95]} />
        <meshStandardMaterial
          color="#6c737a"
          roughness={1}
        />
      </mesh>

      {[-1, 1].flatMap((side) =>
        [-1, 1].map((half) => (
          <group
            key={`walk-${side}-${half}`}
          >
            <mesh
              position={[
                side * 5.85,
                -0.065,
                half * 25,
              ]}
              receiveShadow
            >
              <boxGeometry
                args={[2.65, 0.12, 31]}
              />
              <meshStandardMaterial
                color="#c7c2b7"
                roughness={1}
              />
            </mesh>

            <mesh
              position={[
                half * 25,
                -0.065,
                side * 5.85,
              ]}
              receiveShadow
            >
              <boxGeometry
                args={[31, 0.12, 2.65]}
              />
              <meshStandardMaterial
                color="#c7c2b7"
                roughness={1}
              />
            </mesh>
          </group>
        ))
      )}

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.025, 0]}
        receiveShadow
      >
        <circleGeometry args={[8.3, 48]} />
        <meshStandardMaterial
          color="#e3d0ac"
          roughness={1}
        />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.017, 0]}
      >
        <ringGeometry args={[7.65, 8.15, 48]} />
        <meshStandardMaterial
          color="#c9ab82"
          side={2}
          roughness={1}
        />
      </mesh>

      <mesh
        position={[0, 0.02, 0]}
        receiveShadow
      >
        <cylinderGeometry
          args={[1.9, 2.2, 0.24, 24]}
        />
        <meshStandardMaterial
          color="#b9b7b0"
          roughness={1}
        />
      </mesh>
    </>
  );
}

function StreetMarkings() {
  return (
    <>
      {Array.from({ length: 17 }, (_, index) => {
        const p = -40 + index * 5;

        return (
          <group key={p}>
            <mesh
              position={[p, -0.032, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry
                args={[2.3, 0.13]}
              />
              <meshBasicMaterial
                color="#ede2b7"
              />
            </mesh>

            <mesh
              position={[0, -0.026, p]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry
                args={[0.13, 2.3]}
              />
              <meshBasicMaterial
                color="#ede2b7"
              />
            </mesh>
          </group>
        );
      })}

      {[-11, 11].map((x) =>
        Array.from(
          { length: 7 },
          (_, index) => (
            <mesh
              key={`cross-h-${x}-${index}`}
              position={[
                x + (index - 3) * 0.52,
                -0.022,
                0,
              ]}
            >
              <boxGeometry
                args={[0.32, 0.012, 7.15]}
              />
              <meshBasicMaterial
                color="#efece2"
              />
            </mesh>
          )
        )
      )}

      {[-11, 11].map((z) =>
        Array.from(
          { length: 7 },
          (_, index) => (
            <mesh
              key={`cross-v-${z}-${index}`}
              position={[
                0,
                -0.022,
                z + (index - 3) * 0.52,
              ]}
            >
              <boxGeometry
                args={[7.15, 0.012, 0.32]}
              />
              <meshBasicMaterial
                color="#efece2"
              />
            </mesh>
          )
        )
      )}
    </>
  );
}

function StreetLamp({
  x,
  z,
}: {
  x: number;
  z: number;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry
          args={[0.28, 0.34, 0.32, 8]}
        />
        <meshStandardMaterial
          color="#464f55"
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      <mesh
        position={[0, 2.7, 0]}
        castShadow
      >
        <cylinderGeometry
          args={[0.11, 0.16, 5.15, 8]}
        />
        <meshStandardMaterial
          color="#4b565d"
          metalness={0.55}
          roughness={0.45}
        />
      </mesh>

      <mesh position={[0.5, 5.1, 0]}>
        <boxGeometry
          args={[1, 0.13, 0.14]}
        />
        <meshStandardMaterial
          color="#4b565d"
        />
      </mesh>

      <mesh position={[0.9, 4.94, 0]}>
        <boxGeometry
          args={[0.42, 0.11, 0.4]}
        />
        <meshStandardMaterial
          color="#fff1c9"
          emissive="#ccb16e"
          emissiveIntensity={0.45}
        />
      </mesh>
    </group>
  );
}

function Bench({
  x,
  z,
  rotation,
}: {
  x: number;
  z: number;
  rotation: number;
}) {
  return (
    <group
      position={[x, 0, z]}
      rotation={[0, rotation, 0]}
    >
      <mesh
        position={[0, 0.55, 0]}
        castShadow
      >
        <boxGeometry
          args={[2.35, 0.14, 0.68]}
        />
        <meshStandardMaterial
          color="#926848"
          roughness={0.92}
        />
      </mesh>

      <mesh
        position={[0, 1.02, -0.3]}
        castShadow
      >
        <boxGeometry
          args={[2.35, 0.82, 0.12]}
        />
        <meshStandardMaterial
          color="#926848"
          roughness={0.92}
        />
      </mesh>

      {[-0.96, 0.96].map((offset) => (
        <mesh
          key={offset}
          position={[offset, 0.24, 0]}
        >
          <boxGeometry
            args={[0.14, 0.48, 0.58]}
          />
          <meshStandardMaterial
            color="#434a4d"
            metalness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

function ParkedCar({
  x,
  z,
  color,
  rotation,
}: {
  x: number;
  z: number;
  color: string;
  rotation: number;
}) {
  return (
    <group
      position={[x, 0, z]}
      rotation={[0, rotation, 0]}
    >
      <mesh
        position={[0, 0.63, 0]}
        castShadow
      >
        <boxGeometry
          args={[4.2, 0.9, 1.95]}
        />
        <meshStandardMaterial
          color={color}
          metalness={0.15}
          roughness={0.58}
        />
      </mesh>

      <mesh
        position={[-0.12, 1.2, 0]}
        castShadow
      >
        <boxGeometry
          args={[2.25, 0.68, 1.65]}
        />
        <meshStandardMaterial
          color="#76939c"
          metalness={0.2}
          roughness={0.23}
        />
      </mesh>

      <mesh
        position={[-0.12, 1.55, 0]}
      >
        <boxGeometry
          args={[2.35, 0.11, 1.72]}
        />
        <meshStandardMaterial
          color={color}
          roughness={0.52}
        />
      </mesh>

      {[-1.35, 1.35].flatMap((offsetX) =>
        [-0.98, 0.98].map((offsetZ) => (
          <group
            key={`${offsetX}-${offsetZ}`}
            position={[
              offsetX,
              0.38,
              offsetZ,
            ]}
          >
            <mesh
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry
                args={[0.39, 0.39, 0.22, 12]}
              />
              <meshStandardMaterial
                color="#2a2d31"
                roughness={1}
              />
            </mesh>

            <mesh
              position={[
                0,
                0,
                Math.sign(offsetZ) * 0.12,
              ]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry
                args={[0.18, 0.18, 0.02, 10]}
              />
              <meshStandardMaterial
                color="#c3c7cb"
                metalness={0.7}
                roughness={0.28}
              />
            </mesh>
          </group>
        ))
      )}

      {[-0.6, 0.6].map((offset) => (
        <group key={offset}>
          <mesh
            position={[2.12, 0.68, offset]}
          >
            <boxGeometry
              args={[0.06, 0.22, 0.35]}
            />
            <meshStandardMaterial
              color="#fff0c9"
              emissive="#d8bf75"
              emissiveIntensity={0.25}
            />
          </mesh>

          <mesh
            position={[-2.12, 0.68, offset]}
          >
            <boxGeometry
              args={[0.06, 0.22, 0.35]}
            />
            <meshStandardMaterial
              color="#ac4046"
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Planter({
  x,
  z,
}: {
  x: number;
  z: number;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh
        position={[0, 0.3, 0]}
        castShadow
      >
        <cylinderGeometry
          args={[0.72, 0.58, 0.65, 10]}
        />
        <meshStandardMaterial
          color="#b7a393"
          roughness={1}
        />
      </mesh>

      <mesh
        position={[0, 0.7, 0]}
        castShadow
      >
        <dodecahedronGeometry
          args={[0.82, 0]}
        />
        <meshStandardMaterial
          color="#477b54"
          flatShading
          roughness={1}
        />
      </mesh>

      <mesh
        position={[0.28, 0.96, -0.16]}
        castShadow
      >
        <dodecahedronGeometry
          args={[0.45, 0]}
        />
        <meshStandardMaterial
          color="#76aa6a"
          flatShading
          roughness={1}
        />
      </mesh>
    </group>
  );
}

function BusStop() {
  return (
    <group position={[19, 0, 6.2]}>
      <mesh
        position={[0, 1.8, 0]}
        castShadow
      >
        <boxGeometry args={[3.6, 0.16, 1.55]} />
        <meshStandardMaterial
          color="#6c7c85"
          metalness={0.35}
          roughness={0.5}
        />
      </mesh>

      {[-1.55, 1.55].map((offset) => (
        <mesh
          key={offset}
          position={[offset, 0.9, 0]}
        >
          <boxGeometry
            args={[0.11, 1.8, 0.11]}
          />
          <meshStandardMaterial
            color="#6c7c85"
            metalness={0.45}
            roughness={0.45}
          />
        </mesh>
      ))}

      <mesh position={[0, 0.95, -0.63]}>
        <boxGeometry
          args={[3.35, 1.55, 0.06]}
        />
        <meshStandardMaterial
          color="#96b3bc"
          metalness={0.15}
          roughness={0.28}
        />
      </mesh>

      <mesh position={[0, 0.56, 0.38]}>
        <boxGeometry
          args={[2.4, 0.12, 0.35]}
        />
        <meshStandardMaterial
          color="#8a6a55"
          roughness={0.9}
        />
      </mesh>

      <mesh position={[0, 2.45, 0.78]}>
        <boxGeometry args={[1.5, 0.44, 0.08]} />
        <meshStandardMaterial
          color="#fff1c8"
        />
      </mesh>
    </group>
  );
}

function ShrubStrip({
  positions,
}: {
  positions: [number, number, number][];
}) {
  return (
    <>
      {positions.map((position, index) => (
        <mesh
          key={index}
          position={position}
          castShadow
        >
          <dodecahedronGeometry
            args={[0.6, 0]}
          />
          <meshStandardMaterial
            color={
              index % 2 === 0
                ? '#4e8658'
                : '#6b9d63'
            }
            flatShading
            roughness={1}
          />
        </mesh>
      ))}
    </>
  );
}

export function City({
  caught,
}: {
  caught: number[];
}) {
  return (
    <>
      <color
        attach="background"
        args={['#bad8e4']}
      />

      <fog
        attach="fog"
        args={['#bad8e4', 68, 138]}
      />

      <hemisphereLight
        args={['#ecf7ff', '#73886f', 1.15]}
      />

      <ambientLight intensity={0.36} />

      <directionalLight
        position={[25, 42, 20]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-bias={-0.00015}
      />

      <StreetSurfaces />
      <StreetMarkings />

      {BUILDINGS.map((building, index) => (
        <Building
          key={index}
          data={building}
          index={index}
        />
      ))}

      {TREES.map((position, index) => (
        <Tree
          key={index}
          index={index}
          position={position}
        />
      ))}

      {LAMP_POSTS.map(({ x, z }) => (
        <StreetLamp
          key={`${x}-${z}`}
          x={x}
          z={z}
        />
      ))}

      {BENCHES.map(({ x, z, rotation }) => (
        <Bench
          key={`${x}-${z}`}
          x={x}
          z={z}
          rotation={rotation}
        />
      ))}

      {PARKED_CARS.map(
        ({ x, z, color, rotation }) => (
          <ParkedCar
            key={`${x}-${z}`}
            x={x}
            z={z}
            color={color}
            rotation={rotation}
          />
        )
      )}

      {PLANTERS.map(({ x, z }) => (
        <Planter
          key={`${x}-${z}`}
          x={x}
          z={z}
        />
      ))}

      <BusStop />

      <ShrubStrip
        positions={[
          [-14, 0.55, 4.5],
          [-12.8, 0.55, 4.8],
          [-11.7, 0.55, 5.1],
          [14, 0.55, -4.5],
          [12.8, 0.55, -4.8],
          [11.7, 0.55, -5.1],
        ]}
      />

      <Gary />

      {PIGEONS.map((pigeon, index) =>
        !caught.includes(index) ? (
          <Pigeon
            key={index}
            {...pigeon}
          />
        ) : null
      )}
    </>
  );
}