import {StreetDetail} from './StreetDetail';
import {CityArchitecture} from './CityArchitecture';
import { CityTrees } from './CityTrees';
import { CityInfrastructure } from './CityInfrastructure';
import { Character } from './Character';
import { GroveNeighborhood } from './GroveNeighborhood';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DirectionalLight, Object3D } from 'three';

import {
  BENCHES, BUILDINGS, GARY, LAMP_POSTS,
  PIGEONS, PLANTERS, type BuildingDef,
} from './world';

import {
  Bench, StreetLamp, Planter, BusStop, Fountain,
  Bin, Hydrant,
} from './CityProps';



function Pigeon({
  x, z,
}: {
  x: number;
  z: number;
}) {
  return (
    <group position={[x, 0.43, z]}>
      <mesh castShadow>
        <sphereGeometry args={[0.37, 10, 8]} />
        <meshStandardMaterial color="#98abb6" flatShading />
      </mesh>

      <mesh castShadow position={[0, 0.25, 0.18]}>
        <sphereGeometry args={[0.23, 9, 7]} />
        <meshStandardMaterial color="#ccd8df" />
      </mesh>

      <mesh position={[0, 0.22, 0.46]} rotation={[0.35, 0, 0]}>
        <coneGeometry args={[0.11, 0.25, 4]} />
        <meshStandardMaterial color="#edaf55" />
      </mesh>

      {[-0.16, 0.16].map((offset) => (
        <mesh key={offset} position={[offset, 0.36, 0.35]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color="#1b2227" />
        </mesh>
      ))}
    </group>
  );
}

function GaryNPC() {
  return (
    <group position={[GARY.x, 0, GARY.z]}>
      <Character shirt="#df8c5a" hair="#62534d" style={2} />
      <mesh position={[0, 3.52, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.35, 0.8, 6]} />
        <meshStandardMaterial
          color="#ffe16d"
          emissive="#c37b10"
          emissiveIntensity={0.35}
        />
      </mesh>

    </group>
  );
}

export const City = memo(function City({ caught,quality='medium' }: { caught: number[];quality?:string }) {
  return (
    <>


      <CityInfrastructure />
      <StreetDetail/>

      <CityArchitecture/>

      <CityTrees quality={quality}/>

      {BENCHES.map((bench) => (
        <Bench
          key={`${bench.x}-${bench.z}`}
          {...bench}
        />
      ))}

      {LAMP_POSTS.map((lamp) => (
        <StreetLamp
          key={`${lamp.x}-${lamp.z}`}
          {...lamp}
        />
      ))}

      {PLANTERS.map((planter) => (
        <Planter
          key={`${planter.x}-${planter.z}`}
          {...planter}
        />
      ))}

      <BusStop />
      <Fountain />

      <Bin x={-11} z={-8.5} />
      <Bin x={29} z={9} />

      <Hydrant x={-10} z={8.5} />
      <Hydrant x={11} z={-8.5} />

      <GroveNeighborhood />

      <GaryNPC />

      {PIGEONS.map((pigeon, index) =>
        caught.includes(index) ? null : (
          <Pigeon key={index} {...pigeon} />
        )
      )}
    </>
  );
});
