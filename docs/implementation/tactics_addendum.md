🔒 Final Addendum for Codex — Tactic Cards (Do Not Skip)
1. Reaction windows are NOT phases

Do not add new GamePhase values

Do not persist reaction windows in state

A reaction window is a temporary engine-only gate during resolution

Rule:
If resolution continues, the window is closed automatically.

2. No nested reactions

While a reaction window is open:

only one tactic card may be played

playing a tactic closes the window immediately

Tactic cards cannot trigger other tactic cards

This avoids infinite interrupts and multiplayer deadlocks.

3. Engine decides legality, UI only proposes

UI may show “Playable tactics”

Engine must still validate:

card.kind === "tactic"

timing === "reaction"

reactionWindow matches

targets are valid

Never trust the UI.

4. Tactic cards never persist long-term

Use only:

untilEndOfTurn

Do not introduce:

permanent tactics

multi-turn tactics

stacked reaction effects

If a tactic needs longer impact, it is a Bonus, not a Tactic.

5. One explicit exception is allowed (and only one)

For Commander’s Luck (reroll):

The engine may explicitly re-roll dice on reaction

This is allowed only because reroll is a resolution control, not a rule change

Log it as an event

Do not generalize this yet.

6. No card-ID branching elsewhere

Outside of the reroll exception:

no if (card.id === ...)

no special-case logic

All other behavior must come from effects

If Codex adds card-specific logic, it’s wrong.

7. Determinism checklist (must pass)

Codex implementation must ensure:

Same seed → same outcome

Replays can re-run reactions identically

Tactic play is logged as an event

Reaction window opening is deterministic

If any of these fail, reject the solution.