# Taktik — Context Pack (Compressed)

Read this first. It exists to avoid token waste.

## Project
Deterministic, turn-based, grid-based tactical board game in Next.js + TS.
Engine must remain UI-agnostic. MVP correctness > polish.

## Engine invariants (do not violate)
- Phase order (engine truth):
  TURN_START → CARD_DRAW → CARD_RESOLUTION → MOVEMENT → ATTACK → DICE_RESOLUTION → END_TURN
- Common deck:
    - Malus: resolves immediately unless canceled
    - Bonus: play now OR store face-down (max 6)
- Movement cap: max 5 units moved per turn
- RNG: seeded + replayable (server-authoritative long term)

## UI doctrine (summary)
- Brutalist + Constructivist command console
- No gradients, glow, blur, soft shadows, rounded corners
- Hierarchy via frames/plates/borders only
- Semantic colors are meaning (MOVE blue, ATTACK red, cards/dice yellow)

Authoritative UI rules:
- docs/design/UI_GLOBAL_RULES.md
- docs/implementation/TOP_BAR_PHASE_WIREFRAMES.md

## Where to update docs
- System truths: docs/engine.md
- Cards: docs/cards-system.md + docs/tactics-cards.md
- UI rules: docs/design/**

## “Default files to read” for any Codex task
- AGENTS.md
- docs/meta/CONTEXT_PACK.md
- plus the 1–3 feature files involved
