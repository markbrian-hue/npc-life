# NPC LIFE — NYC Expanded Megacity (playable map milestone)

## Source and branch safety
- **Feature branch:** `feat/nyc-expanded-megacity`
- **Built from:** `feat/nyc-districts-streetscape` at `26f7155a38c24ea15444fe28ac6b23372a116d4c`
- **Review:** this is a stacked pull request into the previous NYC branch, not an unsolicited merge into `main`.
- No existing save version, key, item, career, garage, player control, vehicle catalog, mission coordinate, or multiplayer room schema has been deleted.

## Meaningful world changes
- World coordinate bounds are now **±340 m**, up from ±210 m. Northern expansion occupies approximately x=-156..+296 and z=-340..-192; old gameplay remains at its prior coordinates.
- The new `shared/nycExpansion.mjs` is the data-only source for **16 new road segments**, **80 proposed building parcels**, a central plaza, park, accessible riverside promenade, neighborhoods, pedestrian crossings and corner street signs.
- 9 parallel avenues and 4 cross streets meet each other in a continuous rectangular grid. Three connectors align the new roads with the existing Northgate campus road, bypass and Eastbank loop. The road render, road collision gate, lane markings, building footprint gate and minimap all share `ROAD_SEGMENTS`.
- Dense skyscrapers, brownstones, prewar apartments and financial offices use the exact world building records used for player collision and roof landing. The original civic area also becomes a more recognizable Lower Manhattan district, while Grove Street's small homes stay recognizable.
- `NYCExpansionWorld` renders neon marquees, continuous concrete city-block ground, a plaza, planted park, authentic sidewalk street-name posts, shoreline rail, and water plane. The river is also inaccessible in the player collision function; there is no illusion of a bridge or walkable water.
- Five additional **moving NYC taxis and city vehicles** use a separate continuous 500 m-class traffic route along actual avenue and cross-street asphalt. Existing traffic and its route are retained unchanged.
- The existing city journal/minimap updates to the same 340 m world extent. Extended rooftop ladder anchors provide real 3D traversal.
- Street signs, trees and signals are filtered by the shared road clearance and occupied-building gates and have solid player collision wherever represented as physical posts.

## Current boundaries
- **NYC-inspired** original blocks, NOT an exact map of Manhattan, Times Square, Fifth Avenue or Brooklyn.
- Buildings are exterior shells, not enterable interiors. Subway entrances, rooftop missions and multi-route taxi passenger jobs are not yet implemented.
- Kinematic player physics, vehicle swept hulls, roof support and optional multiplayer presence continue to use the prior implementation. There is no complete rigid-body simulation.
- More distant architecture uses the existing near/far chunk culling to minimize draw calls, but a performance pass on actual low-end laptops and mobile browsers remains necessary.

## Install and run in VS Code
```bash
git fetch origin
git switch --track origin/feat/nyc-expanded-megacity
npm ci
npm test
npm run dev
```

If you already have a local branch with the same name, run `git switch feat/nyc-expanded-megacity && git pull`. Keep uncommitted local changes backed up or stashed before switching.

To explore from the original spawn, follow the north avenue to the campus, then continue onto the Manhattan grid at z=-219, -263 and -307. The minimap and district labels show the new blocks.

## Validation
`tests/nyc-map.test.mjs` checks street connectivity, world boundaries, skyline collisions, park accessibility, river barriers, traffic continuity, real roof surfaces and preserved objectives.
`tests/vertical-traversal-browser.mjs` checks live Chromium scene objects, rooftop traversal and a relocation into the new Midtown city.
CI workflows run unit regression tests, TypeScript/Vite production build and a separate actual Chrome/SwiftShader smoke suite.

## Next iterations
1. A real metro system and stations integrated into the city loop.
2. GPS/nav routing and additional borough-specific NPC routes and jobs.
3. Physically functional interiors with doors, queues, and jobs.
4. Rooftop courier tasks and meaningful neighborhoods, not just more art.
5. GPU memory and browser performance profiling before merging to a production branch.
