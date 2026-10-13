# NPC LIFE — Borough streetscape milestone

**Branch:** `feat/nyc-districts-streetscape`  
**Base:** `feat/nyc-vertical-traversal` at `dbd5a94cf04305ad06aa7161e9773c076e7e8ba2`  
**Target:** New York City-*inspired* architecture, not an exact recreation or branded asset pack.

## In-engine changes

- **Midtown / Neon Crossing:** established Northgate parcels become varied high-rise office towers, with a taller skyline, continuous glass window bays, metal mullions, differentiated roof colors and small street-level podium façades. Extra candidates fit vacant blocks only after the original locations, parking pads and required activity areas have been reserved.
- **Eastbank / Brownstone Row:** existing walkable neighborhood lots are converted into lower brick brownstones, flush fire-escape silhouettes, cornices and individual storefront signage. This does not displace existing industrial warehouses.
- **Illuminated billboards:** seven original animated commercial screen installations, each mounted on a physical building face above pedestrian height. They do not introduce fictional collision barriers.
- **District crossings:** five painted zebra crossings aligned to existing streets, plus timed red/green pedestrian signals accepted only where free curb space is available. Signal posts are part of the same collision data used by the player and navigation.
- **Navigation:** names and differentiated colored building roofs appear on the existing city map. Rooftop ladders are extended to supported borough buildings, with collision-aware landings.

## Compatibility guarantees

All previous stores, garages, vehicle catalog entries, on-foot missions, career progress, coins, hunger/thirst, weather, rooms, and localStorage keys are left unchanged. No external packages, purchased art, geographic API, downloadable installer, or AI-created model asset has been added.

The architecture continues to use spatial material batching and near/far chunk culling. An expanded `BUILDINGS` array is the **single source of truth** for building rendering footprints, static collisions, camera occlusion and rooftop support. New parcel proposals use the existing `placeCandidates` collision and clearance filter; rejected proposals are neither rendered nor collidable.

## Run and verify

```sh
npm ci
npm test
npm run build
npm run dev
```

CI also runs `tests/vertical-traversal-browser.mjs`, which checks the in-engine streetscape, mounted billboards and active roof traversal using headless Chromium. The full `npm run test:performance` and multiplayer browser tests are separate optional suites and should be rerun for future large-scale map changes.

## Boundaries and next milestone

This is a **streetscape and city-density milestone**. It does not claim a completed Times Square, functional subway interiors, a rigid-body physics engine, collision-perfect external fire escapes or an exact visual match for a third-party POLYGON pack. The billboards use original in-engine geometry and text rather than proprietary graphics.

Next: controlled building interiors and subway access, playable rooftop contracts, navigation-aware traffic and NPC flows within the extra blocks, moving-car landing edge cases, true motorcycle dynamic contact, and real-hardware graphics profiling before considering any merge.
