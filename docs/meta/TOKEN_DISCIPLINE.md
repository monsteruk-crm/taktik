# Token Discipline (Taktik)

Goal: keep Codex runs short, non-repetitive, and anchored to repo truth.

## Non-negotiables
1) NEVER paste large docs into chat.
    - Instead: point to file paths + section headers.
2) One canonical place per topic.
    - If a topic already exists (engine/cards/ui), UPDATE it; don’t create “another doc”.
3) “Implementation” and “old-prompts” are NOT canonical.
    - Treat as scratch/archive. Canon lives in top-level docs + docs/design + docs/meta.

## The Working Set (what Codex should read by default)
- AGENTS.md
- docs/README.md
- docs/engine.md
- docs/cards-system.md
- docs/tactics-cards.md
- docs/design/UI_GLOBAL_RULES.md (for UI work)
- docs/meta/CONTEXT_PACK.md (this is the compressed briefing)

## Prompt format to enforce discipline (copy/paste)
Use this structure, in this order:

### TASK
(1–3 sentences)

### CONSTRAINTS
(5–10 bullets max)

### FILES TO READ
(max 8 paths)

### DEFINITION OF DONE
(3–7 bullets)

### OUTPUTS REQUIRED
- Code changes
- Doc changes (name exact doc files)
- Memory updates (only durable facts)

## “No re-explaining” rule
Codex responses must not restate the manual/design system.
Instead, it must cite the exact file/section it relied on.

## Hard caps
- Max 8 files listed under FILES TO READ (force focus).
- Max 1 pasted snippet per file (only if necessary).
- If a change touches UI: must mention UI_GLOBAL_RULES compliance.

## When to write to Memory MCP
Write only durable facts:
- invariants
- phase order
- limits (e.g., max moved units)
- stable file-level conventions

Never write:
- TODOs
- experiments
- “we might…”
- partial refactors
