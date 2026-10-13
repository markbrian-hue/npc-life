import {useGameUI} from './ui/GameUI';
import {residentBlocked} from './pedestrianBodies';
import {freshPlayer,stepPlayer,PLAYER_STEP,surfaceAt,groundHeight} from '../../shared/playerPhysics.mjs';
import type {LivingRuntime} from './LivingCity';
import type {MutableRefObject} from 'react';
import { playGameSound, updateEngineSound } from './gameAudio';
import type { Vehicles } from './Vehicles';
import { pedestrianBlocked } from '../../shared/vehicles.mjs';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { Character } from './Character';
import { blocked, SPAWN } from './world';
import { safeCameraDistance } from './cameraCollision';

export type PlayerLocation = {
  x: number;
  z: number;
};

export type CityEvent =
  | 'none'
  | 'low-gravity'
  | 'duck-invasion';

type Props = {
  living: MutableRefObject<LivingRuntime>;
  vehicles: Vehicles;
  onMove: (position: PlayerLocation) => void;
  equipped: string;
  shirtColor: string;
  emote: boolean;
  cityEvent: CityEvent;
  inputLocked: boolean;
};

export function Player({
  living,
  onMove,
  vehicles,
  equipped,
  shirtColor,
  emote,
  cityEvent,
  inputLocked,
}: Props) {
  const {store}=useGameUI();
  const actor = useRef<THREE.Group>(null);
  const model = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);

  const keys = useRef(new Set<string>());
  const position = useRef(new THREE.Vector3(SPAWN.x, 0, SPAWN.z));
  const velocity = useRef(new THREE.Vector2());

  const upwardSpeed = useRef(0);
  const grounded = useRef(true);
  const sitting = useRef<{x:number;z:number;rotation:number;exit:{x:number;z:number}}|null>(null);
  const coffeeUntil = useRef(0);
  const jumpBuffer = useRef(0);
  const coyote = useRef(0.1);

  const physics=useRef(freshPlayer(SPAWN.x,SPAWN.z)),physicsTime=useRef(0);
  const walkCycle = useRef(0);
  const footstep=useRef(0), previousCarSpeed=useRef(0);
  const walkBlend = useRef(0);
  const reporting = useRef(0);

  const orbit = useRef({
    yaw: 0.6,
    pitch: 0.65,
    zoom: 13,
  });

  const dragging = useRef<number | null>(null);

  const focus = useRef(
    new THREE.Vector3(SPAWN.x, 1.7, SPAWN.z)
  );

  const desiredFocus = useRef(new THREE.Vector3());

  const orbitYaw = useRef(orbit.current.yaw);
  const orbitPitch = useRef(orbit.current.pitch);
  const cameraDistance = useRef(orbit.current.zoom);
  const cameraDirection = useRef(new THREE.Vector3());

  const { camera, gl } = useThree();

  useEffect(() => {
    const relocate=(event:Event)=>{sitting.current=null;window.dispatchEvent(new CustomEvent('npc-life:stood'));const p=(event as CustomEvent).detail;position.current.set(p.x,0,p.z);Object.assign(physics.current,freshPlayer(p.x,p.z));physicsTime.current=0;velocity.current.set(0,0);upwardSpeed.current=0;grounded.current=true;keys.current.clear();};
    const rest=(event:Event)=>{const p=(event as CustomEvent).detail;if(p){sitting.current={...p,exit:{x:position.current.x,z:position.current.z}};keys.current.clear();velocity.current.set(0,0);}else if(sitting.current){position.current.set(sitting.current.exit.x,0,sitting.current.exit.z);sitting.current=null;window.dispatchEvent(new CustomEvent('npc-life:stood'));}};
    const coffee=()=>{coffeeUntil.current=performance.now()+60000;};
    window.addEventListener('npc-life:rest',rest);window.addEventListener('npc-life:coffee',coffee);
    window.addEventListener('npc-life:relocate',relocate);return()=>{window.removeEventListener('npc-life:relocate',relocate);window.removeEventListener('npc-life:rest',rest);window.removeEventListener('npc-life:coffee',coffee);};
  },[]);
  // Mouse camera and keyboard input.
  useEffect(() => {
    const canvas = gl.domElement;

    const release = () => {
      const id = dragging.current;

      if (
        id !== null &&
        canvas.hasPointerCapture(id)
      ) {
        canvas.releasePointerCapture(id);
      }

      dragging.current = null;
    };

    const down = (event: PointerEvent) => {
      if (
        inputLocked ||
        (event.button !== 0 && event.button !== 2)
      ) {
        return;
      }

      dragging.current = event.pointerId;
      canvas.setPointerCapture(event.pointerId);
    };

    const move = (event: PointerEvent) => {
      if (
        inputLocked ||
        dragging.current !== event.pointerId
      ) {
        return;
      }

      orbit.current.yaw -= event.movementX * 0.005;

      orbit.current.pitch = THREE.MathUtils.clamp(
        orbit.current.pitch -
          event.movementY * 0.0035,
        0.2,
        1.3
      );
    };

    const up = (event: PointerEvent) => {
      if (dragging.current === event.pointerId) {
        release();
      }
    };

    const wheel = (event: WheelEvent) => {
      if (inputLocked||store.getSnapshot()!==null) return;

      event.preventDefault();

      orbit.current.zoom = THREE.MathUtils.clamp(
        orbit.current.zoom + event.deltaY * 0.01,
        5.5,
        20
      );
    };

    const context = (event: MouseEvent) => {
      if (!inputLocked) event.preventDefault();
    };

    const keyDown = (event: KeyboardEvent) => {
      if (inputLocked||store.getSnapshot()!==null) return;

      if (
        event.target instanceof HTMLElement &&
        event.target.closest(
          'input, textarea, select, [contenteditable="true"]'
        )
      ) {
        return;
      }

      if (
        [
          'Space',
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
        ].includes(event.code)
      ) {
        event.preventDefault();
      }

      if (
        event.code === 'Space' &&
        !event.repeat
      ) {
        jumpBuffer.current = 0.12;
      }

      if(sitting.current&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(event.code))window.dispatchEvent(new CustomEvent('npc-life:rest',{detail:null}));
      keys.current.add(event.code);
    };

    const keyUp = (event: KeyboardEvent) => {
      keys.current.delete(event.code);
    };

    const blur = () => {
      physics.current.vx=physics.current.vz=0;physicsTime.current=0;velocity.current.set(0,0);
      keys.current.clear();
      jumpBuffer.current = 0;
      release();
    };

    const unsubscribe=store.subscribe(()=>{if(store.getSnapshot()!==null)blur();});
    if (inputLocked) {
      physics.current.vx=physics.current.vz=0;physicsTime.current=0;
      keys.current.clear();
      jumpBuffer.current = 0;
      velocity.current.set(0, 0);
      release();
    }

    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', wheel, {
      passive: false,
    });
    canvas.addEventListener('contextmenu', context);

    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', blur);

    return () => {
      unsubscribe();release();

      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('wheel', wheel);
      canvas.removeEventListener('contextmenu', context);

      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', blur);
    };
  }, [gl, inputLocked,store]);

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const worldLocked=inputLocked||store.getSnapshot()!==null;
    const pressed = keys.current;
    const fleet=vehicles.runtime.current;
    const car=fleet.cars.find(c=>c.id===fleet.ownedId);
    if (model.current) model.current.visible=!car;
    const movementBlocked=(x:number,z:number)=>blocked(x,z)||pedestrianBlocked(x,z,fleet.cars)||residentBlocked(x,z,position.current.x,position.current.z);

    const side = worldLocked || car
      ? 0
      : Number(
          pressed.has('KeyD') ||
          pressed.has('ArrowRight')
        ) -
        Number(
          pressed.has('KeyA') ||
          pressed.has('ArrowLeft')
        );

    const forward = worldLocked || car
      ? 0
      : Number(
          pressed.has('KeyW') ||
          pressed.has('ArrowUp')
        ) -
        Number(
          pressed.has('KeyS') ||
          pressed.has('ArrowDown')
        );

    const running =
      !worldLocked &&
      (
        pressed.has('ShiftLeft') ||
        pressed.has('ShiftRight')
      );

    const caffeinated=living.current.record.buff>0;
    const tired=living.current.record.needs.energy<15;
    const hungry=living.current.record.needs.hunger<20;
    const speed = running ? (tired?6.4:caffeinated?10.6:9.2)*(hungry?.94:1) : 5.6;
    const length = Math.hypot(side, forward);
    const yaw = orbit.current.yaw;

    // Camera-relative movement.
    const targetX = length
      ? (
          Math.cos(yaw) * side -
          Math.sin(yaw) * forward
        ) / length * speed
      : 0;

    const targetZ = length
      ? (
          -Math.sin(yaw) * side -
          Math.cos(yaw) * forward
        ) / length * speed
      : 0;

    const v=velocity.current;
    const physicsState=physics.current;
    if(worldLocked||car||sitting.current){physicsState.x=position.current.x;physicsState.z=position.current.z;physicsState.y=position.current.y;physicsState.vx=physicsState.vz=physicsState.vy=0;v.set(0,0);physicsTime.current=0;jumpBuffer.current=0;}
    else {
      // Relocation and safe vehicle exits preserve the public event API.
      if(Math.hypot(physicsState.x-position.current.x,physicsState.z-position.current.z)>1){Object.assign(physicsState,freshPlayer(position.current.x,position.current.z));}
      physicsTime.current+=Math.min(rawDelta,.25);
      let jump=jumpBuffer.current>0,consumed=false;
      while(physicsTime.current+1e-9>=PLAYER_STEP){stepPlayer(physicsState,{x:targetX,z:targetZ,jump,lowGravity:cityEvent==='low-gravity'},PLAYER_STEP,movementBlocked);jump=false;consumed=true;physicsTime.current=Math.max(0,physicsTime.current-PLAYER_STEP);}
      if(consumed)jumpBuffer.current=0;position.current.set(physicsState.x,physicsState.y,physicsState.z);v.set(physicsState.vx,physicsState.vz);grounded.current=physicsState.grounded;
    }
    const actualSpeed=v.length();
    living.current.activity={moving:actualSpeed>.2,running:running&&actualSpeed>.2,resting:!!sitting.current&&!car,driving:!!car};
    updateEngineSound(car?.speed||0,!!car,car?.rpm||900);
    if(car&&previousCarSpeed.current>3&&Math.abs(car.speed)<.2)playGameSound('impact');previousCarSpeed.current=Math.abs(car?.speed||0);
    footstep.current+=actualSpeed*dt;if(!car&&grounded.current&&footstep.current>2){footstep.current=0;playGameSound(surfaceAt(position.current.x,position.current.z)==='grass'?'grass-step':surfaceAt(position.current.x,position.current.z)==='gravel'?'gravel-step':'step');}
    if(actualSpeed>.15&&actor.current){const target=Math.atan2(v.x,v.y),diff=Math.atan2(Math.sin(target-actor.current.rotation.y),Math.cos(target-actor.current.rotation.y));actor.current.rotation.y+=diff*(1-Math.exp(-12*dt));}

    // Character walking animation.
    walkBlend.current = THREE.MathUtils.damp(
      walkBlend.current,
      THREE.MathUtils.clamp(
        actualSpeed / 5.6,
        0,
        1
      ),
      11,
      dt
    );

    walkCycle.current +=
      actualSpeed * dt * 1.65;

    const stride =
      Math.sin(walkCycle.current) *
      walkBlend.current *
      (running ? 0.72 : 0.55);

    const swing =
      Math.sin(walkCycle.current) *
      walkBlend.current *
      0.38;

    if (leftLeg.current) {
      leftLeg.current.rotation.x = THREE.MathUtils.damp(
        leftLeg.current.rotation.x,
        grounded.current ? stride : -0.25,
        14,
        dt
      );
    }

    if (rightLeg.current) {
      rightLeg.current.rotation.x = THREE.MathUtils.damp(
        rightLeg.current.rotation.x,
        grounded.current ? -stride : 0.25,
        14,
        dt
      );
    }

    if (leftArm.current) {
      leftArm.current.rotation.x = THREE.MathUtils.damp(
        leftArm.current.rotation.x,
        -swing,
        12,
        dt
      );
    }

    if (rightArm.current) {
      rightArm.current.rotation.x = THREE.MathUtils.damp(
        rightArm.current.rotation.x,
        living.current.consuming ? -1.9 : emote ? -0.35 : swing,
        12,
        dt
      );

      rightArm.current.rotation.z = THREE.MathUtils.damp(
        rightArm.current.rotation.z,
        emote
          ? 2.2 +
            Math.sin(clock.elapsedTime * 12) * 0.18
          : 0,
        15,
        dt
      );
    }

    if (model.current) {
      model.current.position.y = THREE.MathUtils.damp(
        model.current.position.y,
        grounded.current
          ? -physics.current.landed + Math.abs(Math.sin(walkCycle.current)) *
            0.045 *
            walkBlend.current
          : 0,
        12,
        dt
      );
    }

    if(sitting.current&&!car){const seat=sitting.current;position.current.set(seat.x,-.4,seat.z);if(actor.current)actor.current.rotation.y=seat.rotation;if(leftLeg.current)leftLeg.current.rotation.x=-Math.PI/2;if(rightLeg.current)rightLeg.current.rotation.x=-Math.PI/2;velocity.current.set(0,0);jumpBuffer.current=0;}
    if(car){position.current.set(car.x,groundHeight(car.x,car.z),car.z);velocity.current.set(0,0);jumpBuffer.current=0;upwardSpeed.current=0;grounded.current=true;if(actor.current)actor.current.rotation.y=car.heading+Math.PI/2;if(dragging.current===null&&Math.abs(car.speed)>.5){const wanted=car.heading-Math.PI/2;orbit.current.yaw+=Math.atan2(Math.sin(wanted-orbit.current.yaw),Math.cos(wanted-orbit.current.yaw))*(1-Math.exp(-2.5*dt));}}
    if (actor.current) {
      actor.current.position.copy(position.current);
    }

    // Smooth camera target follows the character.
    desiredFocus.current.set(
      position.current.x,
      position.current.y + 1.7,
      position.current.z
    );

    focus.current.lerp(
      desiredFocus.current,
      1 - Math.exp(-9 * dt)
    );

    // Smooth visual orbit independently of movement.
    const yawDiff = Math.atan2(
      Math.sin(orbit.current.yaw - orbitYaw.current),
      Math.cos(orbit.current.yaw - orbitYaw.current)
    );

    orbitYaw.current +=
      yawDiff * (1 - Math.exp(-14 * dt));

    orbitPitch.current = THREE.MathUtils.damp(
      orbitPitch.current,
      orbit.current.pitch,
      14,
      dt
    );

    const cameraYaw = orbitYaw.current;
    const pitch = car?Math.min(orbitPitch.current,.5):orbitPitch.current;

    cameraDirection.current.set(
      Math.sin(cameraYaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(cameraYaw) * Math.cos(pitch)
    );

    // NEW: Check buildings between the player and camera.
    const allowed = safeCameraDistance(
      focus.current,
      cameraDirection.current,
      car?Math.max(orbit.current.zoom,car.model==='bus'?16:12)+Math.min(4,Math.abs(car.speed)*.12):orbit.current.zoom
    );

    // Pull in immediately before a wall.
    // Restore zoom smoothly after the obstruction clears.
    cameraDistance.current =
      allowed < cameraDistance.current
        ? allowed
        : THREE.MathUtils.damp(
            cameraDistance.current,
            allowed,
            3.5,
            dt
          );

    camera.position
      .copy(focus.current)
      .addScaledVector(
        cameraDirection.current,
        cameraDistance.current
      );

    camera.position.y = Math.max(
      camera.position.y,
      0.65
    );

    camera.lookAt(focus.current);

    // Report position at a controlled frequency.
    reporting.current += dt;

    if (reporting.current >= 0.12) {
      const location = {
        x: position.current.x,
        z: position.current.z,
      };

      // Keep the existing App.tsx callback working.
      onMove(location);

      // NEW: Feed the improved minimap without
      // changing existing parent component state.
      window.dispatchEvent(
        new CustomEvent('npc-life:position', {
          detail: {
            ...location,
            heading: actor.current?.rotation.y ?? 0,
            y: Math.max(0,position.current.y),
            driving: !!car,
            cameraYaw: orbit.current.yaw,
          },
        })
      );

      reporting.current = 0;
    }
  });

  return (
    <group ref={actor}>
      <group ref={model}>
        <Character shirt={shirtColor} leftArmRef={leftArm} rightArmRef={rightArm} leftLegRef={leftLeg} rightLegRef={rightLeg} />

        <ConsumedProp living={living}/>
        {/* Cosmetic accessories */}
        {equipped !== 'none' && (
          <group position={[0, 2.124, 0]} scale={.72}>
            {equipped === 'cone' && (
              <mesh castShadow>
                <coneGeometry args={[0.5, 1.25, 5]} />
                <meshStandardMaterial color="#ff9d39" />
              </mesh>
            )}

            {equipped === 'halo' && (
              <mesh
                rotation={[Math.PI / 2, 0, 0]}
                position={[0, 0.24, 0]}
                castShadow
              >
                <torusGeometry args={[0.49, 0.1, 8, 22]} />
                <meshStandardMaterial
                  color="#76e8dd"
                  emissive="#0c6560"
                  emissiveIntensity={0.25}
                />
              </mesh>
            )}

            {equipped === 'crown' && (
              <group>
                <mesh castShadow>
                  <cylinderGeometry
                    args={[0.46, 0.49, 0.26, 8]}
                  />
                  <meshStandardMaterial
                    color="#ffd55a"
                    metalness={0.4}
                  />
                </mesh>

                {Array.from({ length: 6 }, (_, i) => (
                  <mesh
                    key={i}
                    position={[
                      Math.sin(i * Math.PI / 3) * 0.35,
                      0.26,
                      Math.cos(i * Math.PI / 3) * 0.35,
                    ]}
                  >
                    <coneGeometry args={[0.13, 0.4, 4]} />
                    <meshStandardMaterial color="#ffd55a" />
                  </mesh>
                ))}
              </group>
            )}

            {equipped === 'bucket' && (
              <group>
                <mesh
                  castShadow
                  position={[0, 0.12, 0]}
                >
                  <cylinderGeometry
                    args={[0.48, 0.38, 0.76, 12]}
                  />
                  <meshStandardMaterial
                    color="#a4b5c0"
                    metalness={0.3}
                    roughness={0.65}
                  />
                </mesh>

                <mesh position={[0, 0.52, 0]}>
                  <torusGeometry args={[0.46, 0.045, 6, 20]} />
                  <meshStandardMaterial color="#e3e7e6" />
                </mesh>
              </group>
            )}

            {equipped === 'headphones' && (
              <group>
                <mesh position={[0, -0.25, 0]}>
                  <torusGeometry
                    args={[0.55, 0.085, 8, 24, Math.PI]}
                  />
                  <meshStandardMaterial color="#292e43" />
                </mesh>

                {[-1, 1].map((side) => (
                  <mesh
                    key={side}
                    position={[side * 0.56, -0.03, 0]}
                    castShadow
                  >
                    <boxGeometry args={[0.2, 0.45, 0.32]} />
                    <meshStandardMaterial color="#e987a7" />
                  </mesh>
                ))}
              </group>
            )}

            {equipped === 'antenna' && (
              <group>
                <mesh position={[0, 0.2, 0]} castShadow>
                  <cylinderGeometry
                    args={[0.35, 0.43, 0.25, 10]}
                  />
                  <meshStandardMaterial color="#505c83" />
                </mesh>

                <mesh position={[0, 0.7, 0]}>
                  <cylinderGeometry args={[0.04, 0.05, 0.9, 8]} />
                  <meshStandardMaterial color="#8fa8b9" />
                </mesh>

                <mesh position={[0, 1.18, 0]}>
                  <sphereGeometry args={[0.16, 10, 8]} />
                  <meshStandardMaterial
                    color="#72d9a6"
                    emissive="#278a58"
                    emissiveIntensity={0.65}
                  />
                </mesh>
              </group>
            )}
          </group>
        )}
      </group>
    </group>
  );
}

function ConsumedProp({living}:{living:MutableRefObject<LivingRuntime>}) {
  const ref=useRef<THREE.Group>(null);
  useFrame(()=>{if(ref.current)ref.current.visible=!!living.current.consuming;});
  return <group ref={ref} visible={false} position={[.4,1.5,.36]}><mesh rotation={[0,0,.2]}><cylinderGeometry args={[.12,.09,.3,8]}/><meshStandardMaterial color="#e8c383"/></mesh></group>;
}
