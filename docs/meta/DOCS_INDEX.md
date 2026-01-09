# Canonical Docs Index — Taktik

This file defines what is canonical and what is ignored.
If a document is not indexed here, it is NOT authoritative.

---

## Tier 0 — Mandatory context (always read)
- AGENTS.md
- docs/Taktik_Manual_EN.md
- docs/meta/CONTEXT_PACK.md

---

## Tier 1 — Core game system (single source of truth)
- docs/engine.md  
  Phases, determinism, RNG, invariants

- docs/cards-system.md  
  Common deck, bonus/malus rules, storage limits

- docs/tactics-cards.md  
  Tactical cards, UX constraints, interaction rules

- docs/architecture.md  
  Engine/UI boundaries, future persistence

- docs/progress.md  
  BEFORE / NOW / NEXT milestone log

---

## Tier 2 — UI canon
- docs/design/UI_GLOBAL_RULES.md
- docs/design/brutalist_constructivism_visual_style_bible_markdown.md
- docs/design/brutalist_constructivism_locked_ai_prompt_system.md
- docs/ui/COMMAND_UI_WIREFRAMES.md

---

## Tier 3 — QA & checklists
- docs/manual-e2e-test.md

---

## Ignored (NOT sources of truth)
These folders exist for archival or prompt history only.
They MUST NOT be used to infer rules or behavior.

- docs/used-prompts/**
- docs/design/prompts/**
- docs/design/more-prompts/**
- docs/design/svg/**

---

## Prohibited patterns
- Duplicate specs across multiple files
- “Temporary” rules living in root /docs
- TODO files that redefine gameplay rules

If a doc conflicts with Tier 0–2, it must be deleted, merged, or moved to an ignored folder.
