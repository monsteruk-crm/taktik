# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Taktik** is a turn-based tactical board game with a deterministic rules engine and a military command console UI. The project follows strict documentation and design system rules to maintain consistency and quality.

**Game Manual Source of Truth**: `docs/Taktik_Manual_EN.md`

## Core Development Principles

1. **MVP first**: correctness > completeness > polish
2. **Engine determinism**: The engine must be deterministic and UI-agnostic
3. **No real-time elements** in the rules engine
4. **Explicit phase transitions** (no hidden state)
5. **Randomness must be seed-based** and reproducible

## Common Commands

### Development
```bash
npm run dev              # Start Next.js dev server at http://localhost:3000
npm run build           # Create production build
npm run start           # Run production server (requires build first)
npm run lint            # Run ESLint (Next.js core web vitals + TypeScript)
npm run gen:assets      # Generate placeholder PNG assets
```

### Environment Variables
- Secrets go in `.env.local` (never commit)
- `NEXT_PUBLIC_SHOW_DEV_LOGS=true` - Show dev-only LOG tab in UI

## Project Structure

### Directory Layout
```
src/
├── app/                    # Next.js 16 App Router (pages, layouts, route handlers)
│   ├── page.tsx           # Main game UI (hotseat MVP)
│   ├── layout.tsx         # Root layout
│   └── ThemeRegistry.tsx  # MUI theme provider
├── components/            # React UI components
│   ├── ui/               # Reusable UI primitives (ObliqueKey, Frame, etc.)
│   ├── BoardViewport.tsx # Pan/zoom container for board
│   ├── IsometricBoard.tsx # Isometric grid renderer with hit testing
│   ├── OpsConsole.tsx    # Main operations console panel
│   └── ...
├── lib/
│   ├── engine/           # Deterministic game rules engine (UI-agnostic)
│   │   ├── gameState.ts  # Core types: GameState, Unit, Card, Effect
│   │   ├── reducer.ts    # Pure state machine (all rule enforcement)
│   │   ├── cards.ts      # Card definitions (data + effect hooks)
│   │   ├── cards/tactics.ts # Tactical reaction cards
│   │   ├── movement.ts   # Move-range computation (8-direction)
│   │   ├── reactions.ts  # Reaction window validation logic
│   │   ├── rng.ts        # Deterministic d6 (LCG-based)
│   │   ├── selectors.ts  # Grid helpers (posKey, inBounds, unitAt)
│   │   └── index.ts      # Public engine surface
│   └── ui/               # UI-specific utilities
│       ├── iso.ts        # Isometric projection (gridToScreen, screenToGrid)
│       ├── theme.ts      # MUI theme definition
│       ├── semanticColors.ts # Color system
│       ├── motion.ts     # Animation tokens and reduced-motion hook
│       └── ...
docs/                      # All project documentation (REQUIRED)
public/assets/            # Static assets (tiles, units, card art)
scripts/                  # Build/generation scripts
```

### Path Resolution
- `@/*` resolves to `src/*` (configured in tsconfig.json)
- Example: `import { gameReducer } from "@/lib/engine"`

## Architecture

### Engine ↔ UI Boundary
- **Engine** (`src/lib/engine/**`): Pure, deterministic reducer over `GameState`
- **UI** (`src/app/**`, `src/components/**`, `src/lib/ui/**`): Interacts with engine only via `(state, dispatch(action))`
- Engine must remain UI-agnostic: no React, no DOM, no timers, no real-time assumptions

### Deterministic Simulation
- Complete game state is in `GameState` (serializable, no functions stored)
- All randomness derives from `rngSeed` (32-bit unsigned number)
- Same initial state + same action sequence = same output
- RNG uses LCG (Linear Congruential Generator) in `lib/engine/rng.ts`
- Deck shuffling uses deterministic Fisher-Yates with same seed

### Turn Flow / Phases
Explicit phase enum enforced by reducer:
```
TURN_START → CARD_DRAW → CARD_RESOLUTION → MOVEMENT → ATTACK → DICE_RESOLUTION → END_TURN
```

Phase enforcement is partial (see `docs/engine.md` for details).

