import {groundHeight} from '../../shared/playerPhysics.mjs';
import {pedestrianBodies,residentBlocked} from './pedestrianBodies';
import { blocked } from './world';
import {PEDESTRIAN_ROUTES} from '../../shared/sidewalkRoutes.mjs';
import { Character } from './Character';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type {
  CityEvent,
  PlayerLocation,
} from './Player';

export const SHOP_POSITION = {
  x: -8,
  z: -16,
};

export const CITIZEN_POSITION = {
  x: 8,
  z: -16,
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
  { id: 'juniper-resident', shirt: '#ae8db8', pants: '#48574e', hair: '#715242', speed: .95, path: [[-97,-74],[-97,-62]] },
  { id: 'dispatch-worker', shirt: '#658ba1', pants: '#38434c', hair: '#443931', speed: 1.15, path: [[6.5,-85],[6.5,-70]] },
  { id: 'market-shopper', shirt: '#dc9b8b', pants: '#535b54', hair: '#62452f', speed: .9, path: [[42,6.4],[63,6.4]] },
  { id: 'park-jogger', shirt: '#74a47b', pants: '#354056', hair: '#473930', speed: 1.8, path: [[-44,-10],[-74,-10]] },
  {
    id: 'commuter',
    shirt: '#658ba1',
    pants: '#374858',
    hair: '#55423a',
    speed: 1.18,
    path: [
      [-27, -9.5],
      [-13, -9.5],
    ],
  },
  {
    id: 'tourist',
    shirt: '#d8a167',
    pants: '#506072',
    hair: '#3b3134',
    speed: 1.02,
    path: [
      [13, 9.5],
      [27, 9.5],
    ],
  },
  {
    id: 'neighbor',
    shirt: '#ae8db8',
    pants: '#3b4f58',
    hair: '#715242',
    speed: 1.12,
    path: [
      [-8, 13],
      [-8, 27],
    ],
  },
  {
    id: 'runner',
    shirt: '#74a47b',
    pants: '#354056',
    hair: '#473930',
    speed: 1.55,
    path: [
      [8, -27],
      [8, -13],
    ],
  },
];

function rotateToward(
  current: number,
  target: number,
  delta: number,
  speed: number
) {
  const error = Math.atan2(
    Math.sin(target - current),
    Math.cos(target - current)
  );

  return current + error * (1 - Math.exp(-speed * delta));
}

function CitizenBody({
  shirt,
  hair,
  pants = '#38466e',
  bodyRef,
  leftArmRef,
  rightArmRef,
  leftLegRef,
  rightLegRef,
}: {
  shirt: string;
  hair: string;
  pants?: string;
  bodyRef?: React.RefObject<THREE.Group | null>;
  leftArmRef?: React.RefObject<THREE.Group | null>;
  rightArmRef?: React.RefObject<THREE.Group | null>;
  leftLegRef?: React.RefObject<THREE.Group | null>;
  rightLegRef?: React.RefObject<THREE.Group | null>;
}) {
  return <Character shirt={shirt} hair={hair} pants={pants} gender={['#ab88bf','#dc9b8b','#ae8db8'].includes(shirt) ? 'woman' : 'man'} skin={['#658ba1','#ae8db8'].includes(shirt)?'#98674e':'#d5a17a'} bodyRef={bodyRef} leftArmRef={leftArmRef} rightArmRef={rightArmRef} leftLegRef={leftLegRef} rightLegRef={rightLegRef} />;
}

function StaticCitizen({
  x,
  z,
  shirt,
  hair,
  player,
}: {
  x: number;
  z: number;
  shirt: string;
  hair: string;
  player: PlayerLocation;
}) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    if (!root.current || !body.current) return;

    const dx = player.x - x;
    const dz = player.z - z;
    const playerDistance = Math.hypot(dx, dz);
    const lookingAtPlayer = playerDistance < 4.25;

    const idleBob =
      Math.sin(clock.elapsedTime * 1.8 + x) *
      0.03;

    body.current.position.y =
      THREE.MathUtils.damp(
        body.current.position.y,
        idleBob,
        5,
        delta
      );

    body.current.rotation.z =
      THREE.MathUtils.damp(
        body.current.rotation.z,
        Math.sin(clock.elapsedTime * 1.2 + z) *
          0.02,
        4,
        delta
      );

    const targetYaw = lookingAtPlayer
      ? Math.atan2(dx, dz)
      : 0;

    root.current.rotation.y = rotateToward(
      root.current.rotation.y,
      targetYaw,
      delta,
      lookingAtPlayer ? 6 : 3
    );

    if (rightArm.current) {
      rightArm.current.rotation.z =
        THREE.MathUtils.damp(
          rightArm.current.rotation.z,
          lookingAtPlayer && playerDistance < 2.8
            ? 2.15 +
                Math.sin(
                  clock.elapsedTime * 10
                ) *
                  0.16
            : 0,
          8,
          delta
        );
    }
  });

  return (
    <group ref={root} position={[x, groundHeight(x,z), z]}>
      <CitizenBody
        shirt={shirt}
        hair={hair}
        bodyRef={body}
        rightArmRef={rightArm}
      />
    </group>
  );
}

