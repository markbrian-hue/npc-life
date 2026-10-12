import { DISTRICTS } from './campaign';
import { WORLD_RADIUS, GROVE } from './world';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  BUILDINGS,
  FOUNTAIN,
  BUS_STOP,
  TREES,
} from './world';

type Location = {
  x: number;
  z: number;
  heading: number;
};

const markers = DISTRICTS.map(d => ({ ...d, label: d.name, fill: d.color }));

// Use the same world bounds as collision and the full city journal.
const unit = 336 / (WORLD_RADIUS * 2);
const scale = (worldCoordinate: number) =>
  (worldCoordinate + WORLD_RADIUS) * unit;

export function WorldMinimap({ target }: { target: { x: number; z: number } }) {
  const [player, setPlayer] = useState<Location>({
    x: 0,
    z: 0,
    heading: 0,
  });

  const [mount, setMount] = useState<Element | null>(
    null
  );

  const [showLabels, setShowLabels] = useState(false);

  // Render inside the game so dialogue modals
  // correctly appear on top of the minimap.
  useEffect(() => {
    setMount(
      document.querySelector('.game-shell')
    );
  }, []);

  // Receive position updates from Player.tsx.
  useEffect(() => {
    const update = (event: Event) => {
      const { detail } =
        event as CustomEvent<Location>;

      if (
        !detail ||
        !Number.isFinite(detail.x) ||
        !Number.isFinite(detail.z)
      ) {
        return;
      }

      setPlayer(detail);
    };

    window.addEventListener(
      'npc-life:position',
      update
    );

    return () => {
      window.removeEventListener(
        'npc-life:position',
        update
      );
    };
  }, []);

  const playerX = scale(player.x);
  const playerY = scale(player.z);

  return mount
    ? createPortal(
        <aside
          className="alpha8-minimap"
          aria-label="Accurate map of Idiot City"
        >
          <div className="alpha8-map-top">
            <strong>
              IDIOT CITY <span>LIVE</span>
            </strong>

            <button
              type="button"
              aria-pressed={showLabels}
              onClick={() =>
                setShowLabels((value) => !value)
              }
              title="Toggle landmark labels"
            >
              {showLabels
                ? 'Labels ON'
                : 'Labels'}
            </button>
          </div>

          <svg
            viewBox="0 0 336 336"
            role="img"
            aria-label="City roads, buildings and player location"
          >
            {/* Grass */}
            <rect
              width="336"
              height="336"
              fill="#94b58d"
            />

            {/* Crossroads */}
            <path
              d="M 0 168 H 336 M 168 0 V 336"
              stroke="#616a77"
              strokeWidth={8.5 * unit}
            />

            {/* Plaza */}
            <circle
              cx="168"
              cy="168"
              r={8.3 * unit}
              fill="#e4d1ac"
              stroke="#bea27e"
              strokeWidth="3"
            />

            {/* Road lane markings */}
            <path
              d="M0 168H336M168 0V336"
              stroke="#e8dcae"
              strokeWidth="1"
              strokeDasharray="7 7"
            />

            <path d={`M ${scale(GROVE.x)} 168 V ${scale(GROVE.z)} H 168`} fill="none" stroke="#566c69" strokeWidth={8.5 * unit} />
          <circle cx={scale(GROVE.x)} cy={scale(GROVE.z)} r={12 * unit} fill="#566c69" />
          <text x={scale(GROVE.x)} y={scale(GROVE.z)-17} textAnchor="middle" fontSize="10" fill="#fff4d6">GROVE ST.</text>
          <circle cx="168" cy="168" r={12 * unit} fill="#566c69" />
          <circle cx="168" cy="168" r={5.5 * unit} fill="#84997a" />
          {/* Actual building footprints */}
            {BUILDINGS.map((building, index) => (
              <rect
                key={index}
                transform={`rotate(${-(building.rotation || 0)*180/Math.PI} ${scale(building.x)} ${scale(building.z)})`}
                x={scale(
                  building.x - building.w / 2
                )}
                y={scale(
                  building.z - building.d / 2
                )}
                width={building.w * unit}
                height={building.d * unit}
                rx="2.5"
                fill={building.roof}
                stroke="#263e4a"
                strokeWidth="2"
              >
                <title>
                  {`Building ${index + 1}`}
                </title>
              </rect>
            ))}

            {/* Real tree locations */}
            {TREES.map((tree, index) => (
              <circle
                key={index}
                cx={scale(tree.x)}
                cy={scale(tree.z)}
                r="3.2"
                fill="#3b704b"
              />
            ))}

            {/* Fountain */}
            <circle
              cx={scale(FOUNTAIN.x)}
              cy={scale(FOUNTAIN.z)}
              r={2.35 * unit}
              fill="#6cbdc5"
              stroke="#eaf5e9"
              strokeWidth="1.5"
            >
              <title>Fountain</title>
            </circle>

            {/* Bus stop */}
            <rect
              x={scale(BUS_STOP.x) - 6}
              y={scale(BUS_STOP.z) - 3}
              width="12"
              height="6"
              rx="2"
              fill="#546c7b"
            >
              <title>Bus stop</title>
            </rect>

            {/* NPC and landmark markers */}
            {markers.map((mark) => (
              <g key={mark.id}>
                <circle
                  cx={scale(mark.x)}
                  cy={scale(mark.z)}
                  r="6"
                  fill={mark.fill}
                  stroke="#1f3044"
                  strokeWidth="1.6"
                >
                  <title>{mark.label}</title>
                </circle>

                {showLabels && (
                  <text
                    x={scale(mark.x) + 7}
                    y={scale(mark.z) - 7}
                    fontSize="10"
                    fontWeight="800"
                    fill="#172734"
                    stroke="#e8f1e8"
                    strokeWidth="2.5"
                    paintOrder="stroke"
                  >
                    {mark.label}
                  </text>
                )}
              </g>
            ))}

            <path d={`M${playerX} ${playerY} L${scale(target.x)} ${scale(target.z)}`} stroke="#fce18b" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx={scale(target.x)} cy={scale(target.z)} r="8" fill="none" stroke="#ffe9a8" strokeWidth="3" />
            {/* Live player location and heading */}
            <g
              transform={`translate(${playerX}, ${playerY}) rotate(${
                180 -
                player.heading * 180 / Math.PI
              })`}
            >
              <circle
                r="9"
                fill="#fff4c3"
                opacity="0.55"
              />

              <path
                d="M 0 -8 L 6.3 6 L 0 3.6 L -6.3 6 Z"
                fill="#f1cb54"
                stroke="#253042"
                strokeWidth="1.8"
              />
            </g>
          </svg>

          <div className="alpha8-map-bottom">
            <span>
              YOU • X {Math.round(player.x)} / Z{' '}
              {Math.round(player.z)}
            </span>

            <span>↑ -Z</span>
          </div>
        </aside>,
        mount
      )
    : null;
}
