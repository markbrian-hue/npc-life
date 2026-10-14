# NPC LIFE — QA Audit & Improvement Roadmap (October 2026)

Audit branch: `claude/qa-audit-overhaul`, based on `feat/nyc-street-grid-rebuild` @ `d035d2c`.

## How this audit was performed — and its limits

| Check | Status |
| --- | --- |
| Fetched all 16 remote branches with history, compared ancestry | Done |
| Read source for physics, vehicles, world/collision, saves, multiplayer server, UI layer, CSS | Done |
| `npm test` (unit suite) | 66/66 runnable tests pass. 4 test files could not load because `vite`/`three` could not be installed (see below) |
| Deterministic physics experiments using the real shared modules (Node) | Done — results below are measured, not estimated |
| `npm ci` / `npm run build` / typecheck / Playwright gameplay | **Not possible in this sandbox**: the npm registry is blocked by network policy (HTTP 403), so `three`, `vite` and `@react-three/fiber` cannot be installed |
| FPS, GPU, draw-call measurement, screenshots | **Not performed.** No numbers in this report are invented. Prior draw-call figures quoted below come from the repository's own `docs/explorer-render-comparison.json` |
| GitHub Actions on `d035d2c` | "Game regression checks" (npm ci + test + build) and "Vertical traversal browser" both **succeeded** |

UI findings are from static analysis of CSS and component code; they need confirmation in a real browser.

---

## A. Current development state

### Branches

`feat/nyc-street-grid-rebuild` (d035d2c, 2026-10-13 23:37) is the most advanced branch. Every other branch is a strict ancestor of it, forming one stacked line:

`main` ← `develop` ← `retro-game-ui` ← `world-foundation` ← `npc-career-and-city-bulletin` ← `living-city-survival-weather` ← `city-mobility-and-visual-foundation` ← `terrain-responsive-suspension` ← `cinematic-city-art` ← `blocky-explorers-performance` ← `nyc-vertical-traversal` ← `nyc-districts-streetscape` ← `nyc-expanded-megacity` ← `nyc-street-grid-rebuild`

Exceptions:

