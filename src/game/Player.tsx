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
  inputLocked: boolean;
}

const WALK_SPEED = 5.6;
const RUN_SPEED = 9.2;
const MOVEMENT_RESPONSE = 11;
const STOP_RESPONSE = 15;
const TURN_RESPONSE = 12;
const CAMERA_FOLLOW_RESPONSE = 9;
const CAMERA_POSITION_RESPONSE = 8;
const GROUND_GRAVITY = 19;
const LOW_GRAVITY = 6;
const JUMP_SPEED = 7.8;
const LOW_GRAVITY_JUMP_SPEED = 9;
const JUMP_BUFFER_SECONDS = 0.12;
const COYOTE_SECONDS = 0.1;

export function Player({
  onMove,
  equipped,
  emote,
  cityEvent,
  inputLocked,
}: PlayerProps) {
  const actor = useRef<THREE.Group>(null);
  const visual = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);

  const pressedKeys = useRef(new Set<string>());
  const position = useRef(new THREE.Vector3());
  const movementVelocity = useRef(new THREE.Vector2());
  const verticalVelocity = useRef(0);
  const isGrounded = useRef(true);
  const jumpBuffer = useRef(0);
  const coyoteTimer = useRef(COYOTE_SECONDS);
  const walkCycle = useRef(0);
  const walkBlend = useRef(0);
  const reportTimer = useRef(0);

  const orbit = useRef({
    yaw: 0.6,
    pitch: 0.65,
    zoom: 13,
  });

  const activeDragPointer = useRef<number | null>(null);
  const cameraFocus = useRef(new THREE.Vector3(0, 1.7, 0));
  const desiredFocus = useRef(new THREE.Vector3());
  const desiredCamera = useRef(new THREE.Vector3());

  const { camera, gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    const endDragging = () => {
      const pointerId = activeDragPointer.current;

      if (
        pointerId !== null &&
        canvas.hasPointerCapture(pointerId)
      ) {
        canvas.releasePointerCapture(pointerId);
      }

      activeDragPointer.current = null;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (
        inputLocked ||
        (event.button !== 0 && event.button !== 2)
      ) {
        return;
      }

      activeDragPointer.current = event.pointerId;
      canvas.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (
        inputLocked ||
        activeDragPointer.current !== event.pointerId
      ) {
        return;
      }

      orbit.current.yaw -= event.movementX * 0.005;

      orbit.current.pitch = THREE.MathUtils.clamp(
        orbit.current.pitch - event.movementY * 0.0035,
        0.2,
        1.3
      );
    };

    const onPointerUp = (event: PointerEvent) => {
      if (activeDragPointer.current === event.pointerId) {
        endDragging();
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (inputLocked) return;

      event.preventDefault();

      orbit.current.zoom = THREE.MathUtils.clamp(
        orbit.current.zoom + event.deltaY * 0.01,
        5.5,
        20
      );
    };

    const onContextMenu = (event: MouseEvent) => {
      if (!inputLocked) {
        event.preventDefault();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
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

      if (event.code === 'Space' && !event.repeat) {
        jumpBuffer.current = JUMP_BUFFER_SECONDS;
      }

      pressedKeys.current.add(event.code);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      pressedKeys.current.delete(event.code);
    };

    const onBlur = () => {
      pressedKeys.current.clear();
      jumpBuffer.current = 0;
      endDragging();
    };

    if (inputLocked) {
      pressedKeys.current.clear();
      jumpBuffer.current = 0;
      movementVelocity.current.set(0, 0);
      endDragging();
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, {
      passive: false,
    });
    canvas.addEventListener('contextmenu', onContextMenu);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      endDragging();

      canvas.removeEventListener(
        'pointerdown',
        onPointerDown
      );
      canvas.removeEventListener(
        'pointermove',
        onPointerMove
      );
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener(
        'pointercancel',
        onPointerUp
      );
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener(
        'contextmenu',
        onContextMenu
      );

      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [gl, inputLocked]);

  useFrame(({ clock }, frameDelta) => {
    const delta = Math.min(frameDelta, 0.05);
    const keys = pressedKeys.current;

    const sideways = inputLocked
      ? 0
      : Number(
          keys.has('KeyD') || keys.has('ArrowRight')
        ) -
        Number(
          keys.has('KeyA') || keys.has('ArrowLeft')
        );

    const forwards = inputLocked
      ? 0
      : Number(
          keys.has('KeyW') || keys.has('ArrowUp')
        ) -
        Number(
          keys.has('KeyS') || keys.has('ArrowDown')
        );

    const running =
      !inputLocked &&
      (keys.has('ShiftLeft') || keys.has('ShiftRight'));

    const yaw = orbit.current.yaw;
    const length = Math.hypot(sideways, forwards);
    const speed = running ? RUN_SPEED : WALK_SPEED;

    // W moves away from the camera.
    const targetX = length
      ? (
          (Math.cos(yaw) * sideways -
            Math.sin(yaw) * forwards) /
          length
        ) * speed
      : 0;

    const targetZ = length
      ? (
          (-Math.sin(yaw) * sideways -
            Math.cos(yaw) * forwards) /
          length
        ) * speed
      : 0;

    // Smoothly approach the desired velocity.
    const velocity = movementVelocity.current;
    const response = length
      ? MOVEMENT_RESPONSE
      : STOP_RESPONSE;

    const velocityBlend =
      1 - Math.exp(-response * delta);

    velocity.x +=
      (targetX - velocity.x) * velocityBlend;

    velocity.y +=
      (targetZ - velocity.y) * velocityBlend;

    if (
      inputLocked ||
      (!length && velocity.lengthSq() < 0.0009)
    ) {
      velocity.set(0, 0);
    }

    // Axis-by-axis collision allows wall sliding.
    const stepX = velocity.x * delta;
    const stepZ = velocity.y * delta;

    if (
      !blocked(
        position.current.x + stepX,
        position.current.z
      )
    ) {
      position.current.x += stepX;
    } else {
      velocity.x = 0;
    }

    if (
      !blocked(
        position.current.x,
        position.current.z + stepZ
      )
    ) {
      position.current.z += stepZ;
    } else {
      velocity.y = 0;
    }

    const actualSpeed = velocity.length();

    // Smooth shortest-path character rotation.
    if (actualSpeed > 0.15 && actor.current) {
      const targetHeading = Math.atan2(
        velocity.x,
        velocity.y
      );

      const error = Math.atan2(
        Math.sin(
          targetHeading - actor.current.rotation.y
        ),
        Math.cos(
          targetHeading - actor.current.rotation.y
        )
      );

      actor.current.rotation.y +=
        error *
        (1 - Math.exp(-TURN_RESPONSE * delta));
    }

    // Buffered jumping and forgiving ground timing.
    jumpBuffer.current = Math.max(
      0,
      jumpBuffer.current - delta
    );

    coyoteTimer.current = isGrounded.current
      ? COYOTE_SECONDS
      : Math.max(
          0,
          coyoteTimer.current - delta
        );

    if (
      !inputLocked &&
      jumpBuffer.current > 0 &&
      coyoteTimer.current > 0
    ) {
      verticalVelocity.current =
        cityEvent === 'low-gravity'
          ? LOW_GRAVITY_JUMP_SPEED
          : JUMP_SPEED;

      isGrounded.current = false;
      coyoteTimer.current = 0;
      jumpBuffer.current = 0;
    }

    const gravity =
      cityEvent === 'low-gravity'
        ? LOW_GRAVITY
        : GROUND_GRAVITY;

    if (!isGrounded.current) {
      verticalVelocity.current -= gravity * delta;

      position.current.y +=
        verticalVelocity.current * delta;

      if (position.current.y <= 0) {
        position.current.y = 0;
        verticalVelocity.current = 0;
        isGrounded.current = true;
      }
    }

    // Frame-rate-independent animation blending.
    const blendTarget = THREE.MathUtils.clamp(
      actualSpeed / WALK_SPEED,
      0,
      1
    );

    walkBlend.current = THREE.MathUtils.damp(
      walkBlend.current,
      blendTarget,
      11,
      delta
    );

    walkCycle.current +=
      actualSpeed * delta * 1.65;

    const gait = Math.sin(walkCycle.current);

    const legSwing =
      gait *
      walkBlend.current *
      (running ? 0.72 : 0.55);

    const armSwing =
      gait * walkBlend.current * 0.38;

    const legLeftTarget = isGrounded.current
      ? legSwing
      : -0.25;

    const legRightTarget = isGrounded.current
      ? -legSwing
      : 0.25;

    if (leftLeg.current) {
      leftLeg.current.rotation.x =
        THREE.MathUtils.damp(
          leftLeg.current.rotation.x,
          legLeftTarget,
          14,
          delta
        );
    }

    if (rightLeg.current) {
      rightLeg.current.rotation.x =
        THREE.MathUtils.damp(
          rightLeg.current.rotation.x,
          legRightTarget,
          14,
          delta
        );
    }

    if (leftArm.current) {
      leftArm.current.rotation.x =
        THREE.MathUtils.damp(
          leftArm.current.rotation.x,
          -armSwing,
          12,
          delta
        );
    }

    if (rightArm.current) {
      rightArm.current.rotation.x =
        THREE.MathUtils.damp(
          rightArm.current.rotation.x,
          emote ? -0.35 : armSwing,
          12,
          delta
        );

      rightArm.current.rotation.z =
        THREE.MathUtils.damp(
          rightArm.current.rotation.z,
          emote
            ? 2.2 +
                Math.sin(clock.elapsedTime * 12) * 0.18
            : 0,
          15,
          delta
        );
    }

    if (visual.current) {
      const bob = isGrounded.current
        ? Math.abs(Math.sin(walkCycle.current)) *
          0.045 *
          walkBlend.current
        : 0;

      visual.current.position.y =
        THREE.MathUtils.damp(
          visual.current.position.y,
          bob,
          12,
          delta
        );
    }

    if (actor.current) {
      actor.current.position.copy(position.current);
    }

    // Smooth both the camera focus and camera position.
    desiredFocus.current.set(
      position.current.x,
      position.current.y + 1.7,
      position.current.z
    );

    cameraFocus.current.lerp(
      desiredFocus.current,
      1 -
        Math.exp(
          -CAMERA_FOLLOW_RESPONSE * delta
        )
    );

    const { pitch, zoom } = orbit.current;

    desiredCamera.current.set(
      cameraFocus.current.x +
        Math.sin(yaw) * Math.cos(pitch) * zoom,
      cameraFocus.current.y +
        Math.sin(pitch) * zoom,
      cameraFocus.current.z +
        Math.cos(yaw) * Math.cos(pitch) * zoom
    );

    camera.position.lerp(
      desiredCamera.current,
      1 -
        Math.exp(
          -CAMERA_POSITION_RESPONSE * delta
        )
    );

    camera.lookAt(cameraFocus.current);

    // Report player position to the HUD/minimap.
    reportTimer.current += delta;

    if (reportTimer.current >= 0.12) {
      onMove({
        x: position.current.x,
        z: position.current.z,
      });

      reportTimer.current = 0;
    }
  });

  const accessoryColor =
    equipped === 'cone'
      ? '#ff9d39'
      : equipped === 'crown'
        ? '#ffd55a'
        : '#76e8dd';

  return (
    <group ref={actor}>
      <group ref={visual}>
        {/* Body */}
        <mesh position={[0, 1.13, 0]} castShadow>
          <boxGeometry args={[0.95, 1.32, 0.6]} />
          <meshStandardMaterial color="#4967ee" />
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
          <mesh
            key={x}
            position={[x, 2.24, 0.51]}
          >
            <sphereGeometry args={[0.065, 8, 8]} />
            <meshBasicMaterial color="#1c2633" />
          </mesh>
        ))}

        {/* Left arm - shoulder pivot */}
        <group
          ref={leftArm}
          position={[-0.65, 1.65, 0]}
        >
          <mesh
            position={[0, -0.55, 0]}
            castShadow
          >
            <boxGeometry args={[0.28, 1.16, 0.37]} />
            <meshStandardMaterial color="#f5c68f" />
          </mesh>
        </group>

        {/* Right arm - shoulder pivot */}
        <group
          ref={rightArm}
          position={[0.65, 1.65, 0]}
        >
          <mesh
            position={[0, -0.55, 0]}
            castShadow
          >
            <boxGeometry args={[0.28, 1.16, 0.37]} />
            <meshStandardMaterial color="#f5c68f" />
          </mesh>
        </group>

        {/* Left leg - hip pivot */}
        <group
          ref={leftLeg}
          position={[-0.26, 0.73, 0]}
        >
          <mesh
            position={[0, -0.38, 0]}
            castShadow
          >
            <boxGeometry args={[0.35, 0.73, 0.47]} />
            <meshStandardMaterial color="#243353" />
          </mesh>
        </group>

        {/* Right leg - hip pivot */}
        <group
          ref={rightLeg}
          position={[0.26, 0.73, 0]}
        >
          <mesh
            position={[0, -0.38, 0]}
            castShadow
          >
            <boxGeometry args={[0.35, 0.73, 0.47]} />
            <meshStandardMaterial color="#243353" />
          </mesh>
        </group>

        {/* Alpha 0.2 cosmetics */}
        {equipped !== 'none' && (
          <group position={[0, 2.95, 0]}>
            {equipped === 'cone' ? (
              <mesh castShadow>
                <coneGeometry args={[0.5, 1.25, 5]} />
                <meshStandardMaterial
                  color={accessoryColor}
                />
              </mesh>
            ) : equipped === 'crown' ? (
              <>
                <mesh castShadow>
                  <cylinderGeometry
                    args={[0.46, 0.49, 0.26, 8]}
                  />
                  <meshStandardMaterial
                    color={accessoryColor}
                    metalness={0.4}
                  />
                </mesh>

                {Array.from(
                  { length: 6 },
                  (_, index) => (
                    <mesh
                      key={index}
                      position={[
                        Math.sin(
                          index * Math.PI / 3
                        ) * 0.35,
                        0.26,
                        Math.cos(
                          index * Math.PI / 3
                        ) * 0.35,
                      ]}
                    >
                      <coneGeometry
                        args={[0.13, 0.4, 4]}
                      />
                      <meshStandardMaterial
                        color={accessoryColor}
                      />
                    </mesh>
                  )
                )}
              </>
            ) : (
              <mesh castShadow>
                <torusGeometry
                  args={[0.48, 0.12, 7, 18]}
                />
                <meshStandardMaterial
                  color={accessoryColor}
                />
              </mesh>
            )}
          </group>
        )}
      </group>
    </group>
  );
}