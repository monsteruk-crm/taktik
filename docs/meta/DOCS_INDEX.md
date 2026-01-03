# Canonical Docs Index (Taktik)

This file exists to stop documentation sprawl.

## Tier 0 — Must read (always)
- AGENTS.md (Codex contract)
- docs/Taktik_Manual_EN.md (rules source of truth)
- docs/meta/CONTEXT_PACK.md (compressed briefing)

## Tier 1 — Core system docs (update these, don’t fork)
- docs/engine.md — rules, phases, determinism, invariants
- docs/cards-system.md — common deck, bonus/malus logic
- docs/tactics-cards.md — tactic cards + UX/implementation boundaries
- docs/architecture.md — boundaries (engine/UI/platform), persistence plan
- docs/progress.md — BEFORE/NOW/NEXT log (one entry per milestone)

## Tier 2 — UI canon (UI work must comply)
- docs/design/UI_GLOBAL_RULES.md
- docs/design/brutalist_constructivism_locked_ai_prompt_system.md
- docs/design/brutalist_constructivism_visual_style_bible_markdown.md
- docs/implementation/TOP_BAR_PHASE_WIREFRAMES.md (authoritative phase wireframes)

## Tier 3 — Reference (do not duplicate; consolidate into Tier 1 when stable)
- docs/implementation/** — working notes, partial specs, iteration logs

## Archive (never extend; only prune/merge)
- docs/old-prompts/** — historical prompts and experiments

## Rule: adding docs
Any new doc MUST be linked from:
- docs/README.md
- this file (docs/meta/DOCS_INDEX.md)
  Otherwise it’s orphaned and should not exist.
