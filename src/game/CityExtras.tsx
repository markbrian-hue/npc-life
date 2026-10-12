
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { CityEvent } from './Player';

export const SHOP_POSITION = {
  x: -6,
  z: -3,
};

export const CITIZEN_POSITION = {
  x: 6,
  z: -4,
};

type RoutePoint = readonly [
  number,
  number
];

type WalkerDef = {
  id: string;
  shirt: string;
  pants: string;
  hair: string;
  speed: number;
  path: readonly RoutePoint[];
};

const WALKERS: readonly WalkerDef[] = [
  {
    id: 'commuter',
    shirt: '#658ba1',
    pants: '#374858',
    hair: '#55423a',
    speed: 1.28,
    path: [
      [-27, -9.5],
      [-13, -9.5],
    ],
  },
  {
    id: 'tourist',
    shirt: '#e3a662',
    pants: '#506072',
    hair: '#342e32',
    speed: 1.05,
    path: [
      [13, 9.5],
      [27, 9.5],
    ],
  },
  {
    id: 'neighbor',
    shirt: '#a781ae',
    pants: '#344b54',
    hair: '#76513e',
    speed: 1.15,
    path: [
      [-8, 13],
      [-8, 27],
    ],
  },
  {
    id: 'runner',
    shirt: '#72a77c',
    pants: '#353d55',
    hair: '#443931',
    speed: 1.7,
    path: [
      [8, -27],
      [8, -13],
    ],
  },
];

function Citizen({
  x,
  z,
  shirt,
}: {
  x: number;
  z: number;
  shirt: string;
}) {
  const body =
    useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    if (!body.current) return;

    body.current.rotation.z =
      THREE.MathUtils.damp(
        body.current.rotation.z,
        Math.sin(
          clock.elapsedTime * 1.1 + x
        ) * 0.025,
        2,
        delta
      );
  });

  return (
    <group position={[x, 0, z]}>
      <group ref={body}>
        <mesh
          castShadow
          position={[0, 1.08, 0]}
        >
          <boxGeometry
            args={[0.95, 1.32, 0.55]}
          />
          <meshStandardMaterial
            color={shirt}
            roughness={0.92}
          />
        </mesh>

        <mesh
          castShadow
          position={[0, 2.12, 0]}
        >
          <sphereGeometry
            args={[0.55, 12, 10]}
          />
          <meshStandardMaterial
            color="#f4c49d"
          />
        </mesh>

        <mesh position={[0, 2.55, 0]}>
          <sphereGeometry
            args={[
              0.55,
              12,
              8,
              0,
              Math.PI * 2,
              0,
              Math.PI / 2,
            ]}
          />
          <meshStandardMaterial
            color="#694b39"
          />
        </mesh>

        {[-0.2, 0.2].map(
          (offset) => (
            <mesh
              key={offset}
              position={[
                offset,
                2.19,
                0.52,
              ]}
            >
              <sphereGeometry
                args={[0.065, 8, 8]}
              />
              <meshBasicMaterial
                color="#1b2531"
              />
            </mesh>
          )
        )}

        {[-0.26, 0.26].map(
          (offset) => (
            <mesh
              key={offset}
              castShadow
              position={[
                offset,
                0.35,
                0,
              ]}
            >
              <boxGeometry
                args={[0.33, 0.7, 0.42]}
              />
              <meshStandardMaterial
                color="#38466e"
              />
            </mesh>
          )
        )}

        <mesh
          position={[0, 3.1, 0]}
          rotation={[
            0,
            0,
            Math.PI,
          ]}
        >
          <coneGeometry
            args={[0.24, 0.55, 6]}
          />
          <meshStandardMaterial
            color="#ffe27c"
            emissive="#b78710"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}

