# Manual E2E Test — Game Flow, Cards, and Tactics (Updated)

This checklist verifies the MVP game loop, cards, and tactic reaction windows in the current UI.

## Setup

1. Run `npm run dev`.
2. Open `http://localhost:3000`.

## Quick Smoke Test (Includes Tactics)

1. From `TURN_START`, click `Next Phase` until `MOVEMENT`.
2. Open the Ops Console `TACTICS` tab (right dock on desktop or `CONSOLE` button on mobile).
3. Arm a `beforeMove` tactic (e.g., `Suppressive Fire`):
   - Click `Select Targets`, select an enemy unit, then `Confirm`.
   - Verify the tactic arms and the bottom targeting bar clears.
4. Move any unit and confirm the tactic is consumed (log entry present).
5. Select an attacker/target, advance to `DICE_RESOLUTION`, and return to the `TACTICS` tab.
6. Arm a `beforeAttackRoll` tactic (e.g., `Precision Shot`), then click `Roll Dice`.
7. Arm an `afterAttackRoll/beforeDamage` tactic (e.g., `Commander's Luck`), click `Resolve Attack`, and confirm a reroll log entry.

## Full Flow Regression (Cards + Tactics)

1. From `TURN_START`, click `Next Phase` to reach `CARD_DRAW`.
2. Click `Draw Card`:
   - If targeting is required, click `Select Targets`, select valid units, then `Confirm`.
   - If not, click `Play Card`.
3. Click `Next Phase` to reach `MOVEMENT`.
4. Open the Ops Console `TACTICS` tab and arm a `beforeMove` tactic:
   - If targeting is required, select targets and `Confirm`.
   - Verify the card is armed.
5. Move any unit; confirm the armed tactic clears and a log entry appears.
6. Click `Next Phase` to reach `ATTACK`, select an attacker and target, then click `Next Phase` to reach `DICE_RESOLUTION`.
7. Open the Ops Console `TACTICS` tab and arm a `beforeAttackRoll` tactic, then click `Roll Dice`.
8. Open the Ops Console `TACTICS` tab and arm `Commander's Luck` (or any `afterAttackRoll/beforeDamage` tactic), then click `Resolve Attack`.
9. Verify the log contains entries for the card play, movement, attack roll, and tactic resolution.
10. Optional: In `ATTACK`, verify tactics outside the current reaction window remain disabled.

## UI / Layout Smoke Checks

1. Verify the screen shows:
   - Top command plate with player strip + VP/TURN/PHASE capsules
   - Command keys wrap (no horizontal scrolling)
   - Phase progress ruler visible under the command bar
   - Desktop: double-framed board surface + right “Ops Console” dock with “TAKTIK COMMAND” header and oblique tab plates (`LOG` only when `NEXT_PUBLIC_SHOW_DEV_LOGS=true`)
   - Mobile: `CONSOLE` button toggles a bottom sheet with a grab handle and 3 sizes (peek/half/full); no horizontal page scroll
   - Targeting overlay: opaque focus panel with a single clear outer frame (no double borders)
2. Verify the isometric board renders with ground tiles and units.
3. Verify the board can be panned (drag) and zoomed (wheel).
4. Verify the log area auto-scrolls to show newest entries in the `LOG` tab.
5. Verify the pending card module reads as a directive (not a centered modal blob).

## Cards — Draw / Pending / Targeting / Play

1. Click `Draw Card` (top bar or `CARDS` tab).
2. Open the Ops Console `CARDS` tab and verify the pending card block shows:
   - kind + name (e.g. `bonus: Troop Motivation`)
   - summary + usage
   - targeting label (`Target: none` or `Target: 1 friendly/enemy unit(s)`)
3. If the card requires targets, click `Select Targets` and confirm the bottom targeting bar appears.
4. If the pending card has **no targeting**:
   - Click `Play Card`.
   - Verify the log includes `Card played: ...`.
   - Verify `Pending Card` becomes `None`.
5. If the pending card **requires unit targeting**:
   - Click `Select Targets`.
   - Click valid unit(s) on the map:
     - Friendly targeting: select units owned by the current player.
     - Enemy targeting: select units owned by the opponent.
   - Verify `Confirm` stays disabled until the exact required number of units is selected.
   - Click `Confirm`.
   - Verify the log includes `Card played: ...`.
   - Verify `Pending Card` becomes `None`.
6. Verify invalid targets are ignored:
   - With a friendly-targeting card active, click an enemy unit and confirm it is not selected.
7. Verify storing works (bonus only):
   - Keep drawing until you get a `bonus`.
   - Click `Store Bonus`.
   - Verify the stored bonus list increments, up to a max of 6.
8. Verify common deck refill:
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

1. With no reaction window open (e.g., `TURN_START`), open the Ops Console `TACTICS` tab and confirm tactics are disabled.
2. In `MOVEMENT`, open the Ops Console `TACTICS` tab and confirm tactics are grouped by reaction window.
3. Verify non-playable tactics are visibly disabled (low emphasis) when their window is closed.
4. Pick `Suppressive Fire` (or any `beforeMove` tactic):
   - Click `Select Targets`, choose an enemy unit, then `Confirm` in the bottom targeting bar.
   - Verify the tactic arms.
   - Move a unit and verify the tactic is consumed.
5. In `ATTACK`, select an attacker/target, then advance to `DICE_RESOLUTION`:
   - Open the Ops Console `TACTICS` tab, arm `Precision Shot`, and then click `Roll Dice`.
   - Verify the roll log reflects the modifier.
6. After rolling, open the Ops Console `TACTICS` tab and arm `Commander's Luck`:
   - Click `Resolve Attack`.
   - Verify the log includes `Commander's Luck reroll: ...`.
7. ESC behavior:
   - While selecting tactic targets, press `Esc` and confirm targeting cancels.

## End Turn

1. Click `End Turn` and verify:
   - The log includes `Turn ended. Next player: ...`.
   - `Current Player` changes.

## Victory by Annihilation (Optional)

1. Continue attacking until all opposing units are removed.
2. Verify `Phase: VICTORY` is reached and `Winner: PLAYER_A` or `Winner: PLAYER_B` is displayed.
3. Verify the log includes `Victory: <PLAYER> wins by annihilation`.
4. Verify all action buttons are disabled and no further state changes occur.
