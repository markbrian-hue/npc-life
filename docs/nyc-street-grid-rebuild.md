# NPC LIFE — NYC Street-Grid Reconstruction

Base branch: `feat/nyc-expanded-megacity` (`647337a4e44a412c5ae4cf649bfa18169e923ee3`)  
New branch: `feat/nyc-street-grid-rebuild`

## Why this milestone exists

The earlier expansion placed Manhattan-like blocks north of a starter town, but downtown still contained an unnatural fountain traffic circle, vacant lawns, California-style palms, and isolated-seeming streets. This milestone **replaces that old street geometry in the playable game itself**, rather than only reskinning the minimap.

## Implemented

- **Broadway intersection:** remove the central fountain island from `ROUND_ROADS`, scene art, map pin, source asset and physical center blocker. Link the former north/south and east/west approach roads directly through x=0,z=0. Both player and cars can cross the formerly blocked center. Old discovery save ID `fountain` is deliberately retained internally so past progress survives, but its visible label, dialogue and target are now a safe Broadway sidewalk landmark.
- **Downtown rebuilt:** extend the grid around the existing civic district with parallel local avenues and cross streets. Street meshes, intersections, asphalt marks, sidewalk margins and real collisions all derive from the same shared segment list. Keep legacy job and interactive-site coordinates unchanged.
- **Bigger uptown:** raise world bounds from 340m to 460m radius. Add 11 north-running avenue connections and additional west-side avenues and east-west cross streets. New downtown and uptown zones receive coherent grey urban ground instead of unexplained empty grass.
- **Dense real streets:** `generateStreetInfill` authors candidate brownstones, prewar apartments and commercial buildings along underused roadfronts. `placeCandidates` accepts only parcels that clear roads, previously existing buildings, every known job stop, shops, exploration activities and vehicle collection/door pads. Only accepted buildings become 3D scene instances, rooftop supports and world colliders.
- **Brooklyn Court:** the old suburban Grove home footprints become lower brownstone façades, California-style palm art becomes urban street trees with the original prop collider anchors, and the retained local traffic loop surrounds a stone sculpture rather than a water fountain.
- **Street details:** additional zebra crossings, physically collidable sidewalk signal posts, pedestrian lights, overhead poles and actual sign meshes. Traffic lights are decorative at present: the traffic AI does not yet legally obey signal phases.
- **Traffic and vehicles:** the original and five added NYC cars keep their two AI traffic circuits; the central former fountain is now accessible to user-driven vehicles. Rigid-body physics is **not** claimed—existing hull collision, swept contact, suspension and rooftop kinematics remain in use.
- **Local saves:** preserve all old localStorage keys and progression data. Legacy landmark discovery ID is unchanged, with only the visible name/text relocated.

## Run the real updated game

```bash
git fetch origin
git switch --track origin/feat/nyc-street-grid-rebuild
npm ci
npm test
npm run dev
```

If the branch already exists locally: `git switch feat/nyc-street-grid-rebuild && git pull`.

Check Broadway from the starting downtown area and the northern grid by following the avenues toward z=-438. Your existing map and HUD are updated with the 460m bounds. This is a feature branch, not merged into main/develop.

## Testing

- Existing game regression tests, TypeScript compiler and Vite build: `.github/workflows/game-ci.yml`.
- Real Chromium smoke: `.github/workflows/vertical-browser.yml` validates rooftop traversal, relocated downtown crossing, rendered signal-post batches and northern-grid access.
- `tests/nyc-street-rebuild.test.mjs`: confirms the center fountain is not a circle/collider, borough roads are connected, new buildings occupy formerly empty streets, crossing poles are off asphalt and all previous missions and garages remain accessible.

## Scope boundaries and next work

This is an original **NYC-inspired** road-plan/art reconstruction, not a faithful real-world street map. The northern extension does not fill every square metre of the ±460m world bounding square. Subways, enterable interior shops, pedestrian light rules, vehicle ownership payments in other districts, and borough-specific rooftop jobs are follow-up systems. Low-end phone and laptop frame-rate profiling is required before shipping.
