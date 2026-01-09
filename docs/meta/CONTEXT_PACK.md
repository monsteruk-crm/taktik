# Taktik — Context Pack (Compressed)

This file is a briefing to avoid token waste.
It does NOT replace the full manual.

---

## Project
Deterministic, turn-based, grid-based tactical board game.
Engine is UI-agnostic. Correctness > completeness > polish.

---

## Engine invariants (DO NOT VIOLATE)
- Phase order:
  TURN_START → CARD_DRAW → CARD_RESOLUTION → MOVEMENT → ATTACK → DICE_RESOLUTION → END_TURN

- Movement:
  Max 5 units may move per turn.

- RNG:
  Seeded, deterministic, replayable.

---

## Cards (summary only)
- Single common deck.
- Malus cards:
  - Resolve immediately unless canceled.
- Bonus cards:
  - May be played immediately OR stored face-down.
  - Max stored bonus cards: 6.

Canonical rules live in:
- docs/cards-system.md
- docs/tactics-cards.md

---

## UI doctrine (summary)
- Brutalist + Constructivist command console
- No gradients, glow, blur, bevels, or rounded corners
- Hierarchy via frames, plates, borders
- Color = semantic meaning (MOVE, ATTACK, DICE, CARDS)

Authoritative UI docs:
- docs/design/UI_GLOBAL_RULES.md
- docs/ui/COMMAND_UI_WIREFRAMES.md

---

## Default files Codex should read
- AGENTS.md
- docs/meta/CONTEXT_PACK.md
- The 1–3 canonical docs relevant to the task
