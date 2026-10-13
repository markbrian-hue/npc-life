# NPC LIFE Career & City Bulletin — milestone

Builds on commit 9673bfe (advanced world branch); intentionally does not merge or modify main/develop.

## Gameplay
- Five sequential career promotions with coins and reputation rewards.
- Six district passport stamps tracked by walking into each district.
- Three local-calendar daily objectives: shifts, exploration, basketball.
- Three new resident jobs with rotating routes based on completed shift count.
- Resume and import old resident v1 progress without resetting prior records.
- Reuse existing phone UI (L) rather than adding permanent HUD clutter.

## Persistence and multiplayer boundaries
- Uses the existing npc-life:resident-life-v1 save key, with optional visited, chapters and daily fields.
- Daily reward claims and promotion claims update the synchronous record ref before awarding coins.
- Existing v1 save import/export/reset includes this key and validator; missing fields migrate with defaults.
- Multiplayer economy remains personal and untrusted; the server does not award career coins.
- Job routes use previously reachable activity/mission locations; world placements are unchanged.

## Validation
- Run npm ci, npm test and npm run build.
- Functional tests cover once-only promotion claims, daily resets, alternate job routes, and old-save migration.
- Smoke-test the L menu, all shift types, and claims in a normal WebGL browser; verify old exported save import and storage persistence.
- The branch is a gameplay milestone, not the final completed 20-phase overhaul.
