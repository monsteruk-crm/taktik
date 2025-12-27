# Taktik — Card System Refactor (Codex Instructions)

## Goal

Refactor the card system so cards can meaningfully affect gameplay as described in the Taktik manual.

Cards must:
- Override rules, not just tweak numbers
- Persist across phases or turns when needed
- Be cancelable, stackable, and expirable
- Remain fully deterministic
- Stay UI-agnostic

This document replaces the current card mechanic design.

---

## Core Principle (Do Not Deviate)

Cards do NOT directly change game state.  
Cards produce Effects.  
Effects modify how rules are evaluated.

All rule checks (movement, attack, dice, etc.) must flow through active Effects.

---

## High-Level Architecture

CardDefinition ──▶ EffectDefinition ──▶ EffectInstance  
▼  
Rule Evaluation

## 1. Card Definitions (Data Only)

Cards are declarative. They describe what effects they create, nothing else.

### Type

```ts
export type CardKind = 'bonus' | 'malus' | 'tactic'
export type CardTiming = 'immediate' | 'stored' | 'reaction'
```

### CardDefinition

```ts
export type CardDefinition = {
  id: string
  name: string
  kind: CardKind
  timing: CardTiming
  creates: EffectDefinition[]
}
```

Cards must not:
- Inspect game state
- Directly block actions
- Directly move units
- Contain procedural logic

---

## 2. Effect System (Mandatory)

### EffectDefinition (Blueprint)

```ts
export type EffectDuration =
  | { type: 'untilEndOfTurn' }
  | { type: 'untilPhase'; phase: Phase }
  | { type: 'nTurns'; turns: number }

export type EffectDefinition = {
  duration: EffectDuration
  hooks: EffectHooks
}
```

### EffectInstance (Runtime)

```ts
export type Effect = {
  id: string
  sourceCardId: string
  ownerId: PlayerId
  remainingTurns?: number
  expiresAtPhase?: Phase
  hooks: EffectHooks
}
```

All active effects are stored in:

```ts
matchState.activeEffects: Effect[]
```

---

## 3. Effect Hooks (Rule Overrides)

Effects influence the engine exclusively through hooks.

```ts
export type EffectHooks = {
  canMoveUnit?: (ctx: EngineContext, unitId: UnitId) => boolean

  canAttack?: (
    ctx: EngineContext,
    attackerId: UnitId,
    targetId: UnitId
  ) => boolean

  modifyMovement?: (
    ctx: EngineContext,
    unitId: UnitId,
    baseMovement: number
  ) => number

  modifyAttackRoll?: (
    ctx: EngineContext,
    roll: number,
    meta: AttackMeta
  ) => number

  onPhaseStart?: (ctx: EngineContext, phase: Phase) => void
}
```

Hooks must be:
- Pure
- Deterministic
- Side-effect free (except `onPhaseStart`)

---

## 4. Rule Evaluation (Critical)

### ❌ Forbidden Pattern

`if (unit.canMove && !ceasefire) move()`

### ✅ Required Pattern

```js
function canUnitMove(ctx, unitId) {
  return ctx.activeEffects.every(
    effect => effect.hooks.canMoveUnit?.(ctx, unitId) ?? true
  )
}
```

### Movement Calculation

```js
function getUnitMovement(ctx, unitId) {
  const base = getBaseMovement(unitId)

  return ctx.activeEffects.reduce(
    (value, effect) =>
      effect.hooks.modifyMovement?.(ctx, unitId, value) ?? value,
    base
  )
}
```

All rules must be evaluated this way.

---

## 5. Card Resolution Flow

### On Card Draw

1. Draw card from deck
2. If `kind === 'malus'`:
   - Must be resolved immediately
   - May be canceled by a bonus card
3. If `kind === 'bonus'`:
   - Player chooses:
     - Play now → create effects
     - Store face-down (max 6)

### Playing a Card

```js
function playCard(ctx, card: CardDefinition, ownerId: PlayerId) {
  for (const def of card.creates) {
    ctx.activeEffects.push(instantiateEffect(def, card.id, ownerId))
  }
}
```

---

## 6. Effect Expiration

Effects expire automatically.

### At Phase Start

```js
onPhaseStart(ctx, phase) {
  // remove effects with expiresAtPhase === phase
}
```

### At Turn End

```js
// decrement remainingTurns
// remove effects with remainingTurns === 0
```

No card manually cleans itself up.

---

## 7. Concrete Card Examples (Implement Exactly)

### UN Ceasefire (Malus)

```json
{
  "id": "un_ceasefire",
  "name": "UN Ceasefire",
  "kind": "malus",
  "timing": "immediate",
  "creates": [{
    "duration": { "type": "untilEndOfTurn" },
    "hooks": {
      "canAttack": () => false
    }
  }]
}
```

Effect: no attacks this turn.

### Enemy Disinformation (Malus)

```json
{
  "id": "enemy_disinformation",
  "name": "Enemy Disinformation",
  "kind": "malus",
  "timing": "immediate",
  "creates": [{
    "duration": { "type": "untilEndOfTurn" },
    "hooks": {
      "canMoveUnit": (ctx, unitId) =>
        unitId !== ctx.disinformationBlockedUnit
    }
  }]
}
```

Blocked unit is chosen by opponent when effect is created.

### Rapid Supply Convoy (Bonus)

```json
{
  "id": "rapid_supply_convoy",
  "name": "Rapid Supply Convoy",
  "kind": "bonus",
  "timing": "stored",
  "creates": [{
    "duration": { "type": "untilEndOfTurn" },
    "hooks": {
      "modifyMovement": (_, __, base) => base + 1
    }
  }]
}
```

---

## 8. Cancellation Rules

Canceling a malus:
- Removes its Effect instances
- Does NOT “negate flags”
- Is done by deleting effects from `activeEffects`

---

## 9. Determinism Rules (Non-Negotiable)

- Effects are pure functions
- All randomness comes from the engine RNG
- Effects never call `Math.random`
- Effect creation is logged as an event
- Effect expiration is deterministic

---

## 10. Migration Checklist (Execute in Order)

1. Add `activeEffects` to match state
2. Remove card-specific logic from movement/combat
3. Route all rule checks through effects
4. Convert existing cards to Effect-based definitions
5. Delete unused card flags and booleans
6. Ensure effects expire automatically
