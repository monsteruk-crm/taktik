# Codex Operating Contract — Taktik Project

This file defines NON-NEGOTIABLE rules for Codex.
If any rule is violated, the task is considered FAILED.

IMPORTANT: The game manual source-of-truth is: `docs/Taktik_Manual_EN.md`

---

## 0. Core Principles (always on)

- MVP first: correctness > completeness > polish
- Engine must be deterministic and UI-agnostic
- No real-time elements in the rules engine
- Explicit phase transitions (no hidden state)
- Randomness must be seed-based and reproducible

---

## 1. Mandatory Outputs (ALL REQUIRED)

For every milestone, feature, bugfix, or refactor, Codex MUST produce:

1. Code changes
2. Documentation updates
3. Memory MCP updates (when applicable)

If documentation is not written, the task is INCOMPLETE.

---

## 2. Project Structure & Module Organization

- `src/app/` contains the Next.js App Router source (pages, layouts, route handlers).
- `public/` hosts static, publicly served files.
- `assets/` holds project assets that are not served directly.
- `docs/` is reserved for internal project documentation.
- Configuration lives at repo root (e.g., `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`).

---

## 3. Build, Test, and Development Commands

- `npm run dev`: start the Next.js dev server at `http://localhost:3000`.
- `npm run build`: create a production build.
- `npm run start`: run the production server from `.next/` after `build`.
- `npm run lint`: run ESLint with Next.js core web vitals + TypeScript rules.
- `npm run test`: run unit tests with Vitest.

---

## 4. Coding Style & Naming Conventions

- Language: TypeScript + React (TSX) with Next.js 16 App Router.
- Formatting: follow ESLint rules in `eslint.config.mjs` (no Prettier config detected).
- Indentation: 2 spaces.
- Naming: components in `PascalCase`, hooks/utilities in `camelCase`.

---

## 5. Testing Guidelines

- No test framework or test files are currently present.
- If you add tests, keep them close to the source (e.g., `app/**/__tests__/` or `app/**/*.test.tsx`).
- Document any new test commands in this file and `package.json`.

---

## 6. Commit & Pull Request Guidelines

- Git history contains only “Initial commit”, so no established commit message convention.
- Use clear, imperative messages (e.g., `Add auth callback handler`).
- PRs should include a short summary, testing notes, and screenshots for UI changes.

---

## 7. Security & Configuration Tips

- Store secrets in `.env.local` (do not commit).
- Add new env vars to `docs/` if they require onboarding.
- Review `.vercel/` and deployment settings if changing build/runtime behavior.

---

## 8. Documentation Rules (HARD GATE)

### 8.1 Where documentation lives
All documentation MUST be written in `/docs`.

No documentation → no valid completion.

### 8.2 Required documentation files

#### A) Progress log (ALWAYS REQUIRED)
`/docs/progress.md`

Append ONE new entry per milestone/change with:
- Date (YYYY-MM-DD)
- Milestone name
- What was implemented (concrete)
- What is still missing
- Known limitations / TODOs
- Files touched (high level list)

This file is mandatory for EVERY milestone.

#### B) System design (WHEN ENGINE CHANGES)
`/docs/engine.md`

Update when any of these change:
- rules
- phases / phase transitions
- deterministic behavior
- card logic or targeting
- RNG usage / seed flow

Required sections:
- Purpose
- Core rules (derived from `docs/Taktik_Manual_EN.md`)
- Data model (types + invariants)
- Turn flow / phases
- Determinism & RNG
- Edge cases
- Open questions

#### C) Feature-specific docs (WHEN APPLICABLE)
One file per feature, kebab-case:
- `cards-system.md`
- `turn-resolution.md`
- `victory-conditions.md`

Each feature doc MUST answer:
- What this feature does
- Why it exists (rule source / manual reference)
- Constraints
- Edge cases
- How to test it manually

---

## 9. Progress Narrative Rule (CRITICAL)

Codex MUST always explain in `/docs/progress.md`:
- What the system could do BEFORE
- What the system can do NOW
- What the NEXT logical step is

No narrative → failure.

---

## 10. Code–Doc Coupling Rule

Every code change MUST reference:
- Which doc file was updated
- Which section was added or modified

This reference MUST be included in the Codex response.

Example:
> “Updated `/docs/engine.md` → Turn Phases section”

---

## 11. Memory MCP Rules (STRICT)

