# Engine (Rules System)

## Purpose
The rules engine is a deterministic, UI-agnostic state machine implemented as a pure reducer (`lib/engine/reducer.ts`) operating on a serializable `GameState` (`lib/engine/gameState.ts`).

This document describes:
- what the manual specifies (`docs/Taktik_Manual_EN.md`),
- what the current implementation actually does,
- and where they differ (with explicit alignment TODOs).

## Core Rules (manual summary)
From `docs/Taktik_Manual_EN.md`:
- Per turn, a player draws 1 card from the common deck.
- Malus cards are played immediately unless canceled by a bonus card.
- Bonus cards may be played or stored face-down (max 6).
- A player may move up to 5 units per turn.
- Dice are d6 and affect combat/action effectiveness.
- The manual states the common deck is shuffled at the end of the turn.

## Determinism Contract
### Manual expectation
The manual does not define RNG mechanics, but the project contract requires reproducible randomness.

### Current implementation
- All randomness is derived from `GameState.rngSeed` (a 32-bit unsigned number).
- Dice rolls use an LCG in `lib/engine/rng.ts`:
  - `rollDie(seed) -> { result: 1..6, nextSeed }`
- Deck shuffling uses a deterministic Fisher–Yates shuffle that advances the same LCG constants (`shuffleWithSeed` in `lib/engine/reducer.ts`).
- Bootstrapping now splits into deterministic terrain steps:
  - `prepareGameBootstrap(seed)` shuffles decks and produces `terrainSeed`.
  - `generateTerrainNetworks` consumes `terrainSeed` (often off-thread in the UI) and returns `{ road, river, nextSeed }`.
  - `generateTerrainBiomes` consumes that `nextSeed` and returns `{ biomes, stats, nextSeed }`.
  - `createInitialGameStateFromBootstrap` assembles the full `GameState` and stores the final `nextSeed` into `GameState.rngSeed`.
- `generateRoadCells` returns a `Set<string>` so `generateTerrainNetworks` maps those coordinates into arrays after calling it; this guards the engine against React/SSR runtime failures caused by invalid destructuring while keeping terrain seeding deterministic.
- `generateRoads` now seeds the road set with fallback cells before the collector/local loop, so `parseKey` never receives `undefined` from an empty `Set` (the crash triggered by destructuring `roadSet` with zero entries is gone while the deterministic RNG flow remains the same).
- Reducer is deterministic given `(state, action)`; no `Date.now()`, no side effects, no UI coupling.
- `Commander's Luck` rerolls reuse `rngSeed` and log the reroll result deterministically.

### Invariant
- Every randomness consumer must take the current `rngSeed` and write back the returned `nextSeed` into state.

## Data Model (types + invariants)
Defined in `lib/engine/gameState.ts`:

### `GameState` (selected invariants)
- `phase`: explicit engine phase (`GamePhase`).
- `activePlayer`: `"PLAYER_A" | "PLAYER_B"`.
- `turn`: increments on `END_TURN`.
- `boardWidth` / `boardHeight`: board bounds used by movement validation and UI rendering.
- `units`: each `Unit` has:
  - `owner` (player),
  - `position` (`{x,y}` in grid),
  - `movement`, `attack` (currently placeholder numeric stats),
  - `hasMoved` (reset at start of a new turn).
- `movesThisTurn`: capped by the engine at 5 (see `maxMovesPerTurn`).
- Terrain:
  - `terrain.road` / `terrain.river`: arrays of `{x,y}` cells generated at game start.
  - `terrain.biomes`: `TerrainType[][]` grid (PLAIN/ROUGH/FOREST/URBAN/INDUSTRIAL/HILL/WATER), generated deterministically from the terrain seed plus river/road inputs; road/river cells are forced back to `PLAIN` to keep overlays legible.
    - Guard: biome generation enforces minimum counts for `FOREST`, `ROUGH`, and `HILL` by deterministically assigning high-scoring interior `PLAIN` cells (moisture/elevation) if thresholds/smoothing would otherwise make them vanish.
  - `terrain.stats`: counts + region totals per terrain type for debug tuning (dev-only visibility).
  - `terrain.params`: density knobs (`roadDensity`, `riverDensity`) plus an optional `maxBridges` cap that limits how many river crossings/bridges are allowed; this comes from `initialTerrainParams`.
  - `terrain.seed`: the seed value used for terrain generation (derived from the prior `rngSeed`).
