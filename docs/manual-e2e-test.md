# Manual E2E Test — Game Flow, Cards, and Tactics (Updated)

This checklist verifies the MVP game loop, cards, and tactic reaction windows in the current UI.

## Setup

1. Run `npm run dev`.
2. Open `http://localhost:3000`.

## Quick Tactics Smoke Test

1. Advance to `MOVEMENT` and confirm the Tactics panel shows `Open windows: beforeMove`.
2. Arm `Suppressive Fire` (or any `beforeMove` tactic) and move a unit; confirm the tactic is consumed.
3. Select an attacker/target, advance to `DICE_RESOLUTION`, and confirm `Open windows: beforeAttackRoll`.
4. Arm `Precision Shot`, click `Roll Dice`, then confirm `Open windows: afterAttackRoll, beforeDamage`.
5. Arm `Commander's Luck`, click `Resolve Attack`, and confirm a reroll log entry.

## UI / Layout Smoke Checks

1. Verify the screen shows:
   - `TAKTIK MVP` and `Placeholder UI`
   - `Current Player: PLAYER_A`
   - `Phase: TURN_START`
   - `Mode`, `Selected`, `Pending Attack`, `Last Roll`
   - Right-side panels: `Cards`, `Stored Bonuses`, `Tactics`, and `Log`
2. Verify the isometric board renders with ground tiles and units.
3. Verify the board can be panned (drag) and zoomed (wheel).
4. Verify the log area auto-scrolls to show newest entries.

## Cards — Draw / Pending / Targeting / Play

1. Click `Draw Card`.
2. Verify the `Pending Card` panel shows:
   - kind + name (e.g. `bonus: Troop Motivation`)
   - summary + usage
   - targeting label (`Target: none` or `Target: 1 friendly/enemy unit(s)`)
3. If the pending card has **no targeting**:
   - Click `Play Card`.
   - Verify the log includes `Card played: ...`.
   - Verify `Pending Card` becomes `None`.
4. If the pending card **requires unit targeting**:
   - Click `Select Targets`.
   - Click valid unit(s) on the map:
     - Friendly targeting: select units owned by the current player.
     - Enemy targeting: select units owned by the opponent.
   - Verify `Confirm` stays disabled until the exact required number of units is selected.
   - Click `Confirm`.
   - Verify the log includes `Card played: ...`.
   - Verify `Pending Card` becomes `None`.
5. Verify invalid targets are ignored:
   - With a friendly-targeting card active, click an enemy unit and confirm it is not selected.
6. Verify storing works (bonus only):
   - Keep drawing until you get a `bonus`.
   - Click `Store Bonus`.
   - Verify the stored bonus list increments, up to a max of 6.
7. Verify common deck refill:
   - Continue drawing/playing until the common deck reaches 0.
   - On the next draw, verify the log includes `Common deck refilled and shuffled`.

## Movement — Highlights + Limits

1. Click `Next Phase` until `Phase: MOVEMENT`.
2. Click `Move` if not already in Move mode.
3. Click a friendly unit:
   - Verify reachable empty tiles are highlighted.
4. Click a highlighted tile:
   - Verify the unit moves.
   - Verify the log includes `Unit A? moved to (x,y)`.
5. Attempt an illegal move (outside the highlight range):
   - Verify the log includes `Illegal move for A? to (x,y)`.
6. Move up to 5 units total in the same turn:
   - On the 6th attempt, verify `Move limit reached (5 units per turn)`.

## Attack + Dice Resolution

1. Click `Next Phase` until `Phase: ATTACK`.
2. Click `Attack`.
3. Click a friendly unit as attacker, then click an enemy unit in range:
   - Verify the log includes `Attack selected: A? -> B?`.
   - Verify `Pending Attack` shows `A? -> B?`.
4. Click `Next Phase` until `Phase: DICE_RESOLUTION`.
5. Verify `Roll Dice` is enabled and `Resolve Attack` is disabled.
6. Click `Roll Dice`:
   - Verify `Last Roll` shows a number 1–6 and `HIT`/`MISS`.
   - Verify the log includes `Rolled <n> -> <clamped> (HIT/MISS) (A? vs B?)`.
7. Verify `Resolve Attack` is now enabled and click it:
   - Verify the log includes `Attack resolved: A? -> B? (<value> HIT/MISS)`.
   - If `HIT`, the target unit disappears from the board.

## Tactics — Reaction Windows (New)

1. In `MOVEMENT`, verify the Tactics panel shows `Open windows: beforeMove`.
2. Pick `Suppressive Fire` (or any `beforeMove` tactic):
   - Click `Select Targets`, choose an enemy unit, then `Confirm`.
   - Verify the tactic shows as `Armed`.
   - Move a unit and verify the tactic is consumed (removed from the tactics list).
3. In `ATTACK`, select an attacker/target, then advance to `DICE_RESOLUTION`:
   - Verify `Open windows: beforeAttackRoll`.
   - Arm `Precision Shot` and then click `Roll Dice`.
   - Verify the roll log reflects the modifier.
4. After rolling, verify `Open windows: afterAttackRoll, beforeDamage`:
   - Arm `Commander's Luck`.
   - Click `Resolve Attack`.
   - Verify the log includes `Commander's Luck reroll: ...`.

## End Turn

1. Click `End Turn` and verify:
   - The log includes `Turn ended. Next player: ...`.
   - `Current Player` changes.

## Victory by Annihilation (Optional)

1. Continue attacking until all opposing units are removed.
2. Verify `Phase: VICTORY` is reached and `Winner: PLAYER_A` or `Winner: PLAYER_B` is displayed.
3. Verify the log includes `Victory: <PLAYER> wins by annihilation`.
4. Verify all action buttons are disabled and no further state changes occur.
