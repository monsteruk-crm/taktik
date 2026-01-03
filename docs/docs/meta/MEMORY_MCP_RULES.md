# Memory MCP Rules (server-memory)

We use @modelcontextprotocol/server-memory as a knowledge graph store. :contentReference[oaicite:4]{index=4}

## What memory is for
Memory is for durable truths:
- invariants
- final naming conventions
- “always true” constraints
- architectural decisions after they’re confirmed

## What memory is NOT for
- TODOs
- experiments
- temporary refactors
- “current work in progress”

## Entity strategy (simple)
Use a small fixed set of entities, add atomic observations:

- TAKTIK.Project
- TAKTIK.Engine
- TAKTIK.Cards
- TAKTIK.Tactics
- TAKTIK.UI
- TAKTIK.Tooling

One observation = one fact. No paragraphs.

## Examples of good observations
- “Turn phase order is TURN_START → CARD_DRAW → CARD_RESOLUTION → MOVEMENT → ATTACK → DICE_RESOLUTION → END_TURN.”
- “Max 5 units may move per turn.”
- “Bonus cards may be stored face-down; max stored is 6.”

## Operational rule
If it’s not in docs, don’t store it in memory.
Docs first, memory second.
