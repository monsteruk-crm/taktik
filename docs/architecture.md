# Architecture

## Engine ↔ UI boundary
- Engine lives in `src/lib/engine/**` and is exposed via `startMatch` + `applyIntent` in `src/lib/engine/api.ts`.
- Local runtime lives in `src/lib/runtime/**` and owns `engineState` + `eventLog`, enforces turn order, and maps UI seats to engine players.
- UI lives in `src/app/**` and `src/lib/ui/**` and interacts with the runtime only (no direct engine calls).
- The engine remains UI-agnostic: no React, no DOM, no timers, no real-time assumptions.

## Engine shape (current)
- `src/lib/engine/gameState.ts`: type definitions for `GameState`, `Unit`, cards, and effects.
- `src/lib/engine/reducer.ts`: the state machine and all rule enforcement.
- `src/lib/engine/cards.ts`: card definitions (data-only; effects are encoded via hook functions).
- `src/lib/engine/movement.ts`: helper to compute legal move range (8-direction).
- `src/lib/engine/selectors.ts`: shared grid helpers (`posKey`, `inBounds`, `unitAt`).
- `src/lib/engine/rng.ts`: deterministic d6 RNG primitive.
- `src/lib/engine/api.ts`: `startMatch` + `applyIntent` entry points.
- `src/lib/engine/index.ts`: public engine surface (types + the two API functions).

## Local runtime shape (current)
- `src/lib/runtime/localRuntime.ts`: in-memory runtime reducer, event log, and replay helper.
- `src/lib/runtime/index.ts`: runtime exports + UI-facing engine helpers.

## UI shape (current)
- `src/app/page.tsx`: hotseat “MVP UI” that renders state and dispatches runtime intents.
- `src/components/BoardViewport.tsx`: pan/zoom container that transforms the board layer.
- `src/components/IsometricBoard.tsx`: isometric grid renderer, highlight overlay, and click-to-grid hit testing.
- `src/lib/ui/iso.ts`: projection helpers (`gridToScreen`, `screenToGrid`) and tile constants.
- `src/lib/ui/Board.tsx`: legacy orthographic grid renderer (kept for reference).
- `src/lib/ui/CardPanel.tsx`: renders card draw/play/store controls and targeting state.

## Deterministic simulation story
- The complete game state is in `GameState` and can be serialized (no functions stored in state).
- All randomness is derived from `rngSeed` and updated in state on use.
- Given the same initial state and the same action sequence, the reducer produces the same output.

## Event log story
- `GameState.log` is currently an array of strings appended by the reducer and shown in the UI.
- Structured event data is captured separately via `EngineEvent[]` (intent + randomness markers) and owned by the local runtime for replay.

## Serialization / persistence (status)
- Not implemented.
- No save/load, no replay format, no networking.