// District pedestrians stroll long, collision-checked sidewalk runs across the
// whole map instead of pacing a few metres near spawn.
const SHIRTS=['#c46f5d','#5f86a8','#d7b45f','#7c9c6b','#a77fb3','#e0956b','#4f7d7a','#b75f78','#8e8a6b'];
const PANTS=['#38434c','#4b3f36','#2f3a4a','#55524a','#3d4b3f'];
const HAIR=['#2b2522','#6a4a33','#a37d4f','#3b3134','#c9c0b3'];
const DISTRICT_WALKERS:readonly WalkerDef[]=PEDESTRIAN_ROUTES.map((route,i)=>({
  id:'district-walker:'+route.id,
  shirt:SHIRTS[i%SHIRTS.length],pants:PANTS[i%PANTS.length],hair:HAIR[(i*3)%HAIR.length],
  speed:1.05+(i%5)*.09,
  path:[[route.from.x,route.from.z],[route.to.x,route.to.z]],
}));
const ALL_WALKERS=[...WALKERS,...DISTRICT_WALKERS];
/** Beyond this distance a walker is hidden, so distant crowds cost no draw calls. */
const WALKER_DRAW_DISTANCE=110;

function WalkingCitizen({
  data,
  player,
}: {
  data: WalkerDef;
  player: PlayerLocation;
}) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);

  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);

  useEffect(()=>()=>{pedestrianBodies.delete(data.id);},[data.id]);
  const nextPoint = useRef(1);
  const pauseTimer = useRef(0);
  const animationTime = useRef(0);

  useFrame(({ clock }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const actor = root.current;

    if (!actor || !body.current) return;
    actor.position.y=groundHeight(actor.position.x,actor.position.z);pedestrianBodies.set(data.id,{x:actor.position.x,z:actor.position.z});

    const dxPlayer =
      player.x - actor.position.x;
    const dzPlayer =
      player.z - actor.position.z;
    const playerDistance = Math.hypot(
      dxPlayer,
      dzPlayer
    );

    actor.visible=playerDistance<WALKER_DRAW_DISTANCE;
    if(playerDistance>65)return;
    const reactingToPlayer =
      playerDistance < 3.6;

    if (pauseTimer.current > 0 || reactingToPlayer) {
      pauseTimer.current = Math.max(0,pauseTimer.current-delta);
      if(reactingToPlayer)actor.rotation.y=rotateToward(actor.rotation.y,Math.atan2(dxPlayer,dzPlayer),delta,7);
      for(const limb of [leftLeg,rightLeg,leftArm,rightArm])if(limb.current)limb.current.rotation.x=THREE.MathUtils.damp(limb.current.rotation.x,0,8,delta);

      body.current.position.y =
        THREE.MathUtils.damp(
          body.current.position.y,
          Math.sin(
            clock.elapsedTime * 2.1 +
              actor.position.x
          ) * 0.04,
          5,
          delta
        );

      body.current.rotation.z =
        THREE.MathUtils.damp(
          body.current.rotation.z,
          Math.sin(
            clock.elapsedTime * 1.6 +
              actor.position.z
          ) * 0.02,
          4,
          delta
        );
    } else {
      const target =
        data.path[nextPoint.current];

      const dx =
        target[0] - actor.position.x;
      const dz =
        target[1] - actor.position.z;
      const distance = Math.hypot(dx, dz);

      if (distance < 0.18) {
        nextPoint.current =
          (nextPoint.current + 1) %
          data.path.length;

        pauseTimer.current =
          0.8 +
          ((nextPoint.current + 1) % 3) * 0.35;
      } else {
        const speed =
          reactingToPlayer
            ? data.speed * 0.42
            : data.speed;

        const step = Math.min(
          distance,
          speed * delta
        );

        const moveX = (dx / distance) * step;
        const moveZ = (dz / distance) * step;

        if(blocked(actor.position.x+moveX,actor.position.z+moveZ)){nextPoint.current=(nextPoint.current+1)%data.path.length;pauseTimer.current=.5;return;}
        actor.position.x += moveX;
        actor.position.z += moveZ;

        const heading = Math.atan2(moveX, moveZ);

        actor.rotation.y = rotateToward(
          actor.rotation.y,
          heading,
          delta,
          reactingToPlayer ? 7 : 8
        );

        animationTime.current +=
          speed * delta * 5.4;

        const swing =
          Math.sin(animationTime.current) *
          (reactingToPlayer ? 0.2 : 0.42);

        if (leftLeg.current) {
          leftLeg.current.rotation.x = swing;
        }

        if (rightLeg.current) {
          rightLeg.current.rotation.x = -swing;
        }

        if (leftArm.current) {
          leftArm.current.rotation.x =
            -swing * 0.7;
        }

        if (rightArm.current) {
          rightArm.current.rotation.x =
            swing * 0.7;
        }

        body.current.position.y =
          THREE.MathUtils.damp(
            body.current.position.y,
            Math.abs(
              Math.sin(animationTime.current)
            ) * 0.045,
            8,
            delta
          );

        body.current.rotation.z =
          THREE.MathUtils.damp(
            body.current.rotation.z,
            0,
            8,
            delta
          );
      }
    }

    if (reactingToPlayer && rightArm.current) {
      rightArm.current.rotation.z =
        THREE.MathUtils.damp(
          rightArm.current.rotation.z,
          playerDistance < 2.5
            ? 2.12 +
                Math.sin(
                  clock.elapsedTime * 11
                ) *
                  0.15
            : 0,
          7,
          delta
        );
    } else if (rightArm.current) {
      rightArm.current.rotation.z =
        THREE.MathUtils.damp(
          rightArm.current.rotation.z,
          0,
          8,
          delta
        );
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
      <CitizenBody
        shirt={data.shirt}
        hair={data.hair}
        pants={data.pants}
        bodyRef={body}
        leftArmRef={leftArm}
        rightArmRef={rightArm}
        leftLegRef={leftLeg}
        rightLegRef={rightLeg}
      />
    </group>
  );
}

function ShopStand() {
  return (
    <group position={[-8, 0, -18]}>
      <mesh
        position={[0, 0.75, 0]}
        castShadow
      >
        <boxGeometry
          args={[3.4, 1.5, 1.7]}
        />
        <meshStandardMaterial
          color="#deb18a"
          roughness={0.88}
        />
      </mesh>

      <mesh
        position={[0, 2.75, 0]}
        castShadow
      >
        <boxGeometry
          args={[3.7, 0.3, 2.25]}
        />
        <meshStandardMaterial
          color="#e16e76"
          roughness={0.86}
        />
      </mesh>

      {[-1.5, 1.5].map((offset) => (
        <mesh
          key={offset}
          position={[
            offset,
            1.85,
            -0.75,
          ]}
        >
          <boxGeometry
            args={[0.15, 1.6, 0.15]}
          />
          <meshStandardMaterial
            color="#614a57"
          />
        </mesh>
      ))}

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
        <coneGeometry args={[0.32, 0.72, 5]} />
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

      {[-1.2, -0.4, 0.4, 1.2].map(
        (offset) => (
          <mesh
            key={offset}
            position={[
              offset,
              2.54,
              0.98,
            ]}
          >
            <boxGeometry
              args={[0.38, 0.24, 0.06]}
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


function GiantDuck() {
  const duck = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    if (!duck.current) return;

    duck.current.position.y =
      Math.sin(clock.elapsedTime * 3) *
      0.22;

    duck.current.rotation.y += delta * 0.46;
  });

  return (
    <group
      ref={duck}
      position={[0, 0, -19]}
    >
      <mesh
        position={[0, 2.4, 0]}
        castShadow
      >
        <sphereGeometry
          args={[2.6, 18, 14]}
        />
        <meshStandardMaterial
          color="#ffe066"
        />
      </mesh>

      <mesh
        position={[0, 4.7, 1]}
        castShadow
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
        <coneGeometry args={[0.55, 1.8, 4]} />
        <meshStandardMaterial
          color="#ff9e42"
        />
      </mesh>

      {[-0.65, 0.65].map((offset) => (
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
      ))}

      {[-1, 1].map((side) => (
        <mesh
          key={side}
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
          castShadow
        >
          <sphereGeometry
            args={[0.8, 1.25, 0.5, 9, 8]}
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
  player,
}: {
  cityEvent: CityEvent;
  player: PlayerLocation;
}) {
  return (
    <>
      <ShopStand />

      <StaticCitizen
        x={SHOP_POSITION.x}
        z={SHOP_POSITION.z}
        shirt="#63a9db"
        hair="#5a4237"
        player={player}
      />

      <StaticCitizen
        x={CITIZEN_POSITION.x}
        z={CITIZEN_POSITION.z}
        shirt="#b49af2"
        hair="#4e4037"
        player={player}
      />

      {ALL_WALKERS.map((data) => (
        <WalkingCitizen
          key={data.id}
          data={data}
          player={player}
        />
      ))}


      {cityEvent === 'duck-invasion' && (
        <GiantDuck />
      )}
    </>
  );
}
