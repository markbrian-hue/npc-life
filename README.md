## Living City & Survival update

The development branch `feat/living-city-survival-weather` builds on the career-and-bulletin gameplay source. It adds player needs, a food bag, four functional food businesses, six weather states, day/night lighting, shared room time, local resident routines, six new shifts and bounded city events. Press **G** to order, **O** to eat, **L** for work, and **T** to rest at benches. **F** retains NPC conversations.

See [controls, tuning, save compatibility, QA and limitations](docs/living-city-survival-weather.md).

# NPC LIFE — The City of Idiots

A retro multiplayer browser comedy sandbox. The festival is cancelled, four districts are broken, and the city has hired the least qualified person available: you.

## NPC career & daily city bulletin

Press **L** for your Resident Record. NPC LIFE now has five sequential career promotions: earn your first badge, discover districts, learn different jobs, purchase a city upgrade, and eventually become a Main Character by Accident. Promotions pay existing coins and reputation, not a new currency.

Six districts provide persistent passport stamps (Civic Square, Switchyard, Market Mile, Willow Park, Saltwater Dock, and Juniper Close). The daily City Bulletin rewards finishing two shifts, visiting three districts, and winning a court game. The three daily tasks reset on each **local calendar day**. Completed daily rewards and career promotions cannot be claimed twice.

Three extra repeatable jobs now offer alternate routes on subsequent runs: **Lost Mail Department** (10 REP), **Questionable Lunch Run** (30 REP), and **Sidewalk Quality Inspector** (55 REP). The original four jobs remain available.

This is a backwards-compatible extension of the existing resident v1 save data; old upgrades, shift counts, achievements and campaign progress are kept. Career and daily progress are **local to your browser**, not multiplayer-shared.

## World rebuild & gameplay foundation

The city now uses a shared road/placement plan, connected collectors and an eastern bypass, marked parking, park paths and Juniper Close. Placement rules keep building footprints and tree canopies out of roads and recreation areas. Shared traffic follows a checked lane circuit.

Press **L** for the resident record: start with **Go Buy Milk**, then try park cleanup, timed courier work and taxi shifts. Earn coins/reputation, purchase a Motor Club licence or courier bag, and explore city services with **T**. Benches, coffee, the civic shuttle and Juniper Court now have activities. The existing festival campaign remains in **C**.

See [milestone notes and verification](docs/world-foundation.md) for implementation, tests and limits.

## Vehicle and character foundation

- Larger bounds (±136), connected Juniper Close neighborhood, bungalows and palms.
- Fountain traffic island and circulating roundabout, marked crossings, sidewalk arrival point.
- Defined faces, hair, male and female residents, articulated limbs, improved street-facing assets.
- Six drivable cars: turning wheels, brake lights, acceleration, braking, reverse, off-road speed limits and collision hulls.
- Shared server-simulated vehicles: one driver per car, safe stopped exits, ownership released on disconnect.

## City Revival update

- **Five districts, over four times the original map area:** Civic Square, Switchyard, Market Mile, Willow Park, and Saltwater Dock.
- **Nine-step main campaign:** collect supplies, restore power, reopen the market, plant the garden, repair the beacon, and bring back the festival. Restored districts visibly change.
- **After the ending:** earn the City Keeper title and run repeatable courier contracts between districts.
- **Multiplayer rooms:** up to eight guests, room codes, live movement, jumping, nameplates, and waves. Menus lock only your own character.
- **World improvements:** warm lighting, district signs, transformers, striped stalls, garden beds, boats, seawall, pier, beacon, festival stage, expanded building collision and camera coverage.
- **Navigation:** full city journal, tracked objectives, distance and compass directions, minimap waypoints, and current district indicator.
- Existing jobs, NPC conversations, discoveries, shop, wardrobe, dailies, minigames, City Permit objective, procedural audio, and save import/export remain available.

**Multiplayer scope:** this is a working guest-room presence slice. Movement, waves, cars, traffic and vehicle ownership are shared. Campaign, district restoration, minigames, cosmetics and economy remain local to each browser. The room server authoritatively simulates cars and ownership; pedestrian movement remains a presence relay and does not accept or trust local save balances. Shared objectives/economy, accounts, moderation and public-host hardening are later milestones.

## Run it

Node.js 20.19+ (or a supported newer version), npm, and a desktop browser with WebGL.

```bash
npm ci
npm run dev:multi
```

Open the Vite address shown in the terminal. Press **N**, choose a name, and **Create room**. Friends open **the same game server address**, enter the room code, and join. On a trusted LAN, use the host computer's LAN address with the Vite port; other devices cannot use your `localhost` address. Windows may ask to allow Node on the private network.

`npm run dev:multi` starts Vite and the room server (port 3001). `npm run dev` starts only the local client; multiplayer will report the missing server. No new dependencies, paid service, or external art downloads are required.

For a built game served by the same Node process:

```bash
npm run build
npm start
```

Open `http://localhost:3001`. `PORT` changes the production port. Rooms are held in memory, expire after disconnected guests stop sending updates, and close when empty. Server restarts end rooms; personal saves stay in the browser. Internet play requires hosting this Node process behind HTTPS with streaming/SSE support; a static-only host does not run the room server. This change does not deploy a public server.

## Controls

| Control | Action |
| --- | --- |
| WASD / arrows | Move relative to camera |
| Shift / Space | Sprint / jump on foot |
| R / V | Enter or exit a stopped car / horn while driving |
| W/S, A/D, Space in car | Accelerate/reverse, steer, brake |
| Mouse drag / scroll | Orbit / zoom |
| L / T | Resident record and shifts / use nearby resident activity |
| C | City journal and full map |
| Hold Q | Work on the nearby tracked objective |
| N | Create or join a multiplayer room |
| E / F | Existing interactions / special citizens |
| B | Wave, also visible to room members |
| I / J / K | Wardrobe / achievements / dailies |
| M | Unemployment Simulator |
| H | Controls |
| Escape / P | Game menu; Escape closes the active dialog |
| Tab / Shift+Tab | Navigate dialog controls |

Desktop is the primary playable target. Responsive menus do not imply full mobile movement controls. The minimap follows an accepted resident shift, or the festival campaign when no shift is active. Both activity tracks remain optional. Follow streets around buildings instead of walking directly through them.

## Saves and verification

Existing saves are preserved. Resident shifts, unlocks, bench visits and court wins use `npc-life:resident-life-v1`; this key is included in validated export/import/reset. City Revival uses `npc-life:city-revival-v1`, included in validated export/import and reset. In-progress courier cargo is transient: after a reload, collect the parcel again. Completed deliveries and campaign stages persist.

```bash
npm test
npm run typecheck
npm run build
npm run test:browser
npm run test:city
npm run test:foundation
```

The browser suites require optional Playwright tooling; see [development notes](docs/development.md). Core tests use the existing toolchain. The large Three.js bundle warning remains; software-rendered QA is not a hardware performance benchmark.

Use `develop` for integration and `main` for reviewed releases. The world foundation milestone is on `feat/world-foundation`. No deployment is included.
