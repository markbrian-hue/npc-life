
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BUS_STOP, FOUNTAIN } from './world';

export function CarModel({ color = '#ba6660' }: { color?: string }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.67, 0]}>
        <boxGeometry args={[4.15, 0.68, 1.85]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.48}
        />
      </mesh>

      <mesh castShadow position={[-0.2, 1.15, 0]}>
        <boxGeometry args={[2.25, 0.7, 1.67]} />
        <meshStandardMaterial
          color="#85a7b0"
          metalness={0.12}
          roughness={0.2}
        />
      </mesh>

      <mesh castShadow position={[-0.2, 1.54, 0]}>
        <boxGeometry args={[2.38, 0.12, 1.74]} />
        <meshStandardMaterial
          color={color}
          metalness={0.25}
          roughness={0.55}
        />
      </mesh>

      {/* Pillars and window divisions */}
      {[-0.86, 0.62].map((x) => (
        <group key={x}>
          <mesh position={[x, 1.18, -0.85]}>
            <boxGeometry args={[0.1, 0.66, 0.08]} />
            <meshStandardMaterial color={color} />
          </mesh>

          <mesh position={[x, 1.18, 0.85]}>
            <boxGeometry args={[0.1, 0.66, 0.08]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      ))}

      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Side mirrors */}
          <mesh position={[0.55, 1.13, side * 1.02]}>
            <boxGeometry args={[0.3, 0.18, 0.3]} />
            <meshStandardMaterial
              color="#354750"
              roughness={0.4}
            />
          </mesh>

          {/* Tires and rims */}
          {[-1.38, 1.4].map((x) => (
            <group
              key={x}
              position={[x, 0.36, side * 0.94]}
            >
              <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.23, 12]} />
                <meshStandardMaterial
                  color="#292d32"
                  roughness={0.95}
                />
              </mesh>

              <mesh
                position={[0, 0, side * 0.135]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <cylinderGeometry args={[0.22, 0.22, 0.025, 10]} />
                <meshStandardMaterial
                  color="#a8b0b9"
                  metalness={0.6}
                  roughness={0.3}
                />
              </mesh>
            </group>
          ))}

          {/* Headlights */}
          <mesh position={[2.105, 0.73, side * 0.6]}>
            <boxGeometry args={[0.035, 0.2, 0.43]} />
            <meshStandardMaterial
              color="#fff0c7"
              emissive="#cca35c"
              emissiveIntensity={0.3}
            />
          </mesh>

          {/* Taillights */}
          <mesh position={[-2.105, 0.73, side * 0.6]}>
            <boxGeometry args={[0.035, 0.2, 0.43]} />
            <meshStandardMaterial
              color="#b64745"
              emissive="#5f0c0c"
              emissiveIntensity={0.2}
            />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 0.39, 0.934]}>
        <boxGeometry args={[0.85, 0.07, 0.025]} />
        <meshStandardMaterial color="#46535e" />
      </mesh>
    </group>
  );
}

export function Bench({
  x, z, rotation,
}: {
  x: number;
  z: number;
  rotation: number;
}) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      {[-0.95, 0, 0.95].map((y) => (
        <group key={y}>
          <mesh
            castShadow
            position={[0, 0.53 + y * 0.01, -0.24 + y * 0.34]}
          >
            <boxGeometry args={[2.35, 0.11, 0.15]} />
            <meshStandardMaterial
              color="#926848"
              roughness={0.9}
            />
          </mesh>
        </group>
      ))}

      <mesh castShadow position={[0, 0.56, 0]}>
        <boxGeometry args={[2.3, 0.12, 0.68]} />
        <meshStandardMaterial color="#986945" />
      </mesh>

      <mesh castShadow position={[0, 1.03, -0.32]}>
        <boxGeometry args={[2.3, 0.8, 0.11]} />
        <meshStandardMaterial color="#986945" />
      </mesh>

      {[-0.92, 0.92].map((offset) => (
        <mesh key={offset} position={[offset, 0.28, 0]}>
          <boxGeometry args={[0.15, 0.55, 0.61]} />
          <meshStandardMaterial
            color="#434a4d"
            metalness={0.35}
          />
        </mesh>
      ))}
    </group>
  );
}

export function StreetLamp({
  x, z,
}: {
  x: number;
  z: number;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow position={[0, 2.52, 0]}>
        <cylinderGeometry args={[0.1, 0.17, 5.04, 8]} />
        <meshStandardMaterial
          color="#3f4c52"
          metalness={0.45}
        />
      </mesh>

      <mesh position={[0.42, 4.93, 0]}>
        <boxGeometry args={[0.93, 0.12, 0.14]} />
        <meshStandardMaterial color="#3f4c52" />
      </mesh>

      <mesh position={[0.81, 4.8, 0]}>
        <boxGeometry args={[0.45, 0.14, 0.4]} />
        <meshStandardMaterial
          color="#fff2c9"
          emissive="#b7a06c"
          emissiveIntensity={0.35}
        />
      </mesh>
    </group>
  );
}