- Initial unit placement is driven by the global `initialUnitComposition` map (`src/lib/settings.ts`); the reducer instantiates each player’s configured number of `INFANTRY`, `VEHICLE`, and `SPECIAL` units as IDs `A*`/`B*` and starts them on the two anchor rows separated by `bootstrapUnitPlacement.enemyDistance`.
- Before snapping into the final spot, each anchor column and row is jittered by the seeded scatter radii (`bootstrapUnitPlacement.columnScatter` / `.rowScatter`), which draws from the same LCG seed stream used throughout the engine so placement remains reproducible.
- `findNearestClearCell` now accepts an `isAllowedCell` guard, and placement will only resolve to tiles whose biome is `PLAIN`, so no army starts on a road, river, or other terrain type even when the nearest collision-free tile would otherwise disagree.
- River paths apply axis-run persistence during generation (runAxis/runLen with a minimum run before turns plus anti-ABAB filtering) and avoid forming 2x2 lattice squares; even at tributary joins, 2x2 squares that include existing river cells are rejected to prevent checkerboard clusters.
- Road pruning is single-pass only, removing short spurs without recursive cascades.
  - Road routing penalizes 2x2 squares, with a heavier penalty when the square touches existing road cells, to prevent lattice/checkerboard clusters while still allowing paths to complete.
- Road lattice penalties are sourced from `initialTerrainSquarePenalties` (`src/lib/settings.ts`) so tuning happens at a single config point for both main-thread fallback and the worker.
  - Initial terrain params are defined in `src/lib/settings.ts`.
- The renderer now reads per-`UnitType` tweaks in `initialUnitDisplayConfig` (`src/lib/settings.ts`) when placing unit sprites above the tiles so each type can have its own offset (X/Y) and `scale` while the engine state and deterministic layout stay untouched.
- Decks/cards:
  - `commonDeck`: the draw pile for the turn card.
  - `tacticalDeck`: shuffled list of available tactic cards (data-only, not drawn).
  - `selectedTacticalDeck`: the active player’s current tactic hand (cards are removed on play).
  - `pendingCard`: a drawn card waiting for target selection and/or play.
  - `storedBonuses`: face-down bonus cards, capped at 6 (engine-enforced).
  - `activeEffects`: instantiated effects currently modifying rules.
- Combat:
  - `pendingAttack`: selected attacker/target, resolved via `ROLL_DICE` + `RESOLVE_ATTACK`.
  - `lastRoll`: stores the most recent die result and outcome until `RESOLVE_ATTACK`.
- End state:
  - `phase === "VICTORY"` freezes the reducer.
  - `winner`: set on annihilation only (current implementation).

### Effects system (current)
- A played card instantiates one or more `Effect`s, each containing `hooks`:
  - `canMoveUnit`, `canAttack`
  - `modifyMovement`, `modifyAttackRoll`
  - optional phase hooks exist in types but are not executed by the reducer today.

## Turn Flow / Phases

### Manual says (turn summary)
The manual’s sequence is effectively:
1) Draw a card.
2) If malus: resolve immediately unless canceled.
3) If bonus: play or store (max 6).
4) Move up to 5 units.
5) Apply dice and card effects.

### Current implementation does
The engine has an explicit phase enum and order:
- `TURN_START → CARD_DRAW → CARD_RESOLUTION → MOVEMENT → ATTACK → DICE_RESOLUTION → END_TURN`

However, phase enforcement is partial:
- Enforced:
  - `MOVE_UNIT` only allowed in `MOVEMENT`.
  - `ATTACK_SELECT` only allowed in `ATTACK`.
  - `ROLL_DICE` only allowed in `DICE_RESOLUTION` (and requires `pendingAttack` + no `lastRoll`).
  - `RESOLVE_ATTACK` only allowed in `DICE_RESOLUTION` (and requires `pendingAttack` + `lastRoll`).
- Not enforced (currently allowed in any non-`VICTORY` phase):
  - `DRAW_CARD`, `PLAY_CARD`, `STORE_BONUS`, `TURN_START`, `END_TURN`, `NEXT_PHASE`.