### Card & Effect System
- Cards defined in `lib/engine/cards.ts` with `kind`, `timing`, `targeting`, and `creates` (effects)
- Effects use hook system: `canMoveUnit`, `canAttack`, `modifyMovement`, `modifyAttackRoll`
- Tactic cards are reaction-based with windows: `beforeMove`, `beforeAttackRoll`, `afterAttackRoll`, `beforeDamage`
- Reaction windows are **derived** via `getOpenReactionWindows(state)` in `lib/engine/reactions.ts`

## UI Framework & Design System

### UI Component Primitives (MANDATORY)
Use existing UI primitives for all interactions:
- **`ObliqueKey`**: primary action buttons (parallelogram command keys)
- **`ObliqueTabBar`**: console tabs (joined, no gaps)
- **`StatusCapsule` + `ChevronDivider`**: status readouts
- **`OverlayPanel`**: targeting / critical directives (opaque focus panel)
- **`Frame`**: outer boundaries
- **`Plate`**: content slabs

**No ad-hoc buttons or panels are allowed.**

### MUI Integration
- Use MUI components for every UI element when possible
- MUI component index: `docs/mui_index.md`
- Use the `mui-mcp` server for MUI documentation questions
- Theme defined in `src/lib/ui/theme.ts`

### Design System Rules (NON-NEGOTIABLE)
Read and comply with:
- **`docs/design/UI_GLOBAL_RULES.md`** (HARD GATE for all UI work)
- **`docs/design/brutalist_constructivism_locked_ai_prompt_system.md`** (for visual assets)

**Core UI Doctrine:**
- The UI is a **military command console**, not a dashboard
- Flat, hard-edged, manufactured visuals only
- **No gradients, glow, blur, glass, soft shadows, or rounded corners**
- Borders, frames, plates, and inset lines define hierarchy — not effects
- All panels must be **fully opaque** (no transparency over the board)
- Board is the primary surface; UI elements support it, never compete

### Frame Hierarchy (CRITICAL)
Every UI container must be one of:
- SURFACE (page/app background)
- FRAME (outer boundary)
- PANEL (content slab inside frame)
- FOCUS PANEL (targeting / critical prompts)

**Rules:**
- Only ONE outer border (2px) per region
- Nested components may use dividers or header plates, NOT additional frames
- "Double box" layouts are forbidden

### Color System
Use semantic colors from `src/lib/ui/semanticColors.ts`:
- **MOVE = blue**
- **ATTACK = red**
- **DICE = yellow**
- **END TURN / CONFIRM = black**
- Active controls MUST use filled semantic color
- Inactive controls use neutral fill + accent stripe

### Motion Rules
- Defined in `src/lib/ui/motion.ts`
- Use `useReducedMotion()` hook
- No animation may move the board or cause layout shift
- Dev-only UI (LOG) must not animate

### Responsive Breakpoints
- Desktop: OpsConsole is a right dock
- Mobile (`max-width: 1100px`): OpsConsole becomes bottom sheet
- **NO horizontal scrolling at mobile widths (HARD RULE)**

## Documentation Requirements (MANDATORY)

**CRITICAL**: Every code change MUST include documentation updates. No documentation = task is INCOMPLETE.

### Required Documentation Files

#### 1. Progress Log (ALWAYS REQUIRED)
**File**: `docs/progress.md`

Append ONE entry per milestone with:
- Date (YYYY-MM-DD)
- Milestone name
- What was implemented (concrete)
- What is still missing
- Known limitations / TODOs
- Files touched (high-level list)

Must explain:
- What the system could do BEFORE
- What the system can do NOW
- What the NEXT logical step is

#### 2. System Design (WHEN ENGINE CHANGES)
**File**: `docs/engine.md`

Update when any of these change:
- Rules / phases / phase transitions
- Deterministic behavior
- Card logic or targeting
- RNG usage / seed flow

Required sections:
- Purpose
- Core rules (derived from `docs/Taktik_Manual_EN.md`)
- Data model (types + invariants)
- Turn flow / phases
- Determinism & RNG
- Edge cases
- Open questions

#### 3. Feature-Specific Docs (WHEN APPLICABLE)
One file per feature in `docs/` (kebab-case naming)