export function Planter({
  x, z,
}: {
  x: number;
  z: number;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.7, 0.6, 0.64, 9]} />
        <meshStandardMaterial
          color="#b4a394"
          roughness={1}
        />
      </mesh>

      <mesh castShadow position={[0, 0.85, 0]}>
        <dodecahedronGeometry args={[0.75, 0]} />
        <meshStandardMaterial
          color="#547d51"
          flatShading
        />
      </mesh>

      <mesh castShadow position={[0.26, 1.05, 0.17]}>
        <dodecahedronGeometry args={[0.44, 0]} />
        <meshStandardMaterial
          color="#759d67"
          flatShading
        />
      </mesh>
    </group>
  );
}

export function BusStop() {
  return (
    <group position={[BUS_STOP.x, 0, BUS_STOP.z]}>
      <mesh castShadow position={[0, 2, 0]}>
        <boxGeometry args={[3.7, 0.13, 1.7]} />
        <meshStandardMaterial
          color="#51666e"
          metalness={0.4}
        />
      </mesh>

      {[-1.6, 1.6].map((offset) => (
        <mesh key={offset} position={[offset, 1, 0]}>
          <boxGeometry args={[0.11, 2, 0.12]} />
          <meshStandardMaterial color="#51666e" />
        </mesh>
      ))}

      <mesh position={[0, 1.02, -0.71]}>
        <boxGeometry args={[3.25, 1.72, 0.06]} />
        <meshStandardMaterial
          color="#8dabb3"
          metalness={0.12}
          roughness={0.24}
          transparent
          opacity={0.67}
        />
      </mesh>

      <mesh castShadow position={[0, 0.53, 0.32]}>
        <boxGeometry args={[2.5, 0.13, 0.42]} />
        <meshStandardMaterial color="#926f55" />
      </mesh>

      <mesh position={[0, 2.31, 0.61]}>
        <boxGeometry args={[1.62, 0.42, 0.07]} />
        <meshStandardMaterial color="#f7e8bd" />
      </mesh>
    </group>
  );
}

export function Fountain() {
  const water = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (water.current) {
      water.current.scale.y =
        1 + Math.sin(clock.elapsedTime * 2) * 0.035;
    }
  });

  return (
    <group position={[FOUNTAIN.x, 0, FOUNTAIN.z]}>
      <mesh receiveShadow position={[0, 0.08, 0]}>
        <cylinderGeometry args={[2.2, 2.35, 0.16, 24]} />
        <meshStandardMaterial
          color="#bdb8aa"
          roughness={0.95}
        />
      </mesh>

      <mesh castShadow position={[0, 0.42, 0]}>
        <cylinderGeometry args={[1.9, 2.06, 0.5, 24]} />
        <meshStandardMaterial
          color="#d0c9b9"
          roughness={0.9}
        />
      </mesh>

      <mesh ref={water} position={[0, 0.7, 0]}>
        <cylinderGeometry args={[1.66, 1.66, 0.06, 24]} />
        <meshStandardMaterial
          color="#6baeba"
          roughness={0.18}
          metalness={0.18}
          transparent
          opacity={0.88}
        />
      </mesh>

      <mesh castShadow position={[0, 1.08, 0]}>
        <cylinderGeometry args={[0.28, 0.38, 0.82, 12]} />
        <meshStandardMaterial color="#d7d0c0" />
      </mesh>

      <mesh castShadow position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.28, 12, 10]} />
        <meshStandardMaterial color="#e0d4c5" />
      </mesh>
    </group>
  );
}

export function Bin({
  x, z,
}: {
  x: number;
  z: number;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.36, 0.3, 1.03, 8]} />
        <meshStandardMaterial
          color="#58746c"
          roughness={0.9}
        />
      </mesh>

      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.11, 8]} />
        <meshStandardMaterial color="#303e40" />
      </mesh>
    </group>
  );
}

export function Hydrant({
  x, z,
}: {
  x: number;
  z: number;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow position={[0, 0.46, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 0.8, 10]} />
        <meshStandardMaterial
          color="#c3614d"
          roughness={0.78}
        />
      </mesh>

      <mesh position={[0, 0.88, 0]}>
        <sphereGeometry args={[0.26, 8, 6]} />
        <meshStandardMaterial color="#c3614d" />
      </mesh>

      <mesh
        position={[0.26, 0.56, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.11, 0.11, 0.53, 8]} />
        <meshStandardMaterial color="#8d473e" />
      </mesh>
    </group>
  );
}
