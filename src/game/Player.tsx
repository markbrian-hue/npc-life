
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { blocked } from './world';

export type PlayerLocation = { x: number; z: number };
export type CityEvent = 'none' | 'low-gravity' | 'duck-invasion';

interface PlayerProps {
  onMove: (position: PlayerLocation) => void;
  equipped: string;
  emote: boolean;
  cityEvent: CityEvent;
}

export function Player({
  onMove,
  equipped,
  emote,
  cityEvent,
}: PlayerProps) {
  const actor = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);

  const keys = useRef(new Set<string>());
  const position = useRef(new THREE.Vector3());
  const verticalSpeed = useRef(0);
  const jumpQueued = useRef(false);
  const walking = useRef(0);
  const reportTime = useRef(0);

  const orbit = useRef({
    yaw: 0.6,
    pitch: 0.65,
    zoom: 13,
  });

  const dragging = useRef(false);
  const { camera, gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    const down = (event: PointerEvent) => {
      if (event.button === 0 || event.button === 2) {
        dragging.current = true;
        canvas.setPointerCapture(event.pointerId);
      }
    };

    const move = (event: PointerEvent) => {
      if (!dragging.current) return;

      orbit.current.yaw -= event.movementX * 0.006;
      orbit.current.pitch = THREE.MathUtils.clamp(
        orbit.current.pitch - event.movementY * 0.004,
        0.18,
        1.25
      );
    };

    const up = (event: PointerEvent) => {
      dragging.current = false;

      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    const wheel = (event: WheelEvent) => {
      event.preventDefault();

      orbit.current.zoom = THREE.MathUtils.clamp(
        orbit.current.zoom + event.deltaY * 0.012,
        6,
        21
      );
    };

    const context = (event: MouseEvent) => event.preventDefault();

    const keyDown = (event: KeyboardEvent) => {
      if (
        ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
          .includes(event.code)
      ) {
        event.preventDefault();
      }

      if (event.code === 'Space' && !event.repeat) {
        jumpQueued.current = true;
      }

      keys.current.add(event.code);
    };

    const keyUp = (event: KeyboardEvent) => {
      keys.current.delete(event.code);
    };

    const blur = () => {
      keys.current.clear();
      dragging.current = false;
    };

    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', wheel, { passive: false });
    canvas.addEventListener('contextmenu', context);

    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', blur);

    return () => {
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
  }, [gl]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const pressed = keys.current;

    const sideways =
      Number(pressed.has('KeyD') || pressed.has('ArrowRight')) -
      Number(pressed.has('KeyA') || pressed.has('ArrowLeft'));

    const forwards =
      Number(pressed.has('KeyW') || pressed.has('ArrowUp')) -
      Number(pressed.has('KeyS') || pressed.has('ArrowDown'));

    const moving = sideways !== 0 || forwards !== 0;

    const running =
      pressed.has('ShiftLeft') || pressed.has('ShiftRight');

    const speed = running ? 10.3 : 6.1;
    const length = Math.hypot(sideways, forwards) || 1;
    const yaw = orbit.current.yaw;

    const dx =
      (Math.cos(yaw) * sideways + Math.sin(yaw) * forwards) /
      length;

    const dz =
      (-Math.sin(yaw) * sideways + Math.cos(yaw) * forwards) /
      length;

    const stepX = dx * speed * delta;
    const stepZ = dz * speed * delta;

    if (!blocked(position.current.x + stepX, position.current.z)) {
      position.current.x += stepX;
    }

    if (!blocked(position.current.x, position.current.z + stepZ)) {
      position.current.z += stepZ;
    }

    if (moving && actor.current) {
      const target = Math.atan2(dx, dz);

      actor.current.rotation.y +=
        THREE.MathUtils.euclideanModulo(
          target - actor.current.rotation.y + Math.PI,
          Math.PI * 2
        ) - Math.PI;

      walking.current += delta * (running ? 15 : 10);
    }

    if (leftLeg.current && rightLeg.current) {
      leftLeg.current.rotation.x = moving
        ? Math.sin(walking.current) * 0.55
        : 0;

      rightLeg.current.rotation.x = moving
        ? -Math.sin(walking.current) * 0.55
        : 0;
    }

    if (rightArm.current) {
      rightArm.current.rotation.x = emote
        ? Math.sin(state.clock.elapsedTime * 12) * 0.4 - 2.1
        : moving
          ? Math.sin(walking.current) * 0.35
          : 0;

      rightArm.current.rotation.z = emote ? -0.3 : 0;
    }

    const gravity = cityEvent === 'low-gravity' ? 6 : 19;

    if (jumpQueued.current && position.current.y <= 0.001) {
      verticalSpeed.current =
        cityEvent === 'low-gravity' ? 9 : 7.2;
    }

    jumpQueued.current = false;
    verticalSpeed.current -= gravity * delta;

    position.current.y = Math.max(
      0,
      position.current.y + verticalSpeed.current * delta
    );

    if (position.current.y === 0) {
      verticalSpeed.current = 0;
    }

    if (actor.current) {
      actor.current.position.copy(position.current);
    }

    const cameraTarget = new THREE.Vector3(
      position.current.x,
      position.current.y + 1.7,
      position.current.z
    );

    const { pitch, zoom } = orbit.current;

    const offset = new THREE.Vector3(
      Math.sin(yaw) * Math.cos(pitch) * zoom,
      Math.sin(pitch) * zoom,
      Math.cos(yaw) * Math.cos(pitch) * zoom
    );

    camera.position.lerp(
      cameraTarget.clone().add(offset),
      1 - Math.exp(-7 * delta)
    );

    camera.lookAt(cameraTarget);

    reportTime.current += delta;

    if (reportTime.current > 0.12) {
      onMove({
        x: position.current.x,
        z: position.current.z,
      });

      reportTime.current = 0;
    }
  });

  const hatColor =
    equipped === 'cone'
      ? '#ff9d39'
      : equipped === 'crown'
        ? '#ffd55a'
        : '#76e8dd';

  return (
    <group ref={actor}>
      {/* Body */}
      <mesh position={[0, 1.13, 0]} castShadow>
        <boxGeometry args={[0.95, 1.32, 0.6]} />
        <meshStandardMaterial color="#4967ee" />
      </mesh>

      {/* Face */}
      <mesh position={[0, 2.15, 0]} castShadow>
        <sphereGeometry args={[0.58, 12, 9]} />
        <meshStandardMaterial color="#f5c68f" />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 2.58, 0]} castShadow>
        <sphereGeometry
          args={[0.57, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2]}
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
      <mesh position={[-0.65, 1.1, 0]} castShadow>
        <boxGeometry args={[0.28, 1.16, 0.37]} />
        <meshStandardMaterial color="#f5c68f" />
      </mesh>

      <mesh ref={rightArm} position={[0.65, 1.1, 0]} castShadow>
        <boxGeometry args={[0.28, 1.16, 0.37]} />
        <meshStandardMaterial color="#f5c68f" />
      </mesh>

      {/* Legs */}
      <mesh ref={leftLeg} position={[-0.26, 0.35, 0]} castShadow>
        <boxGeometry args={[0.35, 0.73, 0.47]} />
        <meshStandardMaterial color="#243353" />
      </mesh>

      <mesh ref={rightLeg} position={[0.26, 0.35, 0]} castShadow>
        <boxGeometry args={[0.35, 0.73, 0.47]} />
        <meshStandardMaterial color="#243353" />
      </mesh>

      {/* Equipped accessories */}
      {equipped !== 'none' && (
        <group position={[0, 2.95, 0]}>
          {equipped === 'cone' ? (
            <mesh castShadow>
              <coneGeometry args={[0.5, 1.25, 5]} />
              <meshStandardMaterial color={hatColor} />
            </mesh>
          ) : equipped === 'crown' ? (
            <>
              <mesh castShadow>
                <cylinderGeometry args={[0.46, 0.49, 0.26, 8]} />
                <meshStandardMaterial
                  color={hatColor}
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
                  <meshStandardMaterial color={hatColor} />
                </mesh>
              ))}
            </>
          ) : (
            <mesh castShadow>
              <torusGeometry args={[0.48, 0.12, 7, 18]} />
              <meshStandardMaterial color={hatColor} />
            </mesh>
          )}
        </group>
      )}
    </group>
  );
}
