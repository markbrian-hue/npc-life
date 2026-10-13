# Terrain-responsive suspension milestone

Continues verified mobility commit `95e1af83f859243a813b76227078ae8203916d70` on `feat/terrain-responsive-suspension`. This branch targets the mobility feature branch; it does not merge or modify main.

## Delivered

- A reusable damped spring at each contact patch replaces the sinusoidal body bob. Four-wheel vehicles and two-wheel motorcycles sample the same ground profile as the player. Tuned natural frequencies distinguish premium/performance, everyday, bus and motorcycle suspension. Bounded compression/rebound, acceleration squat, braking dive and outside-corner load transfer settle at rest.
- Wheels render their individual surface heights; the sprung body and occupants follow heave, pitch and roll. Motorcycle body lean remains responsive while both tires track the ground. Small bounded traction reduction during suspension motion combines with existing surface and rain grip.
- Original marked traffic-calming tables on West Avenue (`-58, 0`) and Juniper local street (`-92, -58`). Both their generated mesh and contact height use one cosine profile. No assets or runtime packages were added.
- Static/vehicle hull collisions now sweep to the final clear contact pose, preserve actual traveled distance, and stop without restitution. This improves placement at an impact but does **not** implement momentum transfer between cars.
- Traffic now uses the same 120 Hz accumulator and interpolated poses as driveable vehicles. Server snapshots carry suspension state; client inputs cannot set it. Local garage records, coin prices, career gates, ownership rules and save versions remain compatible.
- Cached wheel contact layouts and speed-table geometry; only two additional terrain draw calls.

## Verification

- `npm test`: 65 automated tests, including all 30 classes settling, inclined ground, weight transfer direction, bounded curb shocks, terrain/profile agreement, 30/144 FPS determinism, contact stopping, and authoritative room suspension snapshots. Existing wet braking, collision, garage migration, save import, mission reachability and multiplayer ownership tests pass.
- `npm run build`: TypeScript and production Vite build pass. The existing large-bundle warning remains (approximately 392 kB gzip).
- `npm run test:mobility`: 11 real Chromium gameplay checks pass, including purchase/debit protection, saved paint/rims, driving/braking/exits, seven silhouettes, responsive garage UI, two-browser shared motorcycles and no uncaught errors.
- `npm run test:suspension`: four Chromium/WebGL checks pass. The isolated fixture imports the production VehicleModel, road mesh and shared solver, checks independent rendered wheel heights and sprung-body transforms on sedan/scooter/bus, and captures screenshots in `qa-output/`. It is a component fixture, not a replacement for the full-game mobility run.
- Browser commands accept `NPC_LIFE_PLAYWRIGHT_MODULE` and `NPC_LIFE_CHROMIUM` overrides, as do the existing suites. No browser executable is committed.

## Scope and remaining work

This is a grounded, kinematic vehicle controller with independently simulated damped spring offsets. It is not a six-degree-of-freedom rigid-body simulation: there are no airborne wheel contact states, angular impact impulses, vehicle deformation, rollovers or mass-based car-to-car pushes. Stop-on-contact remains intentional until those responses can be integrated and tested with authoritative multiplayer ownership. Rapier was not added for this bounded milestone.

The larger overhaul still needs shared authoritative personal garages/wallets, further city/interior art, fixed-step crowd motion, refined character rigs, broader LOD and advanced atmospheric rendering. The existing 30 vehicles, living-city systems and progression remain the foundation.
