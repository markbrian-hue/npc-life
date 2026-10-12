
import { GRASS_SPOTS } from './interactions';

export function CityActivities({
  touched,
}: {
  touched: string[];
}) {
  return (
    <>
      {GRASS_SPOTS.map((spot, index) => {
        const completed = touched.includes(spot.id);

        return (
          <group
            key={spot.id}
            position={[spot.x, 0, spot.z]}
          >
            <mesh
              position={[0, 0.015, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <circleGeometry args={[0.85, 16]} />
              <meshStandardMaterial
                color={
                  completed
                    ? '#77967c'
                    : '#539b50'
                }
                roughness={1}
              />
            </mesh>

            {Array.from({ length: 7 }, (_, i) => {
              const angle = (i / 7) * Math.PI * 2;

              return (
                <group
                  key={i}
                  position={[
                    Math.cos(angle) * 0.52,
                    0,
                    Math.sin(angle) * 0.52,
                  ]}
                >
                  <mesh position={[0, 0.18, 0]}>
                    <coneGeometry
                      args={[0.12, 0.38, 4]}
                    />
                    <meshStandardMaterial
                      color={
                        completed
                          ? '#7c9980'
                          : '#438746'
                      }
                    />
                  </mesh>

                  {!completed && i % 2 === 0 && (
                    <mesh position={[0, 0.39, 0]}>
                      <sphereGeometry
                        args={[0.09, 7, 6]}
                      />
                      <meshStandardMaterial
                        color={
                          index % 2
                            ? '#f4d69b'
                            : '#eac6d2'
                        }
                      />
                    </mesh>
                  )}
                </group>
              );
            })}

            {!completed && (
              <mesh position={[0, 1.3, 0]}>
                <octahedronGeometry args={[0.19, 0]} />
                <meshBasicMaterial color="#fff1a0" />
              </mesh>
            )}
          </group>
        );
      })}
    </>
  );
}