Memory MCP is NOT a log.
Memory MCP stores ONLY durable facts.

### 11.1 What qualifies for MCP memory
Store ONLY:
- Final architectural decisions
- Chosen data models
- Engine invariants (hard rules)
- Naming conventions that must persist
- Determinism/RNG contract
- “Always true” constraints from the manual (e.g. turn phase order, max moved units, etc.)

DO NOT store:
- TODOs
- partial ideas
- experiments
- temporary refactors
- “current work in progress” state

### 11.2 MCP write rule
When Codex introduces or confirms a durable rule, it MUST:
1) Write it to documentation (usually `/docs/engine.md` or feature doc)
2) Store it in MCP memory (short, durable statement)

If unsure → do NOT write to MCP.

---

## 12. UI Framework Rules

- Use MUI components for every UI element when possible.
- The index of all MUI components is in `docs/mui_index.md`.
- UI structure, hierarchy, motion, and framing are governed by §15 and `/docs/design/UI_GLOBAL_RULES.md`


### Use the mui-mcp server to answer any MUI questions
- call the "useMuiDocs" tool to fetch the docs of the package relevant in the question
- call the "fetchDocs" tool to fetch any additional docs if needed using ONLY the URLs present in the returned content
- repeat steps 1-2 until you have fetched all relevant docs for the given question
- use the fetched content to answer the question

---

## 13. Failure Conditions (IMPORTANT)

The task MUST be considered FAILED if:
- No documentation is written
- Docs exist but are empty/generic or not updated for the change
- Progress is not summarized (BEFORE/NOW/NEXT missing)
- MCP memory is polluted with temporary info
- UI added without using MUI when feasible
- Engine logic becomes UI-coupled or non-deterministic

---

## 14. Design System Compliance (MANDATORY)

When making **any** UI or styling changes, Codex MUST follow the design system and rules in:
- `docs/design/brutalist_constructivism_locked_ai_prompt_system.md` (imperative)
- `docs/design/brutalist_constructivism_visual_style_bible_markdown.md` (if needed)

Failure to follow these design docs is a HARD FAIL for any UI-related task.

Codex MUST self-check against this file before responding.

---

## 15. UI Command Console Rules (HARD GATE)

These rules apply to **ALL UI work** in Taktik.
They are non-negotiable and exist to prevent regression into generic “web app” UI.

Codex MUST read and comply with:
- `/docs/ui/UI_GLOBAL_RULES.md`

Failure to comply with these rules is a HARD FAIL for any UI-related task.

### 15.1 Core UI Doctrine
- The UI is a **military command console**, not a dashboard.
- Flat, hard-edged, manufactured visuals only.
- No gradients, glow, blur, glass, soft shadows, or rounded corners.
- Borders, frames, plates, and inset lines define hierarchy — not effects.

### 15.2 Board-First Rule
- The board is the primary surface.
- UI elements must support the board, never compete with it.
- Panels appear contextually; no permanent dashboards on small screens.

### 15.3 Frame Hierarchy Rule (CRITICAL)
Every UI container must belong to exactly ONE of these semantic types:
- SURFACE
- FRAME
- PANEL
- FOCUS PANEL

Rules:
- Only ONE outer border (2px) per region.
- Nested components may use dividers or header plates, NOT additional frames.
- “Double box” layouts are forbidden.

### 15.4 Color & Opacity Rule
- All panels must be **fully opaque**.
- Transparency over the board is forbidden.
- Hierarchy must be expressed via approved flat fills, not opacity or shadows.

### 15.5 Interaction Primitives (MANDATORY)
Codex MUST use existing UI primitives:
- `ObliqueKey` for primary actions
- `ObliqueTabBar` for console tabs
- `StatusCapsule` + `ChevronDivider` for state display
- `OverlayPanel` for targeting / critical directives

No ad-hoc buttons or panels are allowed.

### 15.6 Motion Discipline
- Motion must follow defined animation roles (phase advance, intent, panel reveal).
- No animation may move the board or cause layout shift.
- Reduced-motion must be respected.
- Dev-only UI (LOG) must not animate.

### 15.7 Mobile Rule (HARD)
- NO horizontal scrolling at mobile widths.
- Ops Console becomes a bottom sheet on narrow screens.
- Command bar wraps; it must never scroll horizontally.

Codex MUST self-check UI changes against these rules before responding.
