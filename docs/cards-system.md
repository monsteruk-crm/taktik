# Cards System

## What this feature does
Implements a small, deterministic card-and-effects system:
- Cards are drawn from a common deck.
- Drawn cards can create temporary “effects” that modify movement/attacks or block actions.
- Bonus cards can be stored face-down (up to 6) for later use (storage is implemented; playing stored cards is not yet implemented).
- Tactic cards can be armed and played during reaction windows (movement/attack resolution).

## Why it exists (manual reference)
From `docs/Taktik_Manual_EN.md`:
- There is a common deck containing bonus and malus cards.
- Malus cards are played immediately unless canceled by a bonus card.
- Bonus cards may be played or stored face-down, maximum 6.

## Concepts (manual vs current)

### Bonus vs Malus vs Tactic
Manual:
- Bonus: advantages and/or malus cancellation; can be stored.
- Malus: difficulties; played immediately unless canceled.
- The manual describes a separate “initial tactical deck” (bonus only).

Current implementation:
- `CardKind` supports `"bonus" | "malus" | "tactic"`.
- Tactic cards are defined in `lib/engine/cards/tactics.ts` and are available in `selectedTacticalDeck`.
- State includes `tacticalDeck` and `selectedTacticalDeck` as the deterministic tactical hand (no draw flow yet).

### Timing
Current implementation uses `CardTiming`:
- `immediate`: intended to resolve right away (used by malus definitions).
- `stored`: intended to be storable (used by most bonus definitions).
- `reaction`: intended to cancel malus effects (used by `electronicCountermeasures`).
  - Tactic cards also use `reaction`, but are gated by reaction windows instead of malus cancellation.

Manual mismatch:
- The manual’s “cancel malus” behavior is not modeled as “reaction” today; it’s a future alignment item.

### Storage
Manual:
- Bonus cards may be stored face-down, max 6.

Current implementation:
- `storedBonuses` is capped at 6 by the reducer (`STORE_BONUS`).
- Stored bonuses cannot currently be played (no action consumes `storedBonuses`).

## How cards are represented in code
Defined in `lib/engine/gameState.ts` and implemented in `lib/engine/cards.ts`:
- `CardDefinition` fields:
  - `id`, `name`
  - `summary`, `usage` (presentation-only text shown in the UI)
  - `images` (`hi`/`lo` artwork paths)
  - `kind` (`bonus|malus|tactic`)
  - `timing` (`immediate|stored|reaction`)
  - `reactionWindow` (required for tactics)
  - `targeting`:
    - `{ type: "none" }`, or
    - `{ type: "unit", owner: "self|enemy", count: 1|2 }`
  - `creates`: list of `EffectDefinition`s (duration + hooks)

## Card resolution pipeline (current)

### 1) Draw
Reducer action: `DRAW_CARD` (`lib/engine/reducer.ts`)
- Draws the top card from `commonDeck`.
- If the deck is empty, refills by shuffling `commonDeckCards` with `rngSeed` (deterministic).
- Sets `pendingCard` to the drawn card, except:
  - If the card is a malus with `targeting: none`, it is auto-played immediately.
UI:
- `lib/ui/CardPanel.tsx` renders `summary`, `usage`, and a thumbnail image for pending cards and stored bonuses.
- Missing artwork falls back to `public/assets/cards/placeholder.png`.

### 2) Select targets (if required)
Current UI path (`app/page.tsx`):
- If `pendingCard.targeting.type === "unit"`, the user enters a targeting mode and clicks units on the board.
- Target validity is enforced by UI (owner constraint) and also validated again in the reducer on play.

Manual mismatch:
- “Enemy Disinformation” in the manual says the *opponent* chooses the blocked unit; current UI makes the active player select the target.

### 3) Play
Reducer action: `PLAY_CARD`
- Requires that `pendingCard.id === action.cardId`.
- Validates targets in-engine (`validateTargets`).
- Instantiates effects (`instantiateEffect`) and appends them to `activeEffects`.
- Clears `pendingCard` on success.

### 4) Store (bonus only)
Reducer action: `STORE_BONUS`
- Requires `pendingCard.kind === "bonus"`.
- Enforces the max storage cap (6).
- Moves `pendingCard` into `storedBonuses` and clears `pendingCard`.

## Tactic reactions (current)
- Tactic cards live in `lib/engine/cards/tactics.ts` and are held in `selectedTacticalDeck`.
- They are **not** drawn; they are armed in the UI and consumed on play.
- Reaction windows are computed from state:
  - `beforeMove` during `MOVEMENT` when a move is executed.
  - `beforeAttackRoll` during `DICE_RESOLUTION` before `ROLL_DICE`.
  - `afterAttackRoll` / `beforeDamage` during `DICE_RESOLUTION` before `RESOLVE_ATTACK`.
