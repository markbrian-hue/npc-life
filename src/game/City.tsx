
import {
  BENCHES,
  BUILDINGS,
  GARY,
  LAMP_POSTS,
  PARKED_CARS,
  PIGEONS,
  type BuildingDef,
} from './world';

const TREES: [number, number, number][] = [
  [-24, 0, -31], [-10, 0, -31],
  [9, 0, -31], [24, 0, -31],
  [-24, 0, 31], [-9, 0, 31],
  [10, 0, 31], [24, 0, 31],
  [-9, 0, 11], [9, 0, 14],
  [-9, 0, -11], [10, 0, -13],
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
        0,
        Math.floor((h - 2.5) / 2.8)
      ),
    },
    (_, i) => 3.8 + i * 2.8
  ).filter((y) => y + 1 < h);

  return (
    <group position={[x, 0, z]}>
      <mesh
        castShadow
        receiveShadow
        position={[0, h / 2, 0]}
      >
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={color}
          roughness={0.92}
        />
      </mesh>

      {/* Foundation */}
      <mesh position={[0, 0.22, d / 2 + 0.035]}>
        <boxGeometry args={[w, 0.44, 0.12]} />
        <meshStandardMaterial
          color="#777f88"
          roughness={1}
        />
      </mesh>

      {/* Roof */}
      <mesh
        castShadow
        position={[0, h + 0.28, 0]}
      >
        <boxGeometry
          args={[w + 0.35, 0.55, d + 0.35]}
        />
        <meshStandardMaterial
          color={roof}
          roughness={0.85}
        />
      </mesh>

      {/* Rooftop equipment */}
      <mesh
        castShadow
        position={[w / 3, h + 0.78, -d / 4]}
      >
        <boxGeometry args={[1.3, 0.55, 1.1]} />
        <meshStandardMaterial
          color="#9aa7ab"
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Door frame */}
      <mesh
        position={[0, 1.36, d / 2 + 0.09]}
      >
        <boxGeometry args={[1.8, 2.72, 0.12]} />
        <meshStandardMaterial
          color="#494e56"
          roughness={0.85}
        />
      </mesh>

      {/* Door glass */}
      <mesh
        position={[0, 1.55, d / 2 + 0.17]}
      >
        <boxGeometry
          args={[1.35, 1.62, 0.035]}
        />
        <meshStandardMaterial
          color="#73959b"
          metalness={0.12}
          roughness={0.28}
        />
      </mesh>

      {/* Door handle */}
      <mesh
        position={[0.56, 1.02, d / 2 + 0.21]}
      >
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshStandardMaterial
          color="#f4c776"
          metalness={0.75}
          roughness={0.25}
        />
      </mesh>

      {/* Entrance canopy */}
      <mesh
        castShadow
        position={[0, 2.92, d / 2 + 0.65]}
      >
        <boxGeometry args={[2.8, 0.18, 1.2]} />
        <meshStandardMaterial
          color={roof}
          roughness={0.75}
        />
      </mesh>

      {/* Window bays */}
      {floors.flatMap((height, floor) =>
        [-w / 3, w / 3].map((offset, side) => (
          <group
            key={`${floor}-${side}`}
            position={[
              offset,
              height,
              d / 2 + 0.07,
            ]}
          >
            <mesh>
              <boxGeometry
                args={[1.9, 1.82, 0.12]}
              />
              <meshStandardMaterial
                color="#e6e6df"
                roughness={0.98}
              />
            </mesh>

            <mesh position={[0, 0, 0.075]}>
              <boxGeometry
                args={[1.57, 1.5, 0.04]}
              />
              <meshStandardMaterial
                color={
                  index % 2
                    ? '#79a0ac'
                    : '#a6c4cf'
                }
                metalness={0.18}
                roughness={0.28}
              />
            </mesh>

            <mesh position={[0, 0, 0.11]}>
              <boxGeometry
                args={[0.08, 1.5, 0.05]}
              />
              <meshStandardMaterial
                color="#d6dee0"
              />
            </mesh>

            <mesh position={[0, -0.79, 0.14]}>
              <boxGeometry
                args={[2, 0.14, 0.32]}
              />
              <meshStandardMaterial
                color="#d4d4c9"
              />
            </mesh>
          </group>
        ))
      )}

      {h > 9 && (
        <mesh
          position={[w / 2 + 0.045, 5.3, 0]}
        >
          <boxGeometry
            args={[0.09, 1.65, 1.9]}
          />
          <meshStandardMaterial
            color="#8eabb2"
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
  return (
    <group position={position}>
      <mesh
        castShadow
        position={[0, 1.35, 0]}
      >
        <cylinderGeometry
          args={[0.22, 0.39, 2.7, 7]}
        />
        <meshStandardMaterial
          color="#72543c"
          roughness={1}
        />
      </mesh>

      <mesh
        castShadow
        position={[0, 3.1, 0]}
      >
        <dodecahedronGeometry
          args={[1.72, 0]}
        />
        <meshStandardMaterial
          color={
            index % 3 === 0
              ? '#478566'
              : index % 3 === 1
                ? '#55996e'
                : '#70a778'
          }
          flatShading
          roughness={1}
        />
      </mesh>

      <mesh
        castShadow
        position={[0.75, 2.62, 0.35]}
      >
        <dodecahedronGeometry
          args={[0.93, 0]}
        />
        <meshStandardMaterial
          color="#6aab78"
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
        <sphereGeometry
          args={[0.4, 9, 7]}
        />
        <meshStandardMaterial
          color="#9eb4c2"
          flatShading
        />
      </mesh>

      <mesh
        castShadow
        position={[0, 0.25, 0.2]}
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
        <coneGeometry
          args={[0.12, 0.26, 4]}
        />
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
    <group
      position={[GARY.x, 0, GARY.z]}
    >
      <mesh
        castShadow
        position={[0, 1.2, 0]}
      >
        <boxGeometry
          args={[1, 1.45, 0.6]}
        />
        <meshStandardMaterial
          color="#e48c55"
          roughness={0.95}
        />
      </mesh>

      <mesh
        castShadow
        position={[0, 2.28, 0]}
      >
        <sphereGeometry
          args={[0.65, 10, 8]}
        />
        <meshStandardMaterial
          color="#f4c69a"
        />
      </mesh>

      <mesh
        castShadow
        position={[0, 2.75, 0]}
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
        <coneGeometry
          args={[0.35, 0.8, 6]}
        />
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
          position={[
            offset,
            0.38,
            0,
          ]}
        >
          <boxGeometry
            args={[0.34, 0.77, 0.5]}
          />
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
      {/* Grass */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.085, 0]}
      >
        <planeGeometry
          args={[95, 95]}
        />
        <meshStandardMaterial
          color="#87b27d"
          roughness={1}
        />
      </mesh>

      {/* Horizontal road */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.057, 0]}
      >
        <planeGeometry
          args={[95, 8.5]}
        />
        <meshStandardMaterial
          color="#69747d"
          roughness={1}
        />
      </mesh>

      {/* Vertical road */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.049, 0]}
      >
        <planeGeometry
          args={[8.5, 95]}
        />
        <meshStandardMaterial
          color="#69747d"
          roughness={1}
        />
      </mesh>

      {/* Sidewalks */}
      {[-1, 1].flatMap((side) =>
        [-1, 1].map((half) => (
          <group
            key={`sidewalk-${side}-${half}`}
          >
            <mesh
              receiveShadow
              position={[
                side * 5.85,
                -0.065,
                half * 25,
              ]}
            >
              <boxGeometry
                args={[2.65, 0.12, 31]}
              />
              <meshStandardMaterial
                color="#c4c1b5"
                roughness={1}
              />
            </mesh>

            <mesh
              receiveShadow
              position={[
                half * 25,
                -0.065,
                side * 5.85,
              ]}
            >
              <boxGeometry
                args={[31, 0.12, 2.65]}
              />
              <meshStandardMaterial
                color="#c4c1b5"
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
        <circleGeometry
          args={[8.3, 48]}
        />
        <meshStandardMaterial
          color="#e0cda8"
          roughness={1}
        />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.017, 0]}
      >
        <ringGeometry
          args={[7.65, 8.15, 48]}
        />
        <meshStandardMaterial
          color="#c4a67e"
          side={2}
          roughness={1}
        />
      </mesh>
    </>
  );
}

