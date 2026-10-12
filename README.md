# NPC LIFE — The City of Idiots

A **free-to-develop** 3D browser-game prototype with a little open world, a character you can control, and one extremely important job: collecting debt from pigeons.

## Current playable features (Alpha 0.1)

- Low-poly city generated entirely from Three.js meshes: buildings, roads, trees, plaza.
- Third-person character, camera follow, WASD/arrow movement, Shift sprint, Space jump.
- Simple world boundaries and building collisions.
- Gary the NPC offers the **Pigeon Debt** quest.
- Press E near each of three pigeons to catch it; complete the job for 75 coins.
- Coin balance saved locally in the current browser via `localStorage`.
- Quest tracker, mini-map, controls panel, keyboard and clickable interaction prompt.
- No paid models, paid APIs, backend, or database required.

## Requirements

- Node.js **20.19+** or a later supported version (Vite 7 requirement)
- npm
- A desktop browser with WebGL support and a keyboard (mobile controls are planned later)

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown in your terminal (normally http://localhost:5173/).

## Build for deployment

```bash
npm run build
npm run preview
```

`dist/` contains the static game. Publish it to a free Cloudflare Pages static site using build command `npm run build` and output directory `dist`. Use a standard root URL, or update `vite.config.ts` if deploying under a subpath.

## Controls

| Key | Action |
| --- | --- |
| WASD or arrow keys | Walk |
| Shift | Sprint |
| Space | Jump |
| E | Speak to Gary or catch nearby pigeon |
| H | Toggle help |

## Suggested next milestones

1. Better character animations, camera rotation with mouse, and mobile input.
2. Shops, items, and persistent locally stored unlocks.
3. More ridiculous jobs and timed serverless random events.
4. Optimization, visual polish, and launch of the **single-player** browser version.
5. Multiplayer *after* the single-player game is fun, with a real backend and separate hosting plan.

## Budget reality

The prototype runs at no monetary cost locally. Static hosting can use a provider's free tier subject to its limits. A publicly available, always-running shared multiplayer server is **not guaranteed to remain free**, so it is intentionally not included in Alpha 0.1. No accounts, ads, or purchases are built in.

## Note on testing

Generated starter source code. Dependencies must be downloaded with `npm install` to build or run the game. Verify `npm run build` on your machine after install.
