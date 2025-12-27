# TAKTIK — MVP Rules & Constraints

## Non‑Negotiables
- Deterministic outcomes
- Serializable game state
- Explicit state machine

## Units
Each unit:
- id, owner, type
- position
- movement, attack
- status flags

Max 5 units may move per turn.

## Cards
- Common deck: bonus + malus
- Tactical deck: bonus only (chosen at start)

Malus resolves immediately.  
Bonus may be stored (max 6).

## Combat
- Explicit target selection
- d6 resolution
- Visible outcomes
