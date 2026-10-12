
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import type { PlayerLocation } from './Player';
import {
  STREET_NPCS,
  type StreetNpc,
} from './alpha7';

function shortestTurn(
  current: number,
  goal: number,
  delta: number
): number {
  const angle = Math.atan2(
    Math.sin(goal - current),
    Math.cos(goal - current)
  );

  return (
    current +
    angle * (1 - Math.exp(-6 * delta))
  );
}

function NamedCitizen({
  npc,
  player,
  reputation,
}: {
  npc: StreetNpc;
  player: PlayerLocation;
  reputation: number;
}) {
  const root = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);

  const cycle = useRef(0);
  const pace = useRef(0);
  const phase = useRef<'walk' | 'pause'>('walk');
  const pause = useRef(0);

  useFrame(({ clock }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const actor = root.current;

    if (!actor) return;

    const dx = player.x - actor.position.x;
    const dz = player.z - actor.position.z;

    const near = Math.hypot(dx, dz) < 4.5;

    // Short pacing route near each character's post.
    if (!near && phase.current === 'walk') {
      pace.current += delta * 0.65;

      actor.position.x =
        npc.x + Math.sin(pace.current) * 0.75;

      cycle.current += delta * 3.4;

      if (pace.current > Math.PI * 2) {
        phase.current = 'pause';
        pause.current = 2.2;
        pace.current = 0;
      }
    } else if (phase.current === 'pause') {
      pause.current -= delta;

      if (pause.current <= 0) {
        phase.current = 'walk';
      }
    }

    // Face the player when they approach.
    const targetYaw = near
      ? Math.atan2(dx, dz)
      : Math.cos(pace.current) >= 0
        ? Math.PI / 2
        : -Math.PI / 2;

    actor.rotation.y = shortestTurn(
      actor.rotation.y,
      targetYaw,
      delta
    );

    const moving =
      !near && phase.current === 'walk';

    const swing = moving
      ? Math.sin(cycle.current) * 0.42
      : 0;

    if (leftLeg.current) {
      leftLeg.current.rotation.x = THREE.MathUtils.damp(
        leftLeg.current.rotation.x,
        swing,
        8,
        delta
      );
    }

    if (rightLeg.current) {
      rightLeg.current.rotation.x = THREE.MathUtils.damp(
        rightLeg.current.rotation.x,
        -swing,
        8,
        delta
      );
    }

    if (leftArm.current) {
      leftArm.current.rotation.x = THREE.MathUtils.damp(
        leftArm.current.rotation.x,
        -swing * 0.7,
        8,
        delta
      );
    }

    if (rightArm.current) {
      rightArm.current.rotation.x = THREE.MathUtils.damp(
        rightArm.current.rotation.x,
        swing * 0.7,
        8,
        delta
      );

      const wave =
        near && Math.hypot(dx, dz) < 3.3;

      rightArm.current.rotation.z = THREE.MathUtils.damp(
        rightArm.current.rotation.z,
        wave
          ? 2 +
              Math.sin(
                clock.elapsedTime *
                  (reputation > 100 ? 12 : 7)
              ) *
                0.14
          : 0,
        8,
        delta
      );
    }
  });

  return (
    <group
      ref={root}
      position={[npc.x, 0, npc.z]}
    >
      {/* Body */}
      <mesh castShadow position={[0, 1.15, 0]}>
        <boxGeometry args={[0.9, 1.28, 0.52]} />
        <meshStandardMaterial
          color={npc.shirt}
          roughness={0.92}
        />
      </mesh>

      {/* Head */}
      <mesh castShadow position={[0, 2.1, 0]}>
        <sphereGeometry args={[0.49, 12, 9]} />
        <meshStandardMaterial color="#eec49b" />
      </mesh>

      {/* Hair */}
      <mesh castShadow position={[0, 2.47, -0.04]}>
        <sphereGeometry
          args={[
            0.49,
            12,
            8,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2,
          ]}
        />
        <meshStandardMaterial
          color={npc.hair}
          roughness={1}
        />
      </mesh>

      {/* Eyes */}
      {[-0.19, 0.19].map((x) => (
        <mesh
          key={x}
          position={[x, 2.15, 0.45]}
        >
          <sphereGeometry args={[0.055, 8, 7]} />
          <meshBasicMaterial color="#242b36" />
        </mesh>
      ))}

      {/* Animated arms */}
      {[-1, 1].map((side) => (
        <group
          key={`arm${side}`}
          ref={
            side === -1 ? leftArm : rightArm
          }
          position={[side * 0.56, 1.55, 0]}
        >
          <mesh
            castShadow
            position={[0, -0.47, 0]}
          >
            <boxGeometry
              args={[0.23, 0.94, 0.31]}
            />
            <meshStandardMaterial color="#eec49b" />
          </mesh>
        </group>
      ))}

      {/* Animated legs */}
      {[-1, 1].map((side) => (
        <group
          key={`leg${side}`}
          ref={
            side === -1 ? leftLeg : rightLeg
          }
          position={[side * 0.23, 0.72, 0]}
        >
          <mesh
            castShadow
            position={[0, -0.34, 0]}
          >
            <boxGeometry
              args={[0.32, 0.68, 0.42]}
            />
            <meshStandardMaterial color={npc.pants} />
          </mesh>
        </group>
      ))}

      {/* Interaction marker */}
      <mesh
        position={[0, 3.1, 0]}
        rotation={[0, 0, Math.PI]}
      >
        <coneGeometry args={[0.23, 0.53, 6]} />
        <meshStandardMaterial
          color="#fce184"
          emissive="#ac7a23"
          emissiveIntensity={0.28}
        />
      </mesh>
    </group>
  );
}

export function ReactiveCitizens({
  player,
  reputation,
}: {
  player: PlayerLocation;
  reputation: number;
}) {
  return (
    <>
      {STREET_NPCS.map((npc) => (
        <NamedCitizen
          key={npc.id}
          npc={npc}
          player={player}
          reputation={reputation}
        />
      ))}
    </>
  );
}