function WalkingCitizen({
  data,
}: {
  data: WalkerDef;
}) {
  const root =
    useRef<THREE.Group>(null);

  const leftLeg =
    useRef<THREE.Group>(null);

  const rightLeg =
    useRef<THREE.Group>(null);

  const leftArm =
    useRef<THREE.Group>(null);

  const rightArm =
    useRef<THREE.Group>(null);

  const nextPoint = useRef(1);
  const animationTime = useRef(0);

  useFrame((_, rawDelta) => {
    const delta = Math.min(
      rawDelta,
      0.05
    );

    const actor = root.current;

    if (!actor) return;

    const point =
      data.path[nextPoint.current];

    const dx =
      point[0] - actor.position.x;

    const dz =
      point[1] - actor.position.z;

    const distance = Math.hypot(
      dx,
      dz
    );

    if (distance < 0.17) {
      nextPoint.current =
        (nextPoint.current + 1) %
        data.path.length;

      return;
    }

    const step = Math.min(
      distance,
      data.speed * delta
    );

    const directionX = dx / distance;
    const directionZ = dz / distance;

    actor.position.x +=
      directionX * step;

    actor.position.z +=
      directionZ * step;

    // Smooth character orientation.
    const heading = Math.atan2(
      directionX,
      directionZ
    );

    const angle = Math.atan2(
      Math.sin(
        heading - actor.rotation.y
      ),
      Math.cos(
        heading - actor.rotation.y
      )
    );

    actor.rotation.y +=
      angle *
      (1 - Math.exp(-8 * delta));

    // Procedural walking animation.
    animationTime.current +=
      data.speed * delta * 5;

    const swing =
      Math.sin(animationTime.current) *
      0.42;

    if (leftLeg.current) {
      leftLeg.current.rotation.x =
        swing;
    }

    if (rightLeg.current) {
      rightLeg.current.rotation.x =
        -swing;
    }

    if (leftArm.current) {
      leftArm.current.rotation.x =
        -swing * 0.65;
    }

    if (rightArm.current) {
      rightArm.current.rotation.x =
        swing * 0.65;
    }
  });

  return (
    <group
      ref={root}
      position={[
        data.path[0][0],
        0,
        data.path[0][1],
      ]}
    >
      {/* Shirt */}
      <mesh
        castShadow
        position={[0, 1.2, 0]}
      >
        <boxGeometry
          args={[0.85, 1.28, 0.55]}
        />
        <meshStandardMaterial
          color={data.shirt}
          roughness={0.95}
        />
      </mesh>

      {/* Head */}
      <mesh
        castShadow
        position={[0, 2.2, 0]}
      >
        <sphereGeometry
          args={[0.49, 12, 10]}
        />
        <meshStandardMaterial
          color="#edbc97"
          roughness={0.92}
        />
      </mesh>

      {/* Hair */}
      <mesh
        castShadow
        position={[0, 2.57, -0.03]}
      >
        <sphereGeometry
          args={[
            0.5,
            12,
            8,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2,
          ]}
        />
        <meshStandardMaterial
          color={data.hair}
          roughness={1}
        />
      </mesh>

      {/* Eyes */}
      {[-0.18, 0.18].map(
        (offset) => (
          <mesh
            key={offset}
            position={[
              offset,
              2.23,
              0.45,
            ]}
          >
            <sphereGeometry
              args={[0.046, 8, 8]}
            />
            <meshBasicMaterial
              color="#252a32"
            />
          </mesh>
        )
      )}

      {/* Animated arms */}
      {[-1, 1].map((side) => (
        <group
          key={`arm-${side}`}
          ref={
            side === -1
              ? leftArm
              : rightArm
          }
          position={[
            side * 0.56,
            1.62,
            0,
          ]}
        >
          <mesh
            castShadow
            position={[0, -0.45, 0]}
          >
            <boxGeometry
              args={[0.23, 0.93, 0.3]}
            />
            <meshStandardMaterial
              color="#edbc97"
            />
          </mesh>
        </group>
      ))}

      {/* Animated legs and shoes */}
      {[-1, 1].map((side) => (
        <group
          key={`leg-${side}`}
          ref={
            side === -1
              ? leftLeg
              : rightLeg
          }
          position={[
            side * 0.22,
            0.72,
            0,
          ]}
        >
          <mesh
            castShadow
            position={[0, -0.31, 0]}
          >
            <boxGeometry
              args={[0.31, 0.65, 0.4]}
            />
            <meshStandardMaterial
              color={data.pants}
            />
          </mesh>

          <mesh
            castShadow
            position={[0, -0.63, 0.1]}
          >
            <boxGeometry
              args={[0.35, 0.16, 0.57]}
            />
            <meshStandardMaterial
              color="#30343a"
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ShopStand() {
  return (
    <group position={[-6, 0, -6]}>
      <mesh
        castShadow
        position={[0, 0.75, 0]}
      >
        <boxGeometry
          args={[3.4, 1.5, 1.7]}
        />
        <meshStandardMaterial
          color="#deb18a"
          roughness={0.86}
        />
      </mesh>

      <mesh
        castShadow
        position={[0, 2.75, 0]}
      >
        <boxGeometry
          args={[3.7, 0.3, 2.25]}
        />
        <meshStandardMaterial
          color="#e16e76"
          roughness={0.85}
        />
      </mesh>

      {[-1.5, 1.5].map(
        (offset) => (
          <mesh
            key={offset}
            position={[
              offset,
              1.85,
              -0.75,
            ]}
          >
            <boxGeometry
              args={[
                0.15,
                1.6,
                0.15,
              ]}
            />
            <meshStandardMaterial
              color="#614a57"
            />
          </mesh>
        )
      )}

      <mesh
        position={[0, 2.36, 1.16]}
      >
        <boxGeometry
          args={[2.3, 0.45, 0.12]}
        />
        <meshStandardMaterial
          color="#fff5d5"
        />
      </mesh>

      <mesh
        position={[-0.86, 1.74, 0.45]}
        rotation={[0, 0, -0.18]}
      >
        <coneGeometry
          args={[0.32, 0.72, 5]}
        />
        <meshStandardMaterial
          color="#ff9d39"
        />
      </mesh>

      <mesh
        position={[0.55, 1.66, 0.45]}
      >
        <torusGeometry
          args={[0.38, 0.12, 8, 15]}
        />
        <meshStandardMaterial
          color="#76e8dd"
        />
      </mesh>

      {/* Awning details */}
      {[-1.22, -0.4, 0.42, 1.24].map(
        (offset) => (
          <mesh
            key={offset}
            position={[
              offset,
              2.52,
              0.98,
            ]}
          >
            <boxGeometry
              args={[0.39, 0.26, 0.06]}
            />
            <meshStandardMaterial
              color="#f2c9a8"
            />
          </mesh>
        )
      )}
    </group>
  );
}

function Clouds() {
  const clouds = useRef<
    (THREE.Group | null)[]
  >([]);

  useFrame(({ clock }) => {
    clouds.current.forEach(
      (cloud, index) => {
        if (!cloud) return;

        cloud.position.x =
          (
            (
              clock.elapsedTime *
                (0.35 + index * 0.09) +
              index * 32 +
              65
            ) %
            135
          ) - 67.5;
      }
    );
  });

  return (
    <>
      {[
        [-43, 35, -28],
        [0, 39, 21],
        [38, 36, -42],
        [-9, 42, 45],
      ].map((position, index) => (
        <group
          key={index}
          ref={(node) => {
            clouds.current[index] = node;
          }}
          position={
            position as [
              number,
              number,
              number
            ]
          }
        >
          <mesh
            scale={[3.4, 0.75, 1.3]}
          >
            <sphereGeometry
              args={[1, 10, 7]}
            />
            <meshBasicMaterial
              color="#f3f6f4"
            />
          </mesh>

          <mesh
            position={[
              -2,
              -0.15,
              0.18,
            ]}
            scale={[1.8, 0.6, 1.05]}
          >
            <sphereGeometry
              args={[1, 9, 7]}
            />
            <meshBasicMaterial
              color="#f3f6f4"
            />
          </mesh>

          <mesh
            position={[2, -0.2, -0.1]}
            scale={[1.65, 0.55, 1.12]}
          >
            <sphereGeometry
              args={[1, 9, 7]}
            />
            <meshBasicMaterial
              color="#f3f6f4"
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

function GiantDuck() {
  const duck =
    useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    if (!duck.current) return;

    duck.current.position.y =
      Math.sin(
        clock.elapsedTime * 3
      ) * 0.22;

    duck.current.rotation.y +=
      delta * 0.46;
  });

  return (
    <group
      ref={duck}
      position={[0, 0, -19]}
    >
      <mesh
        castShadow
        position={[0, 2.4, 0]}
      >
        <sphereGeometry
          args={[2.6, 18, 14]}
        />
        <meshStandardMaterial
          color="#ffe066"
        />
      </mesh>

      <mesh
        castShadow
        position={[0, 4.7, 1]}
      >
        <sphereGeometry
          args={[1.65, 16, 12]}
        />
        <meshStandardMaterial
          color="#ffe066"
        />
      </mesh>

      <mesh
        position={[0, 4.25, 2.68]}
      >
        <coneGeometry
          args={[0.55, 1.8, 4]}
        />
        <meshStandardMaterial
          color="#ff9e42"
        />
      </mesh>

      {[-0.65, 0.65].map(
        (offset) => (
          <mesh
            key={offset}
            position={[
              offset,
              5.12,
              2.33,
            ]}
          >
            <sphereGeometry
              args={[0.17, 8, 8]}
            />
            <meshBasicMaterial
              color="#252636"
            />
          </mesh>
        )
      )}

      {[-1, 1].map((side) => (
        <mesh
          key={side}
          castShadow
          position={[
            side * 2.4,
            2.9,
            0,
          ]}
          rotation={[
            0,
            0,
            -side * 0.4,
          ]}
        >
          <sphereGeometry
            args={[
              0.8,
              1.25,
              0.5,
              9,
              8,
            ]}
          />
          <meshStandardMaterial
            color="#f7ce54"
          />
        </mesh>
      ))}
    </group>
  );
}

export function CityExtras({
  cityEvent,
}: {
  cityEvent: CityEvent;
}) {
  return (
    <>
      {/* Existing interactive objects */}
      <ShopStand />

      <Citizen
        x={SHOP_POSITION.x}
        z={SHOP_POSITION.z}
        shirt="#63a9db"
      />

      <Citizen
        x={CITIZEN_POSITION.x}
        z={CITIZEN_POSITION.z}
        shirt="#b49af2"
      />

      {/* Ambient moving citizens */}
      {WALKERS.map((data) => (
        <WalkingCitizen
          key={data.id}
          data={data}
        />
      ))}

      {/* Atmospheric elements */}
      <Clouds />

      {/* Existing brainrot event */}
      {cityEvent === 'duck-invasion' && (
        <GiantDuck />
      )}
    </>
  );
}
