# Manual E2E Test — Game Flow & Mechanics (Updated)

This checklist verifies the full MVP game loop and the updated card/effect + explicit targeting rules.

## Setup

1. Run `npm run dev`.
2. Open `http://localhost:3000`.

## UI / Layout Smoke Checks

1. Verify the screen shows:
   - `TAKTIK MVP` and `Placeholder UI`
   - `Current Player: PLAYER_A`
   - `Phase: TURN_START`
   - `Mode`, `Selected`, `Pending Attack`, `Last Roll`
   - Right-side panels: `Cards` and `Log`
2. Verify the page does **not** overflow horizontally (no browser-level horizontal scrollbar).
3. Verify the map (board) is inside its own scroll container and can scroll:
   - vertically and horizontally (inside the map box)
4. Verify the board grid is visible (20×30) with coordinates on each tile.
5. Verify units are visible with IDs and owners:
   - Player A: A1, A2, A3
   - Player B: B1, B2, B3
6. Verify unit tile colors:
   - Player A units have a blue-tinted cell background.
   - Player B units have a red-tinted cell background.
7. Verify the log area starts at a fixed height of ~5 rows and auto-scrolls to show the newest entries.

## Cards — Draw / Pending / Targeting / Play

1. Click `Draw Card`.
2. Verify the `Pending Card` panel shows:
   - kind + name (e.g. `bonus: Troop Motivation`)
   - targeting label (`Target: none` or `Target: 1 friendly unit(s)` / `Target: 1 enemy unit(s)`)
3. If the pending card has **no targeting** (`Target: none`):
   - Click `Play Card`.
   - Verify the log includes `Card played: ...`.
   - Verify `Pending Card` becomes `None`.
4. If the pending card **requires unit targeting**:
   - Click `Select Targets`.
   - Click valid unit(s) on the map to satisfy the targeting requirement:
     - Friendly targeting: select units owned by the current player.
     - Enemy targeting: select units owned by the opponent.
   - Verify selected target units are visually marked (green border).
   - Verify `Confirm` stays disabled until the exact required number of units is selected.
   - Click `Confirm`.
   - Verify the log includes `Card played: ...`.
   - Verify `Pending Card` becomes `None`.
5. Verify invalid target clicks do not get selected:
   - With a friendly-targeting card active, click an enemy unit and confirm it is ignored (not added to selection).
6. Verify storing works (bonus only):
   - Keep drawing until you get a `bonus`.
   - Click `Store Bonus`.
   - Verify the stored bonus list increments, up to a max of 6.
7. Verify common deck refill:
   - Continue drawing/playing cards until the common deck reaches 0.
   - On the next draw attempt, verify the log includes `Common deck refilled and shuffled` and drawing continues.

## Movement — Highlight + Limits

1. Click `Next Phase` until `Phase: MOVEMENT`.
2. Verify `Move` is enabled and `Attack`/`Roll Dice` are disabled.
3. Click `Move` (if not already in Move mode).
4. Click a Player A unit tile (e.g. `A1`):
   - Verify reachable empty tiles are highlighted (yellow-tinted background).
5. Click a highlighted empty tile:
   - Verify the unit moves.
   - Verify the log includes `Unit A? moved to (x,y)`.
6. Attempt an illegal move (outside the highlighted range):
   - Verify the log includes `Illegal move for A? to (x,y)`.
7. Move up to 5 units total in the same turn:
   - On the 6th move attempt, verify the log includes `Move limit reached (5 units per turn)`.

## Attack + Dice Resolution

1. Click `Next Phase` until `Phase: ATTACK`.
2. Verify `Attack` is enabled and `Move`/`Roll Dice` are disabled.
3. Click `Attack`.
4. Click a Player A unit as attacker, then click a Player B unit in range:
   - Verify the log includes `Attack selected: A? -> B?`.
   - Verify `Pending Attack` displays `A? -> B?`.
5. Attempt to select an out-of-range target:
   - Verify the log includes `Attack out of range: A? -> B?`.
6. Click `Next Phase` until `Phase: DICE_RESOLUTION`.
7. Verify `Roll Dice` is enabled.
8. Click `Roll Dice`:
   - Verify `Last Roll` shows a number 1–6 and `HIT`/`MISS`.
   - Verify the log includes `Rolled <n> -> <clamped> (HIT/MISS) (A? vs B?)`.
9. If `HIT`:
   - Verify the target unit disappears from the board.
10. Click `End Turn` and verify:
   - The log includes `Turn ended. Next player: ...`.
   - `Current Player` changes.

## Victory by Annihilation (Player A Script)

Goal: remove all Player B units (B1, B2, B3). Victory is announced as `Victory: PLAYER_A wins by annihilation`.

1. Ensure it is Player A’s turn (`Current Player: PLAYER_A`). If not, click `End Turn` until it is.
2. Move Player A units into attack range (do this once; after that, keep positions unless you need to re-adjust):
   - Go to `Phase: MOVEMENT`.
   - Move `A1` from `(2,2)` to `(2,5)` (distance 3).
   - Move `A2` from `(4,2)` to `(4,4)` (distance 2).
   - Move `A3` from `(6,2)` to `(6,3)` (distance 1).
3. Optional but recommended (guarantees hits for the chosen attacker this turn): stack attack-roll bonuses for the current Player A turn:
   - Draw/play `Troop Motivation` (Target: none) if you draw it.
   - Draw/play `Artillery Support` (Target: 1 friendly unit) and select the attacker you will use this turn.
   - If both effects are active in the same Player A turn and `Artillery Support` targets the attacker, the attack roll is always a hit.
4. Kill one target per Player A turn:
   - Go to `Phase: ATTACK`.
   - Select attacker → target:
     - `A3` attacks `B3` (from `(6,3)` to `(6,6)` distance 3), then `Roll Dice`.
   - If the roll is a `MISS`, repeat on the next Player A turn.
5. On Player B turns, do not interfere:
   - Click `End Turn` immediately (no moves, no attacks).
6. Repeat the attack cycle for remaining units:
   - `A2` attacks `B2` (from `(4,4)` to `(4,6)` distance 2), then `Roll Dice`.
   - `A1` attacks `B1` (from `(2,5)` to `(2,6)` distance 1), then `Roll Dice`.
7. When the final Player B unit is destroyed:
   - Verify `Phase: VICTORY` is reached.
   - Verify `Winner: PLAYER_A` is displayed.
   - Verify the log includes `Victory: PLAYER_A wins by annihilation`.
   - Verify all action buttons are disabled and no further state changes occur.
