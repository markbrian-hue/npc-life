
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { CityEvent } from './Player';

export const SHOP_POSITION = { x: -6, z: -3 };
export const CITIZEN_POSITION = { x: 6, z: -4 };

function Citizen({
  x,
  z,
  shirt,
}: {
  x: number;
  z: number;
  shirt: string;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow position={[0, 1.08, 0]}>
        <boxGeometry args={[0.95, 1.32, 0.55]} />
        <meshStandardMaterial color={shirt} />
      </mesh>

      <mesh castShadow position={[0, 2.12, 0]}>
        <sphereGeometry args={[0.55, 12, 10]} />
        <meshStandardMaterial color="#f4c49d" />
      </mesh>

      <mesh position={[0, 2.55, 0]}>
        <sphereGeometry
          args={[0.55, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <meshStandardMaterial color="#694b39" />
      </mesh>

      {[-0.2, 0.2].map((x) => (
        <mesh key={x} position={[x, 2.19, 0.52]}>
          <sphereGeometry args={[0.065, 8, 8]} />
          <meshBasicMaterial color="#1b2531" />
        </mesh>
      ))}

      {[-0.26, 0.26].map((x) => (
        <mesh
          key={x}
          castShadow
          position={[x, 0.35, 0]}
        >
          <boxGeometry args={[0.33, 0.7, 0.42]} />
          <meshStandardMaterial color="#38466e" />
        </mesh>
      ))}

      <mesh
        position={[0, 3.1, 0]}
        rotation={[0, 0, Math.PI]}
      >
        <coneGeometry args={[0.24, 0.55, 6]} />
        <meshStandardMaterial
          color="#ffe27c"
          emissive="#b78710"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

function ShopStand() {
  return (
    <group position={[-6, 0, -6]}>
      <mesh castShadow position={[0, 0.75, 0]}>
        <boxGeometry args={[3.4, 1.5, 1.7]} />
        <meshStandardMaterial color="#f4c18f" />
      </mesh>

      <mesh castShadow position={[0, 2.75, 0]}>
        <boxGeometry args={[3.7, 0.3, 2.25]} />
        <meshStandardMaterial color="#ff7d86" />
      </mesh>

      {[-1.5, 1.5].map((x) => (
        <mesh key={x} position={[x, 1.85, -0.75]}>
          <boxGeometry args={[0.15, 1.6, 0.15]} />
          <meshStandardMaterial color="#614a57" />
        </mesh>
      ))}

      <mesh position={[0, 2.36, 1.16]}>
        <boxGeometry args={[2.3, 0.45, 0.12]} />
        <meshStandardMaterial color="#fff5d5" />
      </mesh>

      <mesh
        position={[-0.86, 1.74, 0.45]}
        rotation={[0, 0, -0.18]}
      >
        <coneGeometry args={[0.32, 0.72, 5]} />
        <meshStandardMaterial color="#ff9d39" />
      </mesh>

      <mesh position={[0.55, 1.66, 0.45]}>
        <torusGeometry args={[0.38, 0.12, 8, 15]} />
        <meshStandardMaterial color="#76e8dd" />
      </mesh>
    </group>
  );
}

function GiantDuck() {
  const duck = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (duck.current) {
      duck.current.position.y =
        Math.sin(clock.elapsedTime * 3) * 0.22;

      duck.current.rotation.y += 0.008;
    }
  });

  return (
    <group ref={duck} position={[0, 0, -19]}>
      {/* Body */}
      <mesh castShadow position={[0, 2.4, 0]}>
        <sphereGeometry args={[2.6, 18, 14]} />
        <meshStandardMaterial color="#ffe066" />
      </mesh>

      {/* Head */}
      <mesh castShadow position={[0, 4.7, 1.0]}>
        <sphereGeometry args={[1.65, 16, 12]} />
        <meshStandardMaterial color="#ffe066" />
      </mesh>

      {/* Beak */}
      <mesh position={[0, 4.25, 2.68]}>
        <coneGeometry args={[0.55, 1.8, 4]} />
        <meshStandardMaterial color="#ff9e42" />
      </mesh>

      {/* Eyes */}
      {[-0.65, 0.65].map((x) => (
        <mesh key={x} position={[x, 5.12, 2.33]}>
          <sphereGeometry args={[0.17, 8, 8]} />
          <meshBasicMaterial color="#252636" />
        </mesh>
      ))}

      {/* Wings */}
      <mesh
        castShadow
        position={[-2.4, 2.9, 0]}
        rotation={[0, 0, 0.4]}
      >
        <sphereGeometry args={[0.8, 1.25, 0.5, 9, 8]} />
        <meshStandardMaterial color="#f7ce54" />
      </mesh>

      <mesh
        castShadow
        position={[2.4, 2.9, 0]}
        rotation={[0, 0, -0.4]}
      >
        <sphereGeometry args={[0.8, 1.25, 0.5, 9, 8]} />
        <meshStandardMaterial color="#f7ce54" />
      </mesh>
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

      {cityEvent === 'duck-invasion' && <GiantDuck />}
    </>
  );
}
