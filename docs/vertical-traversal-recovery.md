# NPC LIFE — Recovery milestone: vertical traversal

Base: `feat/blocky-explorers-performance` at `9e0b5f959bf0498ca8773085aca067e22b3032ed`.
This is a strictly additive feature branch. The already-shipped city, survival, vehicles, room system, contracts, graphics and save keys remain in place. **Do not replace main or flatten the stacked PRs.**

## Controls

- **Space**: buffered jump. Player leap speed rises from 4.8 to 5.6 m/s so ordinary car rooftops become reachable with a running jump where geometry permits.
- **E (hold)** while standing at one of the marked facade ladders: pull onto the ladder, climb at 2.5 m/s, and mantle into the building's walkable rooftop. Stop holding E to release the ladder and fall normally.
- **E while airborne beside a reachable automobile roof edge**: mantle onto the roof instead of clipping through it. The feet must already be within 0.7 m below the ledge. Motorcycle seats are not invented as flat rooftops.
- A grounded player on a car roof follows its translation and turn while contact remains valid. Walking off a raised surface enters a real fall.

Ladder geometry is instanced for reasonable browser cost and shares its placement inputs with the physics system. Building roof surfaces use the same rotated footprints as architecture; car roof support uses the same vehicle catalog dimensions as rendered roofs. The 2D world collision API remains backward compatible, and in-game walking additionally supplies feet height.

## Source changes

- `shared/verticalTraversal.mjs` — deterministic roof queries, approximate automobile roof support and anchors for a bounded set of building ladders.
- `shared/playerPhysics.mjs` — explicit support state, vertical surface crossing, car carry motion, climb and mantle finite-duration modes, genuine off-edge gravity.
- `shared/world.mjs` — static collision height filtering without removing or broadening existing ground obstacles.
- `src/game/Player.tsx` — connects existing input, live vehicle fleet and fixed-step character; doesn't change the saved player model.
- `src/game/RooftopAccess.tsx` and `src/game/City.tsx` — visual ladders matching physics anchors.
- `server/multiplayer.mjs` — accepts height-aware building occupancy from browser players; retains the existing relay architecture.
- `tests/vertical-traversal.test.mjs` — roof IDs, collision, 3D landing, ladder ascent, carried support and fall regressions.
- `tests/vertical-traversal-browser.mjs` — Chrome scene/input smoke checking a complete real-keyboard ladder climb and stable rooftop landing.

## Verification and scope

The unit suite and `npm run build` run in GitHub Actions for this branch. An additional Chrome browser job is separately configured. Passing unit tests/build is **not** a substitute for the browser job; read both CI conclusions before merging.

**Limitations:** this is a kinematic vertical-traversal milestone, not a complete rigid-body physics engine. Not every world object has a dimensionally perfect 3D collider; only marked roofs have ladders. Vehicle roof surfaces are flat contact approximations and may not match every curved glasshouse pixel-perfectly. Multiplayer still relays client-simulated character movement rather than authoritatively re-simulating jumps and climbs; server-side validation must be strengthened before competitive gameplay. No new dense Manhattan/Brooklyn/Times Square block set is claimed here.

## Next development order

1. Browser-playtest vertical contact across more models, ladders and framerates; eliminate real collision exploits and add descending ladder behavior.
2. Build Manhattan-like commercial blocks and Brooklyn-like brownstones as authored district data and matching 3D colliders, without placing trees or objects in roads.
3. Connect stairwells, fire escapes, rooftop missions and shops to player progression.
4. Tune physical tire/contact models, then improve vehicle collisions and multiplayer validation without disturbing saved garages.
5. Add city signage, nighttime activity, interior access and quality-budgeted rain/reflections. Validate against a real midrange laptop GPU.
