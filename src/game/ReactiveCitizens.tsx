import {AVATAR_RADIUS} from '../../shared/avatarDimensions.mjs';
import {groundHeight} from '../../shared/playerPhysics.mjs';
import {pedestrianBodies,residentBlocked} from './pedestrianBodies';
import type {MutableRefObject} from 'react';
import type {LivingRuntime} from './LivingCity';
import { citizenPositions } from './citizenPositions';
import { Character } from './Character';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import type { PlayerLocation } from './Player';
import { blocked } from './world';
import {
  STREET_NPCS,
  type StreetNpc,
} from './alpha7';

// NPC routes deliberately stay on clear sidewalk areas.
const ROUTES: Record<
  StreetNpc['id'],
  readonly (readonly [number, number])[]
> = {
  nia: [
    [-8, -25],
    [-7.7, -23.5],
    [-8.4, -24.1],
    [-8, -26.2],
  ],
  gus: [
    [17, -8],
    [18.2, -8.3],
    [19.1, -7.8],
    [17.7, -7.3],
  ],
  dot: [
    [7, 19],
    [6.4, 20.3],
    [7.2, 21],
    [7.8, 19.5],
  ],
};

function rotateToward(
  current: number,
  target: number,
  delta: number
): number {
  const diff = Math.atan2(
    Math.sin(target - current),
    Math.cos(target - current)
  );

  return (
    current +
    diff * (1 - Math.exp(-7 * delta))
  );
}

