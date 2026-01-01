# CODEX INSTRUCTIONS — Taktik Command UI (Overlay-First, Mobile-Safe)

## Role
You are working on the UI shell only. You **must not** modify the game rules, the engine state machine, card/tactic logic, or phase sequencing. Your job is to present state, not invent it.

## Core UI Principle (non-negotiable)
The board is the product; everything else is a temporary overlay. If an element is always visible, it is wrong unless explicitly listed as “persistent.”

## Persistent UI Elements (all breakpoints)

### 1. Top Command Bar (always visible)
- Fixed position
- Height constant (no `%`, no `vh`)
- Contains player, VP, turn, phase, and phase-legal action buttons only
- Must wrap on mobile (two rows allowed)
- Never hide this bar on mobile

### 2. BoardViewport
- Occupies all remaining vertical space
- Height must be calculated: `height: calc(100dvh - var(--command-bar-height));`
- Forbidden: hardcoded heights (`70vh`, `80vh`, etc.) and scrolling inside the board container

## Non-Persistent Elements (overlays only)

### 3. Context Panel (Unit / Tile / Pending Action)
- Desktop: right-side drawer that overlays the board without resizing it; width fixed between 320 and 420px
- Mobile: bottom sheet with snap points (collapsed peek, half, full)
- Never render this as a permanent column on mobile or show it when nothing is selected

### 4. Cards / Tactics Screen
- Modal overlay with the board remaining visible behind it (dimmed)
- Single screen; no multiple pages
- Pending card is large and central; stored bonuses are secondary
- Tactics UX must remain unchanged

### 5. Log / Intel Screen
- Modal overlay
- No interaction with the board while open

## Mobile Breakpoint Rules (this is why the current layout is broken)
- Desktop drawer logic is reused on mobile
- Fixed widths overflow
- Board height collapses
- Panels compete for vertical space

This is not a styling bug; it is a layout model error. The mandatory mobile layout is a single column with bottom sheets.

### Mandatory Mobile Layout Model
Codex must implement the following vertical stack during mobile breakpoints:
1. Command Bar
2. Board (fills screen)
3. Bottom Sheet (conditional)

Implementation rules:
- Use `useMediaQuery` or CSS container queries to detect mobile
- When `isMobile === true`, disable the right drawer completely
- Render the Context Panel and Cards overlay as bottom sheets that overlay the board (position: fixed)

## Required State Flags (already exist—just consume them)
Codex must derive UI state purely from the engine-provided flags: `selectedUnit`, `selectedTile`, `pendingAttack`, `pendingCard`, `currentPhase`, and `currentPlayer`. Do not duplicate state or introduce derived flags like “isPanelOpen.”

## Component Responsibilities

### `CommandTopBar`
- Purely presentational
- Buttons enabled/disabled based on the current phase

### `BoardViewport`
- No UI logic
- No scroll
- No padding

### `ContextPanel`
- Renders only when a selection or pending action exists
- Desktop: drawer on the right; mobile: bottom sheet

### `CardsOverlay`
- Renders only when `pendingCard !== null` or the user explicitly opens the cards screen

### `LogOverlay`
- Read-only overlay

## Forbidden Patterns (Codex must not do these)
- Permanent side panels
- Responsive grids that shrink the board
- Multiple routes for phases
- UI state stored separately from engine state
- Scrollable “dashboard” layouts
- Mobile hiding critical actions

If Codex implements any of these patterns, the UI is wrong.

## Validation Checklist (Codex must self-verify before marking work done)
- Board fills the screen on an iPhone SE viewport
- No horizontal scrolling on mobile
- Context UI appears only when relevant
- Cards never push the board out of view
- Top bar is always reachable
- No engine logic changes are introduced