- Only one tactic can be played per action (no nested reactions).
- `Commander's Luck` is the only card-id exception and triggers a deterministic reroll on `RESOLVE_ATTACK`.

## Effects model
An `Effect` is a runtime instance containing:
- `ownerId`: which player owns the effect instance.
- `sourceCardId`: the card that created it.
- optional `targetUnitIds`: chosen targets at play time.
- `hooks`: functions evaluated by the reducer at decision points.

Implemented hooks today:
- `canMoveUnit(ctx, unitId)` → blocks movement when false
- `canAttack(ctx, attackerId, targetId)` → blocks attacks when false
- `modifyMovement(ctx, unitId, base)` → changes movement range
- `modifyAttackRoll(ctx, roll, meta)` → changes dice roll outcome

Durations:
- `untilEndOfTurn` is implemented via `remainingTurns = 1` and decremented on `END_TURN`.
- `untilPhase` exists in types and is supported by `NEXT_PHASE` expiration.

## Cancellation rules (manual vs current)
Manual:
- Bonus cards can cancel a malus (examples show “cancels 1 malus”).

Current implementation:
- Only `timing: "reaction"` triggers cancellation logic.
- When a **bonus** reaction card is played, it removes **all** opponent-owned malus effects currently in `activeEffects`.
- Because current malus effects are `untilEndOfTurn`, they typically expire on `END_TURN`, which limits practical use of reaction cancellation in the current MVP.

Planned alignment (TODO):
- Model “cancel the malus that was just drawn” and enforce “cancel 1 malus” semantics.

## Examples (from current cards)
From `lib/engine/cards.ts`:
- `Rapid Supply Convoy` (`rapid_supply_convoy`): bonus; no target; increases movement by +1 for the turn.
- `Advanced Recon` (`advanced_recon`): bonus; targets 1 friendly unit; +2 movement to the targeted unit for the turn.
- `Artillery Support` (`artillery_support`): bonus; targets 1 friendly unit; +2 to that unit’s attack roll for the turn.
- `Enemy Disinformation` (`enemy_disinformation`): malus; targets 1 enemy unit; blocks movement for that targeted unit for the turn.
- `UN Ceasefire` (`un_ceasefire`): malus; no target; blocks all attacks for the turn (`canAttack: () => false`).

From `lib/engine/cards/tactics.ts`:
- `Precision Shot` (`precision_shot`): tactic; `beforeAttackRoll`; targets 1 friendly unit; +2 to that unit’s attack roll.
- `Suppressive Fire` (`suppressive_fire`): tactic; `beforeMove`; targets 1 enemy unit; reduces its movement by 1.
- `Commander's Luck` (`commanders_luck`): tactic; `afterAttackRoll`; rerolls the attack roll.

## Constraints / edge cases
- Cannot draw another card while `pendingCard` exists.
- Target validation rejects:
  - missing targets,
  - wrong count,
  - wrong owner (self vs enemy).
- Stored bonuses are capped at 6; there is currently no replacement rule when full (manual mentions “replace”; current engine rejects storing beyond 6).
- Tactic cards are rejected if their reaction window is not open or if another tactic is already armed.

## Next extension points (how to add cards safely)
- Add a `CardDefinition` in `lib/engine/cards.ts` that only uses existing hooks first (`modifyMovement`, `modifyAttackRoll`, `canMoveUnit`, `canAttack`).
- Prefer targeting via `targetUnitIds` rather than hardcoding unit IDs or positions.
- If you need a new kind of interaction:
  - add a new hook type in `EffectHooks`,
  - add a single reducer evaluation point for it (centralized),
  - keep the hook contract pure and deterministic.

## How to test manually
In `npm run dev`:
1) Use “Next Phase” to reach `CARD_DRAW`.
2) Click “Draw Card”.
3) If the pending card requires targets, click “Select Targets”, then click valid units on the board, then “Confirm”.
4) Advance to `MOVEMENT` and try moving units; observe movement changes or blocked moves.
5) Advance to `ATTACK` → select attacker then target → advance to `DICE_RESOLUTION` → “Roll Dice”; observe roll modifiers and unit removal on HIT.
6) In `MOVEMENT`, arm a `beforeMove` tactic (e.g., `Suppressive Fire`) and move a unit; confirm the effect applies.
7) In `DICE_RESOLUTION`, arm a `beforeAttackRoll` tactic (e.g., `Precision Shot`) before rolling; then roll and resolve.
8) After rolling, arm `Commander's Luck` and click “Resolve Attack” to confirm the reroll log.