Planned alignment (TODO):
- Gate `DRAW_CARD`/`PLAY_CARD`/`STORE_BONUS` to the card phases so the engine itself enforces the manual’s turn structure.

## Actions / Intents Supported
From `GameAction` in `lib/engine/reducer.ts`:
- Phase control: `NEXT_PHASE`, `TURN_START`, `END_TURN`
- Cards: `DRAW_CARD`, `STORE_BONUS`, `PLAY_CARD`
- Movement: `MOVE_UNIT`
- Combat: `ATTACK_SELECT`, `ROLL_DICE`, `RESOLVE_ATTACK`

## Resolution Rules (implemented)

### Movement
- Board bounds are fixed at 20×30 and stored in state as `boardWidth` / `boardHeight`.
- Distance uses Manhattan movement (radial diamond) via `dx + dy`.
- A unit may move at most once per turn (`hasMoved`).
- A player may move at most 5 units per turn (`movesThisTurn`).
- Units cannot move onto occupied tiles.
- Active effects can:
  - block movement via `canMoveUnit`,
  - modify movement range via `modifyMovement`.

Manual mismatch:
- Manual movement stats (Infantry=1, Mechanized=3, Heavy Artillery=2) are not reflected in current unit stats (placeholders).
- Base movement is configured via `initialUnitMovementByType` in settings; update these when manual-derived values are implemented.
 - Base attack is configured via `initialUnitAttackByType` in settings; update these when manual-derived values are implemented.

### Attacks
- Attack selection:
  - requires `ATTACK` phase,
  - target must be enemy-owned,
  - range is `manhattanDistance(attacker, target) <= attacker.attack` and non-zero.
- Dice resolution (two-step):
  - `ROLL_DICE`:
    - requires `DICE_RESOLUTION` and a `pendingAttack`,
    - base roll is d6 from `rngSeed`,
    - effects can modify the roll (`modifyAttackRoll`),
    - roll is clamped to 1..6,
    - HIT threshold is `>= 4`,
    - stores `lastRoll` but does **not** apply damage.
  - `RESOLVE_ATTACK`:
    - requires a `pendingAttack` and `lastRoll`,
    - applies damage (removes target on HIT),
    - clears `pendingAttack` and `lastRoll`,
    - checks victory.

Manual mismatch:
- Manual implies a richer hit requirement model (distance affecting hit threshold); current implementation is a fixed threshold.

## Cards & Effects

### Manual says
- Malus resolves immediately unless canceled by a bonus.
- Bonus can be stored face-down up to 6.
- “Enemy Disinformation” explicitly says the opponent chooses the blocked unit.

### Current implementation does
- Cards are defined in `lib/engine/cards.ts` with:
  - `kind`: `"bonus" | "malus" | "tactic"`
  - `timing`: `"immediate" | "stored" | "reaction"`
  - `reactionWindow`: required for tactics (`beforeMove`, `beforeAttackRoll`, `afterAttackRoll`, `beforeDamage`)
  - `targeting`: `"none"` or `{ type: "unit", owner: "self|enemy", count: 1|2 }`
  - `creates`: list of effect definitions (duration + hooks)
- Draw behavior (`DRAW_CARD`):
  - If a malus has `targeting: none`, it is auto-played immediately.
  - Otherwise it becomes `pendingCard` and requires target selection, then `PLAY_CARD`.
  - Any bonus draw becomes `pendingCard`.
- Storing (`STORE_BONUS`):
  - Stores a *pending* bonus into `storedBonuses`, max 6.
  - Stored bonuses are not playable yet (no action uses them).
- Cancellation (`timing: "reaction"`):
  - When a **bonus** reaction card is played, it removes **all** opponent-owned malus effects currently in `activeEffects`.

### Tactic reactions (current)
- Tactic cards live in `lib/engine/cards/tactics.ts` and are held in `selectedTacticalDeck`.
- Reaction windows are **computed**, not stored in state:
  - `beforeMove`: when `MOVE_UNIT` is executed in `MOVEMENT`.
  - `beforeAttackRoll`: when `ROLL_DICE` is executed with a `pendingAttack` and no `lastRoll`.
  - `afterAttackRoll` / `beforeDamage`: when `RESOLVE_ATTACK` is executed with a `pendingAttack` and `lastRoll`.
  - Source-of-truth: `getOpenReactionWindows(state)` in `lib/engine/reactions.ts`.
