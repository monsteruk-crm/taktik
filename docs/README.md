# Docs Index

## Source of truth rules
- Manual: `docs/Taktik_Manual_EN.md`

## Core internal docs
- Progress log: `docs/progress.md`
- Engine (rules system + terrain params): `docs/engine.md`
  - Pathfinding iteration budgets for roads/rivers and the terrainPathfindingConfig knobs are documented there as well.
  - Movement rules include the diagonal-escape condition when a unit is fully blocked on cardinal steps.
  - Attack queue behavior and per-turn selection limits live there as well.
  - Engine API (`startMatch`/`applyIntent`) and event log behavior are documented there as well.
- Cards system: `docs/cards-system.md`
- Tactic cards: `docs/tactics-cards.md`
- Architecture overview: `docs/architecture.md`
  - Includes the LocalRuntime layer between UI and engine.
- Isometric board instructions: `docs/isometric.md`

## Supporting docs
- MVP overview: `docs/GAME_OVERVIEW.md`
- Milestones: `docs/milestones.md`
- Manual E2E checklist (current UI + board FX alignment + target anchoring): `docs/manual-e2e-test.md`
- MUI component index: `docs/mui_index.md`
