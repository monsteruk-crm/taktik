You are Codex working inside this repository.

NON-NEGOTIABLE: Follow `AGENTS.md` as a binding contract. If docs are not written, the task is FAILED.
Source-of-truth game rules manual: `docs/Taktik_Manual_EN.md`.
Also align with the current tactics intent described in:
- `docs/implementation/Tactics_Cards_Implementation.md`
- `docs/tactics-cards.md` (if present)

Goal of this run:
Refactor/abstract the **reaction-window + tactic-play plumbing** so it is:
- engine-owned (single source of truth)
- DRY (no duplicated validation/apply logic across actions)
- deterministic
- UI-agnostic
- NO behavior change (same actions still work the same)

Hard constraints:
- Do NOT add new `GamePhase` values.
- Do NOT store reaction windows in `GameState`.
- Do NOT introduce nested reactions.
- Do NOT add card-specific branching in engine (only allowed exception remains Commander's Luck reroll handling).
- Do NOT move card logic into UI.
- Prefer minimal, correct changes.

---

# Step 0 — Read contract + current engine
1) Read `AGENTS.md`.
2) Inspect current engine code:
   - `lib/engine/gameState.ts`
   - `lib/engine/reducer.ts`
   - `lib/engine/cards.ts` and `lib/engine/cards/tactics.ts`
   - `lib/engine/index.ts`
3) Inspect current UI usage in `app/page.tsx` where reaction windows are derived.

---

# Step 1 — Introduce a small engine “reactions” module
Create `lib/engine/reactions.ts` (or similar) that centralizes:

A) `getOpenReactionWindows(state: GameState): ReactionWindow[]`
- This MUST be the single source of truth for which windows are open given the current state.
- Implement using current rules already implicit in reducer/UI:
  - MOVEMENT => beforeMove (and if you already support afterMove, include only if actually open per current behavior)
  - DICE_RESOLUTION with pendingAttack:
    - if no lastRoll => beforeAttackRoll
    - if lastRoll exists => afterAttackRoll and beforeDamage (only if currently meaningful)
- IMPORTANT: This function must be pure and must not mutate.

B) `validateAndApplyTacticReaction(...)`
Create a helper that takes:
- `state`
- `reaction: { cardId: string; window: ReactionWindow; targets?: { unitIds?: string[] } }`
and returns either:
- `{ ok: true, state: GameState }` with the tactic applied (effects instantiated, removed from selected deck, log appended)
- `{ ok: false, state: GameState }` with an explanatory log entry and NO other changes

This helper must internally reuse (or replace) the existing duplicated logic in reducer:
- get tactic by id from `selectedTacticalDeck`
- validate tactic definition (kind/timing/window)
- validate window legality against state (phase + pendingAttack/lastRoll constraints)
- validate targets via `TargetingSpec` (explicit, never auto)
- apply effects using existing effect instantiation rules

C) Optional: `canPlayTacticInWindow(state, cardId, window, targets?)`
- pure predicate for UI convenience (optional but nice)
- must call into the same validators, no duplication

---

# Step 2 — Refactor reducer to use the module (DRY)
In `lib/engine/reducer.ts`:
- Remove duplicated tactic-validation/apply logic inside:
  - `MOVE_UNIT` (beforeMove/afterMove handling)
  - `ROLL_DICE` (beforeAttackRoll handling)
  - `RESOLVE_ATTACK` (afterAttackRoll/beforeDamage handling)
- Replace with calls to the helper(s) from `lib/engine/reactions.ts`.

Rules:
- Keep the current public `GameAction` surface compatible (do NOT invent new actions unless absolutely necessary).
- Keep Commander's Luck reroll exception exactly as currently implemented.
- Keep logs at least as informative as before (don’t delete useful messages).

---

# Step 3 — Export the new helpers for UI to consume
In `lib/engine/index.ts`, export:
- `getOpenReactionWindows`
- (optional) `canPlayTacticInWindow`

Then update `app/page.tsx` to stop hardcoding reaction window derivation:
- Replace local `openReactionWindows` calculation with the engine helper.
- UI remains “proposal only”: it can still choose to pass `reaction` payloads, but windows list must come from engine helper.

This is NOT a UI redesign: only remove duplication and ensure a single source of truth.

---

# Step 4 — Docs (HARD GATE)
Update docs based on what you actually changed:

1) Append a new entry to `/docs/progress.md` with BEFORE/NOW/NEXT and files touched.
2) Update `/docs/engine.md`:
   - Add/refresh a “Reaction windows” section:
     - define windows
     - state that windows are derived (not stored)
     - name the single source of truth function and where it lives
   - Mention how the reducer validates and applies tactic reactions (high level).
3) If `/docs/tactics-cards.md` exists, ensure it references the engine helper(s) and reflects the current implementation.

---

# Step 5 — Self-check
- `npm run lint` must pass.
- TypeScript must compile.
- No changes to `GamePhase` union.
- No reaction windows added to `GameState`.
- UI no longer computes its own window list; it uses the engine export.

---

# Final response requirements
In your response, list:
- Files created/updated
- Which doc sections were updated
- Any behavior differences (should be “none”)
