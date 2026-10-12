
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { blocked } from './world';
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
  onMove: (position: PlayerLocation) => void;
  equipped: string;
  shirtColor: string;
  emote: boolean;
  cityEvent: CityEvent;
  inputLocked: boolean;
};

export function Player({
  onMove,
  equipped,
  shirtColor,
  emote,
  cityEvent,
  inputLocked,
}: Props) {
  const actor = useRef<THREE.Group>(null);
  const model = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);

  const keys = useRef(new Set<string>());
  const position = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector2());

  const upwardSpeed = useRef(0);
  const grounded = useRef(true);
  const jumpBuffer = useRef(0);
  const coyote = useRef(0.1);

  const walkCycle = useRef(0);
  const walkBlend = useRef(0);
  const reporting = useRef(0);

  const orbit = useRef({
    yaw: 0.6,
    pitch: 0.65,
    zoom: 13,
  });

  const dragging = useRef<number | null>(null);

  const focus = useRef(
    new THREE.Vector3(0, 1.7, 0)
  );

  const desiredFocus = useRef(new THREE.Vector3());

  const orbitYaw = useRef(orbit.current.yaw);
  const orbitPitch = useRef(orbit.current.pitch);
  const cameraDistance = useRef(orbit.current.zoom);
  const cameraDirection = useRef(new THREE.Vector3());

  const { camera, gl } = useThree();

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
      if (inputLocked) return;

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
      if (inputLocked) return;

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

      keys.current.add(event.code);
    };

    const keyUp = (event: KeyboardEvent) => {
      keys.current.delete(event.code);
    };

    const blur = () => {
      keys.current.clear();
      jumpBuffer.current = 0;
      release();
    };

    if (inputLocked) {
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
      release();

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
  }, [gl, inputLocked]);

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const pressed = keys.current;

    const side = inputLocked
      ? 0
      : Number(
          pressed.has('KeyD') ||
          pressed.has('ArrowRight')
        ) -
        Number(
          pressed.has('KeyA') ||
          pressed.has('ArrowLeft')
        );

    const forward = inputLocked
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
      !inputLocked &&
      (
        pressed.has('ShiftLeft') ||
        pressed.has('ShiftRight')
      );

    const speed = running ? 9.2 : 5.6;
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

    const response =
      1 - Math.exp(-(length ? 11 : 15) * dt);

    const v = velocity.current;

    v.x += (targetX - v.x) * response;
    v.y += (targetZ - v.y) * response;

    if (
      inputLocked ||
      (!length && v.lengthSq() < 0.0009)
    ) {
      v.set(0, 0);
    }

    // Maintain the existing wall and prop collisions.
    if (
      !blocked(
        position.current.x + v.x * dt,
        position.current.z
      )
    ) {
      position.current.x += v.x * dt;
    } else {
      v.x = 0;
    }

    if (
      !blocked(
        position.current.x,
        position.current.z + v.y * dt
      )
    ) {
      position.current.z += v.y * dt;
    } else {
      v.y = 0;
    }

    const actualSpeed = v.length();

    // Character rotation.
    if (actualSpeed > 0.15 && actor.current) {
      const target = Math.atan2(v.x, v.y);

      const diff = Math.atan2(
        Math.sin(target - actor.current.rotation.y),
        Math.cos(target - actor.current.rotation.y)
      );

      actor.current.rotation.y +=
        diff * (1 - Math.exp(-12 * dt));
    }

    // Jump buffering and gravity.
    jumpBuffer.current = Math.max(
      0,
      jumpBuffer.current - dt
    );

    coyote.current = grounded.current
      ? 0.1
      : Math.max(0, coyote.current - dt);

    if (
      !inputLocked &&
      jumpBuffer.current > 0 &&
      coyote.current > 0
    ) {
      upwardSpeed.current =
        cityEvent === 'low-gravity'
          ? 9
          : 7.8;

      grounded.current = false;
      coyote.current = 0;
      jumpBuffer.current = 0;
    }

    if (!grounded.current) {
      upwardSpeed.current -=
        (
          cityEvent === 'low-gravity'
            ? 6
            : 19
        ) * dt;

      position.current.y +=
        upwardSpeed.current * dt;

      if (position.current.y <= 0) {
        position.current.y = 0;
        upwardSpeed.current = 0;
        grounded.current = true;
      }
    }

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
        emote ? -0.35 : swing,
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
          ? Math.abs(Math.sin(walkCycle.current)) *
            0.045 *
            walkBlend.current
          : 0,
        12,
        dt
      );
    }

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
    const pitch = orbitPitch.current;

    cameraDirection.current.set(
      Math.sin(cameraYaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(cameraYaw) * Math.cos(pitch)
    );

    // NEW: Check buildings between the player and camera.
    const allowed = safeCameraDistance(
      focus.current,
      cameraDirection.current,
      orbit.current.zoom
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
          },
        })
      );

      reporting.current = 0;
    }
  });

  return (
    <group ref={actor}>
      <group ref={model}>
        {/* Shirt */}
        <mesh position={[0, 1.13, 0]} castShadow>
          <boxGeometry args={[0.95, 1.32, 0.6]} />
          <meshStandardMaterial color={shirtColor} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 2.15, 0]} castShadow>
          <sphereGeometry args={[0.58, 12, 9]} />
          <meshStandardMaterial color="#f5c68f" />
        </mesh>

        {/* Hair */}
        <mesh position={[0, 2.58, 0]} castShadow>
          <sphereGeometry
            args={[
              0.57,
              10,
              7,
              0,
              Math.PI * 2,
              0,
              Math.PI / 2,
            ]}
          />
          <meshStandardMaterial color="#463c43" />
        </mesh>

        {/* Eyes */}
        {[-0.23, 0.23].map((x) => (
          <mesh key={x} position={[x, 2.24, 0.51]}>
            <sphereGeometry args={[0.065, 8, 8]} />
            <meshBasicMaterial color="#1c2633" />
          </mesh>
        ))}

        {/* Arms */}
        {[-1, 1].map((side) => (
          <group
            key={`arm-${side}`}
            ref={
              side === -1
                ? leftArm
                : rightArm
            }
            position={[side * 0.65, 1.65, 0]}
          >
            <mesh position={[0, -0.55, 0]} castShadow>
              <boxGeometry args={[0.28, 1.16, 0.37]} />
              <meshStandardMaterial color="#f5c68f" />
            </mesh>
          </group>
        ))}

        {/* Legs */}
        {[-1, 1].map((side) => (
          <group
            key={`leg-${side}`}
            ref={
              side === -1
                ? leftLeg
                : rightLeg
            }
            position={[side * 0.26, 0.73, 0]}
          >
            <mesh position={[0, -0.38, 0]} castShadow>
              <boxGeometry args={[0.35, 0.73, 0.47]} />
              <meshStandardMaterial color="#243353" />
            </mesh>
          </group>
        ))}

        {/* Cosmetic accessories */}
        {equipped !== 'none' && (
          <group position={[0, 2.95, 0]}>
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
