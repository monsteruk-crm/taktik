# TAKTIK — Game Overview (Canonical)

## Vision
Turn-based, grid-based tactical strategy inspired by *Into the Breach* (not a clone).

Pillars:
- Tactical clarity
- Deterministic resolution
- Explicit phases
- Mobile-first UX

Correctness > completeness > polish.

## Board
- Isometric grid
- Target size: 20×30
- Terrain: roads, rivers, hills, urban

## Turn Phases (Fixed)
1. Turn Start
2. Card Draw
3. Card Resolution
4. Movement (max 5 units)
5. Attacks
6. Dice Resolution
7. End Turn

No hidden state.

## MVP Scope
IN: full turn loop, movement, combat, cards, local play  
OUT: multiplayer backend, ranking, final art
