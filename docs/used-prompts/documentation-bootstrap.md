You are Codex working inside this repository.

NON-NEGOTIABLE: Follow `AGENTS.md` as a binding contract. If docs are not written, the task is FAILED.
Source-of-truth game rules manual: `docs/Taktik_Manual_EN.md`.

Goal of this run:
1) Inspect what is already implemented.
2) Generate the FIRST documentation files in `/docs` in a clean, organized way.

You MUST perform real repo inspection (read files) before writing docs. Do not hallucinate features.

---

# Step 0 — Read the contract + manual
- Open and read:
    - `AGENTS.md`
    - `docs/Taktik_Manual_EN.md`

Extract the key constraints that affect documentation:
- turn phases / sequence
- determinism rules (seeded RNG)
- card rules (bonus/malus behavior, storage limit)
- movement cap per turn
- any existing repo conventions (folder structure, MUI)

---

# Step 1 — Audit the current implementation (repo scan)
Scan these areas and take notes:

## Engine / Rules
- `lib/engine/**`
- especially:
    - state model types
    - reducer/state machine (if any)
    - turn phase logic
    - RNG / dice logic
    - cards: definitions + resolution
    - event log (if any)

## UI integration
- `app/**` (or wherever UI lives)
- Where phases, card draw, and card play are surfaced
- Whether UI uses MUI correctly

## Docs
- List what exists in `/docs` already (if anything)
- Note missing foundational docs

Output of Step 1 (in your own scratch notes, not as a final “report” file):
- “Implemented features” (bullet list)
- “Partially implemented / stubs”
- “Missing”
- “Open questions / ambiguities” (only those discovered by reading code)

---

# Step 2 — Create initial documentation files (HARD REQUIREMENT)
Create these files if missing; otherwise update them.
All docs must be based on the audit (Step 1) + manual.

## 2A) `/docs/progress.md` (ALWAYS REQUIRED)
Create with:
- Header explaining what this file is
- First entry dated today (use local date) with:
    - Milestone: “Repository audit + initial documentation baseline”
    - BEFORE: what existed before docs
    - NOW: what is implemented today (from audit)
    - NEXT: the next logical milestone (from audit gaps)
    - Known limitations / TODOs
    - Files touched (docs + any small adjustments you had to make)

## 2B) `/docs/engine.md` (FOUNDATIONAL)
Create a clean structure that separates:
- Purpose
- Determinism contract
- Core data model (types + invariants)
- Turn phases (manual vs implemented)
- Actions / intents supported (move, draw, play card, end turn, etc.)
- Resolution rules
- RNG & dice usage
- Victory conditions status (implemented vs planned)
- Edge cases and invariants checklist
- Open questions (only if discovered during audit)

Rules:
- If the code differs from the manual, document BOTH:
    - “Manual says…”
    - “Current implementation does…”
    - “Planned alignment: …” (as a TODO)
      Do not silently “pretend” it matches.

## 2C) `/docs/cards-system.md` (FOUNDATIONAL)
Create based on manual + current code in `lib/engine/cards.ts` (and related).
Must include:
- Concepts: bonus vs malus; immediate resolution; storage rules; cancellation rules
- How cards are represented in code (types/fields)
- Card resolution pipeline (who calls what, when)
- Targeting rules (auto-target vs explicit target selection; document current behavior)
- Examples: include 2–3 current card examples by name and what they do (from code)
- “Next extension points” (short list): how to add new effects without spaghetti

## 2D) (Optional but recommended) `/docs/architecture.md`
Create only if the audit shows non-trivial architecture:
- engine/UI boundary
- state shape
- serialization story
- event log story
  If architecture is still tiny, skip and note it in progress.md.

---

# Step 3 — Minimal code changes ONLY if required
Do NOT refactor.
Only do minimal code edits if needed to:
- fix broken imports that prevent reading/building
- add missing doc links
- create `/docs/README.md` index if it helps navigation

If you change code, you MUST update `/docs/progress.md` and reference the doc sections you changed.

---

# Step 4 — Memory MCP update (durable facts only)
After docs are written, write to Memory MCP only the stable, durable facts found in code/manual, such as:
- the canonical turn phase order (as implemented or as chosen)
- determinism/RNG contract
- card storage limit and resolution invariant
- any final naming conventions/invariants already settled

Do NOT store TODOs, partial plans, or “we might”.

---

# Step 5 — Self-check (must happen)
Before finishing, verify:
- `/docs/progress.md` exists and has TODAY’s entry with BEFORE/NOW/NEXT
- `/docs/engine.md` exists and reflects reality
- `/docs/cards-system.md` exists and matches actual code
- If any doc is missing or generic, keep working.

---

# Final output requirements (in your response)
- List created/updated files (paths)
- For each doc: which sections were added/updated
- State whether Memory MCP was updated and with what durable bullets
- If manual vs code mismatch exists: mention it clearly