- Only one tactic can be played per action (no nested reactions).
- Tactic validation and application is centralized in `validateAndApplyTacticReaction(...)` (also in `lib/engine/reactions.ts`) and used by the reducer during movement and combat actions.
- `Commander's Luck` is the single allowed card-id exception: it triggers a deterministic reroll during `RESOLVE_ATTACK`.

### Reaction windows (derived)
- Windows are **derived**, not stored in `GameState`.
- The only valid reaction windows are: `beforeMove`, `afterMove`, `beforeAttackRoll`, `afterAttackRoll`, `beforeDamage`.
- Engine source of truth: `getOpenReactionWindows(state)` in `lib/engine/reactions.ts`.
- Reducer uses `validateAndApplyTacticReaction(...)` to validate window legality, targeting, and apply effects without duplicating logic across actions.

Planned alignment (TODO):
- Make reaction/bonus cancellation match the manual (cancel a single malus, and support canceling the malus drawn this turn).
- Align “Enemy Disinformation” targeting with the manual (opponent chooses the blocked unit).

## RNG & Dice Usage
- The initial `rngSeed` comes from `getInitialRngSeed()` in `src/lib/settings.ts` (uses `NEXT_PUBLIC_RNG_SEED` if provided, otherwise `1` for a deterministic SSR-safe default).
- Terrain generation consumes `rngSeed` once at game start for networks, then once more for biome placement, and stores the returned `nextSeed`.
- `DRAW_CARD` consumes `rngSeed` only when refilling/shuffling an empty deck (current).
- `ROLL_DICE` consumes `rngSeed` every time it is called.
- Terrain path bias (the `biasStraight` parameter in `generateTerrainNetworks`) only reuses the previous direction when one exists, so the edge-case where `lastDir` is `null` no longer affects TypeScript strict mode while keeping the deterministic walk behavior intact.
- The snapshot variables now also declare their direction type explicitly (`(typeof DIRECTIONS)[number]`), which keeps the compiler happy without altering the deterministic direction bias logic.

Manual mismatch:
- Manual says “Shuffle deck at end.” Current implementation shuffles only on refill.

## Victory Conditions Status
- Implemented: annihilation only (if all remaining units share one owner).
- Planned: mission/scenario victory conditions from the manual.

## Rendering Assets (UI, non-engine)
The engine does not depend on rendering assets. The UI renders an isometric board using PNG tiles in `public/assets/tiles/`.

- Current state: the runtime board renders base terrain tiles per cell using `public/assets/tiles/terrain-*.png`, with network overlays for roads/rivers/bridges.
- Base tiles: `public/assets/tiles/terrain-*.png` (one per `TerrainType`).
- Network overlays: `public/assets/tiles/networks/*.png` (roads, rivers, bridge center square).

## Edge cases
- Terrain biome cleanup dissolves undersized FOREST/ROUGH/HILL regions to the dominant neighboring terrain (or `PLAIN` if no neighbor dominates).
- WATER/URBAN/INDUSTRIAL tiles are protected and never overwritten by smoothing passes.
- Terrain generation avoids placing settlement seeds on river or water cells, and edge cells bias back to `PLAIN` unless protected.
- Road/river cells are forced back to `PLAIN` at the end of biome generation to prevent noisy base tiles under overlays.

## Open questions
- When terrain starts affecting movement/combat, which terrain types will modify movement cost or attack resolution?
- Generation source: `scripts/gen_terrain_tiles.mjs` (procedural, deterministic generation of tile PNGs and cropping via ImageMagick).

## Edge Cases / Invariants Checklist
- `pendingCard` prevents drawing another card.
- `PLAY_CARD` validates targeting (count + owner constraint).
- Movement is rejected if out of bounds, out of range, or tile occupied.
- Attacks are rejected if out of phase, out of range, self-targeted, or blocked by effects.
- `phase === "VICTORY"` short-circuits all actions.

## Open Questions (from audit)
- What is the intended lifetime of malus effects relative to “reaction” cards, given current effects are `untilEndOfTurn` and expire on `END_TURN`?
- Should the engine’s phases be strictly driven by player actions, or should some transitions be automatic (e.g., auto-advance from `CARD_DRAW` after a draw)?
