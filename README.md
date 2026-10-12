# NPC LIFE — The City of Idiots

A multiplayer browser comedy sandbox in development. Take pointless jobs, annoy pigeons, dress badly, and become a questionable local celebrity.

**Multiplayer is a core product requirement.** This repository currently contains the local playable client. Online rooms, a networking transport, remote players, and authoritative shared-world state are not implemented yet. The current version label describes the local gameplay milestone, not multiplayer release readiness.

## Playable client

- Stylized 3D city, third-person movement, sprinting, jumping, orbit camera and building collision.
- Gary and Marty's jobs, discoveries, coins, reputation, cosmetic shop, wardrobe and achievements.
- Branching citizen conversations, daily challenges, Pigeon Panic and Unemployment Simulator.
- City events, orientation, minimap, procedural audio and a five-part City Permit objective.
- Local save persistence, validated import/export, reset confirmation and display preferences.
- Retro municipal-arcade interface with original pixel icons, shared dialogs and keyboard focus handling.

Progress currently belongs to this browser. Local save files must not become trusted multiplayer economy data.

## Development

Node.js 20.19+ or a supported newer version, npm, and a current desktop browser with WebGL and native dialog support.

```bash
npm ci
npm run dev
```

Desktop is the primary playable target. Responsive menus do not imply full mobile movement controls.

```bash
npm test
npm run build
npm run preview
```

`npm test` runs focused menu-state and save regression tests using Node's test runner and the existing Vite toolchain. Build performs TypeScript checking and produces `dist/`. A bundle-size warning is currently expected; performance on target hardware still needs profiling.

## Controls

| Control | Action |
| --- | --- |
| WASD / arrows | Move relative to camera |
| Shift / Space | Sprint / jump |
| Mouse drag / scroll | Orbit / zoom |
| E / F | Interact / talk to special citizens |
| B | Wave |
| H | Controls |
| I / J | Wardrobe / achievements |
| K | Daily challenges |
| M | Unemployment Simulator |
| Escape / P | Open menu; Escape closes the active dialog |
| Tab / Shift+Tab | Navigate the active dialog |
| Enter / Space | Activate focused controls |

Opening any dialog locks **only this client's character input and camera gestures**. It does not pause the world or future remote players. Movement keys are cleared on lock to prevent drifting after closing a menu. Unemployment Simulator keeps its own movement keys inside its dialog.

## Design and architecture

See [development notes](docs/development.md) for the retro UI system, multiplayer requirements and regression checklist.

Use `develop` for integration and `main` for reviewed releases. Do not deploy a client-only build as a functioning multiplayer release. Static client hosting does not supply the missing session server.