- `feat/m1a-world-config-validation` has one unmerged commit (`ed1e84d`, "centralize current world config and placement diagnostics": `src/game/worldConfig.ts`, `worldValidation.ts`). The later line evolved differently (`shared/world.mjs` now owns placement and `validateWorld()`), so this commit is **superseded**; merging it would conflict without adding behavior. Recommendation: leave it unmerged and archive the branch.
- `main` only contains the first `develop` merge (PR #1). It is 12 milestones behind.

### Architecture

- **Client:** React 19 + React Three Fiber 9 + three 0.180, Vite 7, TypeScript. `src/App.tsx` (1,514 lines) composes ~25 scene components and ~10 HUD systems.
- **Shared simulation (`shared/*.mjs`):** deterministic, framework-free modules used by client, server and tests — world plan/collision, player physics (fixed 120 Hz step), vehicle physics + suspension, vertical traversal, careers, living-city needs/economy/weather, exploration, vehicle catalog/garage.
- **Server (`server/multiplayer.mjs`):** Node HTTP + Server-Sent Events. Up to 8 players/room, server-authoritative vehicles and traffic at 60 Hz, presence relay for pedestrians, broadcasts at 5 Hz.
- **Persistence:** localStorage keys with validators and lossless migrations; validated export/import with rollback.

### Functional (verified by tests or code reading)

Fixed-step player movement and jumping; ladders on 26 buildings; vehicle driving with class handling, wet traction, suspension, swept collisions; 30-model catalog incl. 7 motorcycles; garage/dealership purchase rules; careers, daily bulletin, jobs with weather/hour gating; needs, food businesses, inventory; 6 weather states and day/night clock; exploration passport and contracts; multiplayer rooms with exclusive vehicle ownership; save validation/migration.

### Partially implemented

- **Vertical traversal** — works only in narrow cases and contains soft-locks (bugs C1–C3, H1).
- **City density** — 197 buildings; 86% of the core play area is open walkable space.
- **NPC life** — 3 street NPCs pace ~2 m loops; 8 residents follow schedules along one corridor each.
- **Multiplayer** — presence only for pedestrians; no movement validation beyond bounds/collision.

### Missing

Stairs/fire escapes, ladder descent, fall/landing consequences, HUD layout system, mobile movement controls, instanced vehicle rendering.

---

## B. Bug report

### C1 — Critical — Walking off any car roof traps the player inside the car

- **System:** player physics / vehicle collision
- **Repro:** stand on a parked sedan, SUV or bus roof; walk toward any side or end.
- **Expected:** step off and land beside the vehicle.
- **Actual:** the player drops into the vehicle body and can no longer move in any direction (measured: 6/6 models × directions trapped; 0.00 m moved over the next 2 s).
- **Root cause:** the standing footprint (`vehicleRoof`: half-width `width×0.35` minus a 0.12 m margin) is far smaller than the blocking footprint (`hull()` circles of radius `width/2` plus avatar radius 0.58 m). Losing roof support while still inside the hull drops the feet into the solid, after which every horizontal move is rejected.
- **Fix:** a single solid model where the support footprint equals the blocking footprint (both expanded by the avatar radius), plus depenetration.

### C2 — Critical — Walking off any building roof traps the player inside the wall

- **System:** player physics / world collision
- **Repro:** climb a ladder, walk off the roof edge.
- **Expected:** fall to the street.
- **Actual:** the player falls into the façade collider and is stuck (measured 28/28 walk-offs across 7 buildings and 4 directions).
- **Root cause:** same mismatch: roof support uses the footprint *shrunk* by 0.2 m (`platformsAt`), collision uses the footprint *grown* by the 0.58 m avatar radius. The existing test "falling off a rooftop falls under gravity" only checks height, not whether the player can move afterwards.
- **Fix:** as C1.

### C3 — Critical — A vehicle that moves into the player permanently pins them

- **System:** collision
- **Repro:** in a room, another player parks or drives a car over you (or a garage spawn/exit overlaps).
- **Actual:** if any part of a hull overlaps the player, every move is blocked (measured 0.00 m in 2 s).
- **Root cause:** `stepPlayer` tests the destination point only and has no depenetration.
- **Fix:** resolve overlap at the start of each step by moving to the nearest free position.

### H1 — High — Jumping onto vehicles almost never works (your #1 complaint)

- **System:** player physics
- **Repro:** run at a parked car and jump, at any timing.
- **Measured** (sprint and walk, jump points from 0.6–4.0 m, side and end approaches):

| Model (height) | Side | End |
| --- | --- | --- |
| Sedan 1.40 m | walk only, one timing | never |
| Hatch 1.45 m | one timing | never |
| Taxi 1.45 m | one timing | never |
| Coupe 1.20 m (lowest!) | never | never |
| SUV 1.85 / Pickup 1.75 / Bus 2.70 | never | never |

- **Root cause:** the entire car blocks as one full-height column until the feet clear the roof, so the body stops at the door while still rising; the jump apex (1.60 m) leaves almost no window. The hood/trunk have no walkable height. The fallback mantle only triggers by *holding E while airborne* — undiscoverable, shares E with "interact", and holding E makes walking off a roof re-mantle you back onto it.
- **Fix:** two-level vehicle solids (body at hood height + cabin at roof height), automatic step-up for curbs/low ledges, automatic ledge mantle when jumping into a reachable ledge while moving toward it.

### H2 — High — Benches, planters, kiosks and the bus shelter are invisible 8 m walls

- **System:** world collision (`shared/world.mjs`)
- **Root cause:** 104 road props have no `height`, so `p.height ?? 8` makes them 8 m tall. None are standable (`platformsAt` ignores props).
- **Fix:** real heights for standable props (bench 0.58 m, planter 0.7 m, kiosk 2.0 m, bus shelter 2.1 m); poles, trees and unknown district props block at every height so nothing can trap a falling player.

### H3 — High — Only 26 of 197 buildings have roof access

- **System:** vertical traversal
- **Fix:** generate validated fire-escape ladders across low/mid-rise buildings whose base is on a clear sidewalk; add ladder descent.

### H4 — High — HUD overlap is structural, not incidental

- **System:** UI/CSS
- Seven bottom-centre prompts use independent absolute offsets (100, 101, 106, 125, 165, 167, 170 px), the top-right column has six widgets with hard-coded offsets (e.g. release button 145 px vs guide 151 px, both right 27 px) and the career button sits at `bottom:65px; right:22px` under the minimap at `bottom:70px; right:26px`. Later CSS files patch earlier ones with `!important` and `:has()` rules.
- **Fix:** replace pixel offsets with anchored flex stacks (top-left, top-right, bottom-centre prompts, bottom-right) so widgets flow instead of colliding. Needs browser verification before shipping.

### M1 — Medium — App re-renders ~8×/s while the player stands still

- `Player` calls `onMove` every 0.12 s with a new object; `App` state updates re-render every non-memoized child (CityExtras, ReactiveCitizens, all HUD components).
- **Fix:** only report when position changes by >5 cm; memoize heavy consumers.

### M2 — Medium — Multiplayer movement is not validated

- `/api/move` accepts any in-bounds, non-colliding position (teleporting), and silently ignores positions the server considers blocked, which can make a remote player appear frozen.
- **Fix:** max-speed check per interval and the same height-aware solids on server and client.

### M3 — Medium — NPCs look robotic

- Street NPCs loop over four points ~2 m apart; on collision they skip to the next waypoint.
- **Fix:** sidewalk lane graph with longer routes and idle behaviors.

### M4 — Medium — City density

- 197 buildings; 86% of the core play box is open. NYC-like blocks need continuous street walls.

### L1 — Low — README points to an old branch

- The top section still names `feat/blocky-explorers-performance` as latest.

### L2 — Low — CI only runs on a hard-coded branch list

- New feature branches don't get CI until added to `.github/workflows/*.yml`.

---

## C. Performance report

- **Measured previously by the repo's own harness** (before the NYC expansion): 537–860 draw calls and 175k–233k triangles per view at Medium. This is high for browsers; current numbers after three NYC expansions are unknown and must be re-measured.
- Buildings, trees, ladders and street furniture are instanced (good).
- **Vehicles are not instanced:** each of 16 fleet vehicles renders ~20 meshes → roughly 300 draw calls before shadows.
- **58 `useFrame` callbacks**, several per-instance (residents, pigeons, vehicles).
- **App-level re-render at ~8 Hz** (M1).
- Multiplayer snapshot ≈ 7 KB × 5 Hz per player, including suspension arrays clients don't need.
- Event listeners, intervals and timers are consistently cleaned up; geometry disposal exists in components that create geometry imperatively. No leak was found by code reading.

---

## D. Roadmap

| Milestone | Scope | Verification |
| --- | --- | --- |
| **M1 — Traversal & collision foundation** (this branch) | Unified solids, depenetration, two-level vehicles, step-up, auto-mantle, real prop heights, more ladders + descent, regression tests | Node tests; CI build + browser job once pushed |
| **M2 — HUD layout system** | Anchored flex stacks, remove px/`!important` patches, small-viewport pass | Playwright screenshots at 1366×768, 1100×720, 760×600 |
| **M3 — Performance pass** | onMove throttling, instanced vehicle parts, slimmer snapshots, re-measure draw calls | `npm run test:performance` |
| **M4 — Multiplayer hardening** | Speed validation, shared solids on server | Unit + room tests |
| **M5 — Living city** | Sidewalk graph, NPC routines, more residents with LOD | Browser + unit |
| **M6 — NYC density & art** | Street walls, storefronts, rooftops, POLYGON-style materials | Screenshots + perf budget |
| **M7 — Vehicles & progression** | Distinct handling per class, garage tiers, reputation-gated unlocks | Unit + browser |

---

## Milestone 1 status — traversal & collision foundation

**Done on `claude/qa-audit-overhaul`:**

- `shared/solids.mjs` (new): one oriented-box solid model for world colliders and vehicles. Support and blocking use the same radius-expanded footprint, so losing support can never leave a body inside a solid.
- Vehicles: body box up to the rendered hood/deck line plus cabin box up to the roof (values mirror `form()` in `vehicleGeometry.ts`). Motorcycles stay non-standable.
- `shared/playerPhysics.mjs`: depenetration; 0.4 m step-up / step-down; automatic ledge mantle when jumping into a ledge within 0.95 m of the feet; walk-in climb for ledges up to 0.62 m; manual E-mantle can no longer re-grab the roof you are walking off; ladder descent on a fresh E press at the rooftop landing.
- `shared/world.mjs`: real prop heights (bench 0.58 m, planter 0.68 m, bus shelter 2.07 m, all standable); poles, trees, kiosks and unidentified district props block at every height.
- `shared/verticalTraversal.mjs`: validated fire escapes on low/mid-rise buildings (base clear, off-road, ≥3 m apart, landing on the roof). Original 26 ladders keep their ids and order.
- `src/game/Player.tsx`: uses the unified solids.
- `tests/traversal-solids.test.mjs`: 11 regression tests for C1–C3, H1–H3, the E re-grab loop and ladder descent.
- CI workflows now also run on `claude/**` branches.

**Measured with the shared physics modules (same collision closure as the game):**

| Check | Before | After |
| --- | --- | --- |
| Car roof walk-offs ending trapped in the car | 6/6 | 0/28 (7 models × 4 directions, in tests) |
| Building roof walk-offs ending trapped in the wall | 28/28 | 0/28 |
| Player overlapped by a car able to walk away | 0/3 | 3/3 |
| Sedan side approach, jump timings reaching the roof | 1/18 (walk only) | 13/18 walk and sprint |
| SUV / pickup / coupe side approach reaching the roof | 0/18 | 13/18 / 13/18 / 10–11/18 |
| End-on approach reaching the car | 0/18 | 6–8/18 onto the hood, then walk-climb onto the roof |
| Buildings with roof access | 26/197 | 156/197 |
| Props acting as invisible 8 m walls | 104 | 0 |

`npm test`: 77 runnable tests pass; the same 4 files as before can't load here because `vite`/`three` couldn't be installed.

**Not verified here:** `npm run build`, typecheck, and in-browser play (blocked registry). `src/game/Player.tsx` parses cleanly with TypeScript. GitHub Actions will run build + the Chrome traversal smoke test once this branch is pushed.

**Known limits:** hood heights follow the procedural shell's belt line and may differ slightly from the visible hood on some models; utility vehicles (bus, ambulance, van) have a narrow shoulder ledge at belt height; ledges above ~2.55 m (bus roof, building walls) still need a ladder; there is no fall damage or landing animation change.

---

## Milestones 2–7 status

All work is on `claude/qa-audit-overhaul`. Every claim below was verified by local Node tests and/or GitHub Actions running the real game in Chrome (software WebGL). No FPS numbers are claimed.

### M2 — HUD layout system (done)

- **Root cause:** ~20 widgets each hard-coded `position:absolute` pixel offsets, then later CSS files patched each other with `!important` and `:has()` rules.
- **Fix:** `src/game/ui/HudLayout.tsx` adds `HudProvider`, `HudRegions` and `HudSlot`. Every HUD widget is portalled into one of six grid regions in `hud-layout.css` (three columns on desktop, two below 900 px, a compact mode below 720 px tall).
  - The full-width header is split into branding (top-left) and fortune (top-right).
  - The toolbar has its own full-width bottom row and wraps instead of scrolling invisibly.
  - Dialogs sit above the HUD.
- **Verification:** `tests/hud-browser.mjs` (CI workflow *HUD layout browser audit*) loads the game at 1366×768, 1100×720, 800×600 and 390×844. In each, it checks four situations: start, shop counter, beside a car, and at a ladder. It reports overlapping widgets, off-screen widgets, widgets clipped by their region, and content overflowing inside a widget.

| Viewport | Findings before | After |
| --- | --- | --- |
| 1366×768 | 10 | 0 |
| 1100×720 | 8 | 0 |
| 800×600 | 15 | 0 |
| 390×844 | 5 | 0 |

The audit now runs in strict mode, so any future overlap fails CI.

### M3 — Performance (partly done)

- `Player` only updates App state when the resident moves more than 5 cm. Before, standing still re-rendered App and every non-memoised child about 8 times a second.
- District pedestrians beyond 110 m are hidden, so they cost no draw calls.
- **Not done:** vehicle mesh instancing, and re-measuring draw calls after the city got denser. The room snapshot still carries suspension state, which an existing test requires clients to receive.
- **Cost of new content:** fire-escape geometry is about 6,500 instanced boxes in a single draw call (~78k triangles).

### M4 — Multiplayer hardening (done)

- `server/multiplayer.mjs` `acceptMove()` validates movement:
  - The first report after joining is trusted.
  - After that, movement is limited to 14 m/s.
  - Teleports are allowed to spawn, the motor-club bus and every explorer site.
  - A client that keeps reporting the same rejected spot for 1.5 s is resynced, so an unknown legitimate relocation can't freeze a player.
  - Rejected moves return HTTP 409 and keep the last valid position.
- `tests/multiplayer-validation.test.mjs` covers this.

### M5 — Living city (partly done)

- `shared/sidewalkRoutes.mjs` derives 18 deterministic pedestrian routes (41–117 m) from the road plan. Each is sampled every metre against world collision and never touches the roadway, and they are spread from the old town to uptown and Brooklyn. These walkers are added to the existing eight.
- `tests/sidewalk-routes.test.mjs` covers this.
- **Not done:** the three named street NPCs still pace short loops (their encounter logic depends on those positions). There are no new NPC daily routines.

### M6 — City density (partly done)

- Street infill lots are 14 m apart (was 21 m) with 12 m frontage, every fifth lot gets a back-row building, and the Midtown grid streets are included.
- 197 → 273 buildings, and fire escapes 156 → 214.
- Open walkable share of the core area: 86% → 81%. All job, garage, route and reachability tests pass, and placement validation reports 0 issues.
- **Not done:** new building models, storefront interiors, and the POLYGON-style material pass.

### M7 — Vehicles (partly done)

- Each body class has its own cornering grip (`BODY_GRIP`: hypercar 1.32 … bus 0.72) and steering lock (`BODY_STEERING`). Before, 26 of 30 models shared grip 1.0, including the hypercar.
- `tests/vehicle-handling.test.mjs` drives each class through the same full-lock corner.
- **Already present, unchanged:** price, reputation and promotion gates for premium vehicles.
- **Not done:** new vehicle models, sound, and garage tiers.

### Visual review in CI

`tests/visual-snapshots.mjs` captures eight fixed views. The workflow publishes each as a neutral check run whose output holds the base64 JPEG, so the images can be reviewed without artifact downloads. Review findings:

- The car-roof snapshot shows the resident standing on a parked sedan after a real running jump.
- The rooftop snapshot shows the resident on a roof after a real ladder climb.
- The toolbar is fully visible.

### Browser verification added

`tests/vertical-traversal-browser.mjs` now also asserts that a running jump lands on a parked car in Chrome.
