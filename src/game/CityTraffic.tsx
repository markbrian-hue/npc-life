
import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CarModel } from './CityProps';

const CYCLE_SECONDS = 18;

const isGreen = (seconds: number) =>
  seconds % CYCLE_SECONDS >= 8;

type Route = {
  id: string;
  axis: 'x' | 'z';
  lane: number;
  outer: number;
  inner: number;
  color: string;
  speed: number;
};

// All routes end before the central pedestrian plaza.
const ROUTES: Route[] = [
  {
    id: 'west',
    axis: 'x',
    lane: -2.1,
    outer: -39,
    inner: -13,
    color: '#aa715e',
    speed: 3.2,
  },
  {
    id: 'east',
    axis: 'x',
    lane: 2.1,
    outer: 39,
    inner: 13,
    color: '#5d8298',
    speed: 2.8,
  },
  {
    id: 'south',
    axis: 'z',
    lane: 2.1,
    outer: -39,
    inner: -13,
    color: '#bbb06e',
    speed: 3.0,
  },
  {
    id: 'north',
    axis: 'z',
    lane: -2.1,
    outer: 39,
    inner: 13,
    color: '#9b719c',
    speed: 2.7,
  },
];

function TrafficVehicle({
  route,
  index,
}: {
  route: Route;
  index: number;
}) {
  const vehicle = useRef<THREE.Group>(null);
  const progress = useRef(index % 2 ? 0.5 : 0.06);
  const towardsPlaza = useRef(true);
  const waiting = useRef(0);

  useFrame(({ clock }, rawDelta) => {
    const group = vehicle.current;
    if (!group) return;

    const delta = Math.min(rawDelta, 0.05);
    const green = isGreen(clock.elapsedTime);

    if (waiting.current > 0) {
      waiting.current -= delta;
    } else {
      const redStop =
        !green &&
        towardsPlaza.current &&
        progress.current > 0.87;

      if (!redStop) {
        progress.current +=
          (towardsPlaza.current ? 1 : -1) *
          (route.speed * delta / Math.abs(route.inner - route.outer));
      }

      if (progress.current >= 1) {
        progress.current = 1;
        towardsPlaza.current = false;
        waiting.current = 0.9;
      }

      if (progress.current <= 0) {
        progress.current = 0;
        towardsPlaza.current = true;
        waiting.current = 0.8;
      }
    }

    const coordinate = THREE.MathUtils.lerp(
      route.outer,
      route.inner,
      progress.current
    );

    group.position.set(
      route.axis === 'x' ? coordinate : route.lane,
      0,
      route.axis === 'z' ? coordinate : route.lane
    );

    const direction =
      Math.sign(route.inner - route.outer) *
      (towardsPlaza.current ? 1 : -1);

    const heading =
      route.axis === 'x'
        ? direction > 0 ? 0 : Math.PI
        : direction > 0 ? -Math.PI / 2 : Math.PI / 2;

    const angle = Math.atan2(
      Math.sin(heading - group.rotation.y),
      Math.cos(heading - group.rotation.y)
    );

    group.rotation.y +=
      angle * (1 - Math.exp(-8 * delta));
  });

  return (
    <group ref={vehicle}>
      <CarModel color={route.color} />
    </group>
  );
}

function TrafficSignal({
  x, z,
}: {
  x: number;
  z: number;
}) {
  const red = useRef<THREE.MeshStandardMaterial>(null);
  const green = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const active = isGreen(clock.elapsedTime);

    if (red.current) {
      red.current.emissiveIntensity = active ? 0 : 1.8;
    }

    if (green.current) {
      green.current.emissiveIntensity = active ? 1.8 : 0;
    }
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2.15, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 4.3, 8]} />
        <meshStandardMaterial color="#3e494d" />
      </mesh>

      <mesh position={[0, 4.26, 0.15]} castShadow>
        <boxGeometry args={[0.72, 1.3, 0.4]} />
        <meshStandardMaterial color="#222d32" />
      </mesh>

      <mesh position={[0, 4.57, 0.39]}>
        <sphereGeometry args={[0.18, 12, 8]} />
        <meshStandardMaterial
          ref={red}
          color="#e15c50"
          emissive="#e15c50"
          emissiveIntensity={1.8}
        />
      </mesh>

      <mesh position={[0, 3.98, 0.39]}>
        <sphereGeometry args={[0.18, 12, 8]} />
        <meshStandardMaterial
          ref={green}
          color="#4bb277"
          emissive="#4bb277"
          emissiveIntensity={0}
        />
      </mesh>
    </group>
  );
}

function StreetSign({
  x, z, label,
}: {
  x: number;
  z: number;
  label: string;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;

    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#42675d';
      ctx.fillRect(0, 0, 512, 160);

      ctx.strokeStyle = '#f5f1db';
      ctx.lineWidth = 9;
      ctx.strokeRect(8, 8, 496, 144);

      ctx.fillStyle = '#fff9e7';
      ctx.font = 'bold 49px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 256, 81, 460);
    }

    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    return result;
  }, [label]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.75, 0]}>
        <cylinderGeometry args={[0.075, 0.095, 3.5, 8]} />
        <meshStandardMaterial color="#5b666a" />
      </mesh>

      <mesh position={[0, 3.12, 0]}>
        <boxGeometry args={[2.7, 0.85, 0.13]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.86}
        />
      </mesh>
    </group>
  );
}

export function CityTraffic() {
  return (
    <>
      {ROUTES.map((route, index) => (
        <TrafficVehicle
          key={route.id}
          route={route}
          index={index}
        />
      ))}

      <TrafficSignal x={-10} z={-9} />
      <TrafficSignal x={10} z={9} />

      <StreetSign
        x={-10.5}
        z={28}
        label="NPC AVENUE"
      />
      <StreetSign
        x={30}
        z={10}
        label="NO THINKING"
      />
    </>
  );
}
