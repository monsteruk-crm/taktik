# Manual E2E Test — Game Flow, Cards, and Tactics (Updated)

This checklist verifies the MVP game loop, cards, and tactic reaction windows in the current UI.

## Setup

1. Run `npm run dev`.
2. Open `http://localhost:3000`.

## Quick Tactics Smoke Test

1. Advance to `MOVEMENT` and confirm the TACTICS HUD shows `Open windows: beforeMove` and the TACTICS button is enabled.
2. Click TACTICS to open the modal/drawer; find `Suppressive Fire` (or any `beforeMove` tactic).
3. Click `Select Targets`, modal closes, select an enemy unit on the board, then `Confirm`; verify the HUD shows `ARMED: ... (beforeMove)`.
4. Move a unit; confirm the tactic is consumed and the ARMED label clears.
5. Select an attacker/target, advance to `DICE_RESOLUTION`, and confirm the HUD shows `Open windows: beforeAttackRoll`.
6. Open TACTICS, arm `Precision Shot`, click `Roll Dice`, then confirm the HUD shows `Open windows: afterAttackRoll, beforeDamage`.
7. Open TACTICS, arm `Commander's Luck`, click `Resolve Attack`, and confirm a reroll log entry.

## Combined Cards + Tactics Walkthrough (Short Regression Pass)

1. From `TURN_START`, click `Next Phase` to reach `CARD_DRAW`.
2. Click `Draw Card`:
   - If targeting is required, click `Select Targets`, select valid units, then `Confirm`.
   - If not, click `Play Card`.
3. Click `Next Phase` to reach `MOVEMENT`.
4. Open TACTICS and arm a `beforeMove` tactic:
   - If targeting is required, select targets and `Confirm`.
   - Verify the HUD shows `ARMED: ... (beforeMove)`.
5. Move any unit; confirm the armed tactic clears and a log entry appears.
6. Click `Next Phase` to reach `ATTACK`, select an attacker and target, then click `Next Phase` to reach `DICE_RESOLUTION`.
7. Open TACTICS and arm a `beforeAttackRoll` tactic, then click `Roll Dice`.
8. Open TACTICS and arm `Commander's Luck` (or any `afterAttackRoll/beforeDamage` tactic), then click `Resolve Attack`.
9. Verify the log contains entries for the card play, movement, attack roll, and tactic resolution.

## UI / Layout Smoke Checks

1. Verify the screen shows:
   - `TAKTIK MVP` and `Placeholder UI`
   - `Current Player: PLAYER_A`
   - `Phase: TURN_START`
   - `Mode`, `Selected`, `Pending Attack`, `Last Roll`
   - Right-side panels: `Cards`, `Stored Bonuses`, `Tactics` HUD, and `Log`
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

1. With no reaction window open (e.g., `TURN_START`), verify the TACTICS button is disabled.
2. In `MOVEMENT`, verify the HUD shows `Open windows: beforeMove` and the badge count is > 0.
3. Open the TACTICS modal/drawer and confirm tactics are grouped by reaction window.
4. Verify non-playable tactics are visibly disabled (low emphasis) when their window is closed.
5. Pick `Suppressive Fire` (or any `beforeMove` tactic):
   - Click `Select Targets`, choose an enemy unit, then `Confirm`.
   - Verify the HUD shows `ARMED: <name> (beforeMove)`.
   - Move a unit and verify the tactic is consumed and the HUD clears.
6. In `ATTACK`, select an attacker/target, then advance to `DICE_RESOLUTION`:
   - Verify `Open windows: beforeAttackRoll`.
   - Open TACTICS, arm `Precision Shot`, and then click `Roll Dice`.
   - Verify the roll log reflects the modifier.
7. After rolling, verify `Open windows: afterAttackRoll, beforeDamage`:
   - Open TACTICS, arm `Commander's Luck`.
   - Click `Resolve Attack`.
   - Verify the log includes `Commander's Luck reroll: ...`.
8. ESC behavior:
   - While selecting tactic targets, press `Esc` and confirm targeting cancels.
   - With no targeting active, press `Esc` and confirm the modal closes.

## End Turn

1. Click `End Turn` and verify:
   - The log includes `Turn ended. Next player: ...`.
   - `Current Player` changes.

## Victory by Annihilation (Optional)

1. Continue attacking until all opposing units are removed.
2. Verify `Phase: VICTORY` is reached and `Winner: PLAYER_A` or `Winner: PLAYER_B` is displayed.
3. Verify the log includes `Victory: <PLAYER> wins by annihilation`.
4. Verify all action buttons are disabled and no further state changes occur.
