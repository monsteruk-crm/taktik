# Tactics Cards

## What this feature does
Enables tactic cards to be armed and played only during reaction windows that occur inside movement and attack resolution. Tactic cards are consumed on use and apply short-lived effects that modify the current resolution.

## Why it exists (manual reference)
From `docs/Taktik_Manual_EN.md`, tactic cards like “Precision Shot”, “Suppressive Fire”, and “Commander’s Luck” are reaction-based, high-impact decisions that interrupt or reshape a specific resolution moment rather than provide passive buffs.

## Constraints
- Tactic cards must use `timing: "reaction"` and define a `reactionWindow`.
- Reaction windows are not phases and are not stored in `GameState`.
- Only one tactic can be played per reaction window (no nested reactions).
- Tactic effects are short-lived (current implementation uses `untilEndOfTurn`).
- `Commander's Luck` is the only card-id exception and may reroll the attack roll deterministically.

## Edge cases
- Tactics are rejected if the reaction window is not currently open.
- Tactics targeting units that already moved are rejected for `beforeMove`.
- Tactics cannot be played if the card is not in `selectedTacticalDeck`.
- If the attack roll is already resolved, `beforeAttackRoll` tactics are rejected.

## How to test it manually
1) In `MOVEMENT`, arm `Suppressive Fire` and then move a unit; confirm movement is reduced for the targeted enemy.
2) In `DICE_RESOLUTION` with a pending attack, arm `Precision Shot`, roll dice, and confirm the roll modifier applies.
3) After rolling, arm `Commander's Luck`, click “Resolve Attack”, and confirm the reroll is logged.