function StreetMarkings() {
  return (
    <>
      {/* Lane markings */}
      {Array.from(
        { length: 17 },
        (_, index) => {
          const p = -40 + index * 5;

          return (
            <group key={p}>
              <mesh
                position={[p, -0.032, 0]}
                rotation={[
                  -Math.PI / 2,
                  0,
                  0,
                ]}
              >
                <planeGeometry
                  args={[2.3, 0.13]}
                />
                <meshBasicMaterial
                  color="#e8dfb8"
                />
              </mesh>

              <mesh
                position={[0, -0.026, p]}
                rotation={[
                  -Math.PI / 2,
                  0,
                  0,
                ]}
              >
                <planeGeometry
                  args={[0.13, 2.3]}
                />
                <meshBasicMaterial
                  color="#e8dfb8"
                />
              </mesh>
            </group>
          );
        }
      )}

      {/* Horizontal-road crossings */}
      {[-11, 11].map((x) =>
        Array.from(
          { length: 7 },
          (_, index) => (
            <mesh
              key={`h-${x}-${index}`}
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
                color="#edeae0"
              />
            </mesh>
          )
        )
      )}

      {/* Vertical-road crossings */}
      {[-11, 11].map((z) =>
        Array.from(
          { length: 7 },
          (_, index) => (
            <mesh
              key={`v-${z}-${index}`}
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
                color="#edeae0"
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
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry
          args={[0.27, 0.34, 0.34, 8]}
        />
        <meshStandardMaterial
          color="#454d52"
          metalness={0.4}
        />
      </mesh>

      <mesh
        castShadow
        position={[0, 2.65, 0]}
      >
        <cylinderGeometry
          args={[0.105, 0.17, 5.05, 8]}
        />
        <meshStandardMaterial
          color="#4b555c"
          metalness={0.55}
          roughness={0.5}
        />
      </mesh>

      <mesh position={[0.45, 5.08, 0]}>
        <boxGeometry
          args={[0.95, 0.13, 0.14]}
        />
        <meshStandardMaterial
          color="#4b555c"
        />
      </mesh>

      <mesh position={[0.87, 4.93, 0]}>
        <boxGeometry
          args={[0.42, 0.1, 0.38]}
        />
        <meshStandardMaterial
          color="#fff2c9"
          emissive="#c9ad67"
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
        castShadow
        position={[0, 0.52, 0]}
      >
        <boxGeometry
          args={[2.4, 0.16, 0.68]}
        />
        <meshStandardMaterial
          color="#966849"
          roughness={0.92}
        />
      </mesh>

      <mesh
        castShadow
        position={[0, 1.01, -0.31]}
      >
        <boxGeometry
          args={[2.4, 0.83, 0.14]}
        />
        <meshStandardMaterial
          color="#966849"
          roughness={0.92}
        />
      </mesh>

      {[-0.95, 0.95].map((offset) => (
        <mesh
          key={offset}
          position={[offset, 0.25, 0]}
        >
          <boxGeometry
            args={[0.15, 0.5, 0.56]}
          />
          <meshStandardMaterial
            color="#42494a"
            metalness={0.35}
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
}: {
  x: number;
  z: number;
  color: string;
}) {
  return (
    <group position={[x, 0, z]}>
      {/* Body */}
      <mesh
        castShadow
        position={[0, 0.64, 0]}
      >
        <boxGeometry
          args={[4.25, 0.87, 1.95]}
        />
        <meshStandardMaterial
          color={color}
          metalness={0.2}
          roughness={0.58}
        />
      </mesh>

      {/* Cabin */}
      <mesh
        castShadow
        position={[-0.15, 1.23, 0]}
      >
        <boxGeometry
          args={[2.3, 0.65, 1.68]}
        />
        <meshStandardMaterial
          color="#537481"
          metalness={0.22}
          roughness={0.24}
        />
      </mesh>

      <mesh
        position={[-0.15, 1.59, 0]}
      >
        <boxGeometry
          args={[2.4, 0.12, 1.73]}
        />
        <meshStandardMaterial
          color={color}
          roughness={0.55}
        />
      </mesh>

      {/* Wheels */}
      {[-1.38, 1.38].flatMap(
        (offsetX) =>
          [-0.99, 0.99].map(
            (offsetZ) => (
              <group
                key={`${offsetX}-${offsetZ}`}
                position={[
                  offsetX,
                  0.39,
                  offsetZ,
                ]}
              >
                <mesh
                  rotation={[
                    Math.PI / 2,
                    0,
                    0,
                  ]}
                >
                  <cylinderGeometry
                    args={[
                      0.4,
                      0.4,
                      0.22,
                      12,
                    ]}
                  />
                  <meshStandardMaterial
                    color="#282b30"
                    roughness={1}
                  />
                </mesh>

                <mesh
                  position={[
                    0,
                    0,
                    Math.sign(offsetZ) *
                      0.12,
                  ]}
                  rotation={[
                    Math.PI / 2,
                    0,
                    0,
                  ]}
                >
                  <cylinderGeometry
                    args={[
                      0.19,
                      0.19,
                      0.02,
                      10,
                    ]}
                  />
                  <meshStandardMaterial
                    color="#bbc1c5"
                    metalness={0.7}
                    roughness={0.25}
                  />
                </mesh>
              </group>
            )
          )
      )}

      {/* Headlights and taillights */}
      {[-0.62, 0.62].map(
        (offset) => (
          <group key={offset}>
            <mesh
              position={[
                2.14,
                0.67,
                offset,
              ]}
            >
              <boxGeometry
                args={[0.05, 0.2, 0.39]}
              />
              <meshStandardMaterial
                color="#fff3d3"
                emissive="#d8bd76"
                emissiveIntensity={0.3}
              />
            </mesh>

            <mesh
              position={[
                -2.14,
                0.67,
                offset,
              ]}
            >
              <boxGeometry
                args={[0.05, 0.2, 0.39]}
              />
              <meshStandardMaterial
                color="#af3b45"
              />
            </mesh>
          </group>
        )
      )}
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
        castShadow
        position={[0, 0.3, 0]}
      >
        <cylinderGeometry
          args={[0.7, 0.58, 0.65, 9]}
        />
        <meshStandardMaterial
          color="#b7a393"
          roughness={1}
        />
      </mesh>

      <mesh
        castShadow
        position={[0, 0.65, 0]}
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
        castShadow
        position={[0.26, 0.92, -0.15]}
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

export function City({
  caught,
}: {
  caught: number[];
}) {
  return (
    <>
      {/* Atmospheric sky and fog */}
      <color
        attach="background"
        args={['#b6d7e8']}
      />

      <fog
        attach="fog"
        args={['#b6d7e8', 65, 135]}
      />

      {/* Soft natural daylight */}
      <hemisphereLight
        args={[
          '#e8f5ff',
          '#758b71',
          1.15,
        ]}
      />

      <ambientLight intensity={0.35} />

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

      {BUILDINGS.map(
        (building, index) => (
          <Building
            key={index}
            data={building}
            index={index}
          />
        )
      )}

      {TREES.map(
        (position, index) => (
          <Tree
            key={index}
            index={index}
            position={position}
          />
        )
      )}

      {LAMP_POSTS.map(
        ({ x, z }) => (
          <StreetLamp
            key={`${x}-${z}`}
            x={x}
            z={z}
          />
        )
      )}

      {BENCHES.map(
        ({ x, z, rotation }) => (
          <Bench
            key={`${x}-${z}`}
            x={x}
            z={z}
            rotation={rotation}
          />
        )
      )}

      {PARKED_CARS.map(
        ({ x, z, color }) => (
          <ParkedCar
            key={`${x}-${z}`}
            x={x}
            z={z}
            color={color}
          />
        )
      )}

      <Planter x={-37} z={29} />
      <Planter x={37} z={29} />
      <Planter x={-37} z={-29} />
      <Planter x={37} z={-29} />

      {/* Original job NPC and pigeons */}
      <Gary />

      {PIGEONS.map(
        (pigeon, index) =>
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