Each feature doc MUST answer:
- What this feature does
- Why it exists (rule source / manual reference)
- Constraints
- Edge cases
- How to test it manually

### Code–Doc Coupling Rule
Every code change MUST reference:
- Which doc file was updated
- Which section was added or modified

### Additional Documentation
- **Architecture**: `docs/architecture.md`
- **Cards System**: `docs/cards-system.md`
- **UI Global Rules**: `docs/design/UI_GLOBAL_RULES.md`
- **Visual Style**: `docs/design/brutalist_constructivism_locked_ai_prompt_system.md`
- **Design Bible**: `docs/design/brutalist_constructivism_visual_style_bible_markdown.md`
- **Manual E2E Test Checklist**: `docs/manual-e2e-test.md`

## Memory MCP Rules (STRICT)

Memory MCP is NOT a log. Store ONLY durable facts.

### What qualifies for MCP memory
Store ONLY:
- Final architectural decisions
- Chosen data models
- Engine invariants (hard rules)
- Naming conventions that must persist
- Determinism/RNG contract
- "Always true" constraints from the manual

DO NOT store:
- TODOs
- Partial ideas
- Experiments
- Temporary refactors
- "Current work in progress" state

### MCP write rule
When introducing or confirming a durable rule:
1. Write it to documentation (usually `docs/engine.md` or feature doc)
2. Store it in MCP memory (short, durable statement)

If unsure → do NOT write to MCP.

## Coding Style

- **Language**: TypeScript + React (TSX) with Next.js 16 App Router
- **Formatting**: Follow ESLint rules in `eslint.config.mjs`
- **Indentation**: 2 spaces
- **Naming**:
  - Components: `PascalCase`
  - Hooks/utilities: `camelCase`
  - Files: Match component name or use `camelCase` for utilities

## Testing

No test framework currently exists. If you add tests:
- Keep them close to source (`app/**/__tests__/` or `app/**/*.test.tsx`)
- Document test commands in `package.json` and update `AGENTS.md` & `WARP.md`

## Version Control

- Git history uses clear, imperative messages (e.g., `Add auth callback handler`)
- PRs should include summary, testing notes, and screenshots for UI changes
- **IMPORTANT**: NEVER commit changes unless explicitly asked
- When committing, include co-author line: `Co-Authored-By: Warp <agent@warp.dev>`

## Security

- Store secrets in `.env.local` (do not commit)
- Never reveal or consume secrets in plain-text in shell commands
- Use environment variables for sensitive data

## Common Development Patterns

### Engine State Updates
Always use the reducer via `dispatch`:
```typescript
const [state, dispatch] = useReducer(gameReducer, initialGameState);
dispatch({ type: "MOVE_UNIT", unitId, position: { x, y } });
```

### Isometric Projection
Use utilities from `src/lib/ui/iso.ts`:
```typescript
import { gridToScreen, screenToGrid } from "@/lib/ui/iso";
const { x: screenX, y: screenY } = gridToScreen(gridX, gridY);
const gridPos = screenToGrid(screenX, screenY, boardOrigin);
```

### Move Range Calculation
```typescript
import { getMoveRange } from "@/lib/engine/movement";
const moveRange = getMoveRange(state, unitId);
```

### Reaction Windows
```typescript
import { getOpenReactionWindows } from "@/lib/engine";
const openWindows = getOpenReactionWindows(state);
```

## Failure Conditions (IMPORTANT)

The task MUST be considered FAILED if:
- No documentation is written
- Docs exist but are empty/generic or not updated for the change
- Progress is not summarized (BEFORE/NOW/NEXT missing)
- MCP memory is polluted with temporary info
- UI added without using MUI when feasible
- Engine logic becomes UI-coupled or non-deterministic
- UI violates design system rules (gradients, rounded corners, transparency over board, etc.)
- "Double box" layouts (nested outer borders)
- Horizontal scrolling on mobile

## Additional Resources

- **Next.js 16 Documentation**: https://nextjs.org/docs
- **MUI Documentation**: https://mui.com/material-ui/
- **Game Manual**: `docs/Taktik_Manual_EN.md`
- **Progress Log**: `docs/progress.md`
- **Engine Documentation**: `docs/engine.md`