function Citizen({
  npc,
  player,
  reputation,
  environment,
}: {
  npc: StreetNpc;
  player: PlayerLocation;
  reputation: number;
  environment:MutableRefObject<LivingRuntime>;
}) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);

  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);

  const routeIndex = useRef(1);
  const pauseTimer = useRef(0.4);
  const walkClock = useRef(0);
  const movingBlend = useRef(0);
  const umbrella=useRef<THREE.Group>(null);
  useEffect(()=>()=>{citizenPositions.delete(npc.id);pedestrianBodies.delete(npc.id);},[npc.id]);

  useFrame(({ clock }, rawDelta) => {
    const actor = root.current;

    if (!actor) return;

    const dt = Math.min(rawDelta, 0.05);
    if(umbrella.current)umbrella.current.visible=environment.current.env.rain>.25;

    const dx = player.x - actor.position.x;
    const dz = player.z - actor.position.z;

    const playerDistance = Math.hypot(dx, dz);
    actor.position.y=groundHeight(actor.position.x,actor.position.z);
    citizenPositions.set(npc.id,{x:actor.position.x,z:actor.position.z});
    pedestrianBodies.set(npc.id,{x:actor.position.x,z:actor.position.z});
    if(playerDistance>65)return;
    const watching = playerDistance < 3.8;

    const path = ROUTES[npc.id];
    const env=environment.current.env;
    // Residents keep their identity and encounter routes, but settle at night.
    if(env.minute<360||env.minute>1320)pauseTimer.current=Math.max(pauseTimer.current,2);

    let walking = false;
    let intendedYaw = actor.rotation.y;

    // Pause and face the player when approached.
    if (watching) {
      intendedYaw = Math.atan2(dx, dz);
    } else if (pauseTimer.current > 0) {
      pauseTimer.current = Math.max(
        0,
        pauseTimer.current - dt
      );
    } else {
      const [goalX, goalZ] =
        path[routeIndex.current];

      const tx = goalX - actor.position.x;
      const tz = goalZ - actor.position.z;

      const distance = Math.hypot(tx, tz);

      if (distance < 0.12) {
        // Continue to the next point after an idle pause.
        routeIndex.current =
          (routeIndex.current + 1) % path.length;

        pauseTimer.current =
          0.8 + (routeIndex.current % 3) * 0.38;
      } else {
        const amount = Math.min(
          distance,
          (env.rain>.3?1.65:1.22) * dt
        );

        const mx = tx / distance;
        const mz = tz / distance;

        const nx =
          actor.position.x + mx * amount;

        const nz =
          actor.position.z + mz * amount;

        // Avoid static world obstacles.
        if (!blocked(nx, nz,AVATAR_RADIUS)&&!residentBlocked(nx,nz,actor.position.x,actor.position.z,npc.id)) {
          actor.position.set(nx, groundHeight(nx,nz), nz);
          intendedYaw = Math.atan2(mx, mz);
          walking = true;

          walkClock.current += dt * 6.5;
        } else {
          // Do not force NPCs through new geometry
          // if the city layout changes.
          routeIndex.current =
            (routeIndex.current + 1) % path.length;

          pauseTimer.current = 0.6;
        }
      }
    }

    actor.rotation.y = rotateToward(
      actor.rotation.y,
      intendedYaw,
      dt
    );

    movingBlend.current = THREE.MathUtils.damp(
      movingBlend.current,
      walking ? 1 : 0,
      9,
      dt
    );

    const swing =
      Math.sin(walkClock.current) *
      0.48 *
      movingBlend.current;

    if (leftLeg.current) {
      leftLeg.current.rotation.x = THREE.MathUtils.damp(
        leftLeg.current.rotation.x,
        swing,
        12,
        dt
      );
    }

    if (rightLeg.current) {
      rightLeg.current.rotation.x = THREE.MathUtils.damp(
        rightLeg.current.rotation.x,
        -swing,
        12,
        dt
      );
    }

    if (leftArm.current) {
      leftArm.current.rotation.x = THREE.MathUtils.damp(
        leftArm.current.rotation.x,
        -swing * 0.7,
        12,
        dt
      );
    }

    if (rightArm.current) {
      rightArm.current.rotation.x = THREE.MathUtils.damp(
        rightArm.current.rotation.x,
        swing * 0.7,
        12,
        dt
      );

      rightArm.current.rotation.z = THREE.MathUtils.damp(
        rightArm.current.rotation.z,
        playerDistance < 2.6
          ? 1.85 +
            Math.sin(
              clock.elapsedTime *
                (reputation >= 100 ? 11 : 7)
            ) * 0.2
          : 0,
        10,
        dt
      );
    }

    // Light idle breathing and walking bounce.
    if (body.current) {
      body.current.position.y = THREE.MathUtils.damp(
        body.current.position.y,
        walking
          ? Math.abs(
              Math.sin(walkClock.current)
            ) * 0.065
          : Math.sin(
              clock.elapsedTime * 1.8 + npc.x
            ) * 0.018,
        8,
        dt
      );
    }
  });

  return (
    <group ref={root} position={[npc.x, 0, npc.z]}>
      <group ref={body}>
        <Character shirt={npc.shirt} hair={npc.hair} pants={npc.pants} gender={npc.id === 'gus' ? 'man' : 'woman'} skin={npc.id === 'nia' ? '#ae7959' : '#dbad88'} style={npc.id === 'dot' ? 2 : 1} leftArmRef={leftArm} rightArmRef={rightArm} leftLegRef={leftLeg} rightLegRef={rightLeg} />
        <group ref={umbrella} visible={false} position={[0,3.2,0]}><mesh><coneGeometry args={[1.1,.45,8]}/><meshStandardMaterial color={npc.shirt}/></mesh><mesh position={[.3,-.75,0]}><cylinderGeometry args={[.025,.025,1.5,6]}/><meshStandardMaterial color="#e8d7a7"/></mesh></group>
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
    </group>
  );
}

export function ReactiveCitizens({
  player,
  reputation,
  environment,
}: {
  player: PlayerLocation;
  reputation: number;
  environment:MutableRefObject<LivingRuntime>;
}) {
  return (
    <>
      {STREET_NPCS.map((npc) => (
        <Citizen
          key={npc.id}
          npc={npc}
          player={player}
          reputation={reputation}
          environment={environment}
        />
      ))}
    </>
  );
}
