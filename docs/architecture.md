# Architecture

## Engine ↔ UI boundary
- Engine lives in `lib/engine/**` and is written as a deterministic reducer over `GameState`.
- UI lives in `app/**` and `lib/ui/**` and interacts with the engine only via `(state, dispatch(action))`.
- The engine should remain UI-agnostic: no React, no DOM, no timers, no real-time assumptions.

## Engine shape (current)
- `lib/engine/gameState.ts`: type definitions for `GameState`, `Unit`, cards, and effects.
- `lib/engine/reducer.ts`: the state machine and all rule enforcement.
- `lib/engine/cards.ts`: card definitions (data-only; effects are encoded via hook functions).
- `lib/engine/movement.ts`: helper to compute legal move range (8-direction).
- `lib/engine/selectors.ts`: shared grid helpers (`posKey`, `inBounds`, `unitAt`).
- `lib/engine/rng.ts`: deterministic d6 RNG primitive.
- `lib/engine/index.ts`: public engine surface used by the UI.

## UI shape (current)
- `app/page.tsx`: hotseat “MVP UI” that renders state and dispatches engine actions.
- `components/BoardViewport.tsx`: pan/zoom container that transforms the board layer.
- `components/IsometricBoard.tsx`: isometric grid renderer, highlight overlay, and click-to-grid hit testing.
- `lib/ui/iso.ts`: projection helpers (`gridToScreen`, `screenToGrid`) and tile constants.
- `lib/ui/Board.tsx`: legacy orthographic grid renderer (kept for reference).
- `lib/ui/CardPanel.tsx`: renders card draw/play/store controls and targeting state.

## Deterministic simulation story
- The complete game state is in `GameState` and can be serialized (no functions stored in state).
- All randomness is derived from `rngSeed` and updated in state on use.
- Given the same initial state and the same action sequence, the reducer produces the same output.

## Event log story
- `GameState.log` is currently an array of strings appended by the reducer and shown in the UI.
- There is not yet a structured event model; logs are informational only.

## Serialization / persistence (status)
- Not implemented.
- No save/load, no replay format, no networking.
