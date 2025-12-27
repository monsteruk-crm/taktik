## Shared Types (assumed to exist)

I'm assuming these already exist from your engine refactor:

```ts
type PlayerId = string
type UnitId = string
type Phase = 'DRAW' | 'RESOLVE_CARD' | 'MOVE' | 'ATTACK' | 'DICE' | 'END'

type EngineContext = {
  activePlayerId: PlayerId
  opponentPlayerId: PlayerId
  // helper selectors
  getUnitOwner(unitId: UnitId): PlayerId
  isUnitDamaged(unitId: UnitId): boolean
  // dynamic selections injected at effect creation time
  selectedUnitId?: UnitId
}
```

---

## BONUS CARDS (5)

### 1. Rapid Supply Convoy
Effect: +1 movement to all units for the rest of the turn

```ts
export const RapidSupplyConvoy: CardDefinition = {
  id: 'rapid_supply_convoy',
  name: 'Rapid Supply Convoy',
  kind: 'bonus',
  timing: 'stored',
  creates: [
    {
      duration: { type: 'untilEndOfTurn' },
      hooks: {
        modifyMovement: (_, __, base) => base + 1
      }
    }
  ]
}
```

---

### 2. Advanced Recon
Effect: One extra unit may move this turn (implemented as movement bonus for one chosen unit)

```ts
export const AdvancedRecon: CardDefinition = {
  id: 'advanced_recon',
  name: 'Advanced Recon',
  kind: 'bonus',
  timing: 'stored',
  creates: [
    {
      duration: { type: 'untilEndOfTurn' },
      hooks: {
        modifyMovement: (ctx, unitId, base) =>
          unitId === ctx.selectedUnitId ? base + 2 : base
      }
    }
  ]
}
```

---

### 3. Artillery Support
Effect: +2 to attack roll for one unit this turn

```ts
export const ArtillerySupport: CardDefinition = {
  id: 'artillery_support',
  name: 'Artillery Support',
  kind: 'bonus',
  timing: 'stored',
  creates: [
    {
      duration: { type: 'untilEndOfTurn' },
      hooks: {
        modifyAttackRoll: (ctx, roll) =>
          ctx.selectedUnitId ? roll + 2 : roll
      }
    }
  ]
}
```

---

### 4. Troop Motivation
Effect: All friendly units get +1 to attack rolls

```ts
export const TroopMotivation: CardDefinition = {
  id: 'troop_motivation',
  name: 'Troop Motivation',
  kind: 'bonus',
  timing: 'stored',
  creates: [
    {
      duration: { type: 'untilEndOfTurn' },
      hooks: {
        modifyAttackRoll: (ctx, roll, meta) =>
          ctx.getUnitOwner(meta.attackerId) === ctx.activePlayerId
            ? roll + 1
            : roll
      }
    }
  ]
}
```

---

### 5. Electronic Countermeasures
Effect: Cancels one enemy malus effect (note: actual cancellation should remove enemy effects at play-time; this card provides the structural hook)

```ts
export const ElectronicCountermeasures: CardDefinition = {
  id: 'electronic_countermeasures',
  name: 'Electronic Countermeasures',
  kind: 'bonus',
  timing: 'reaction',
  creates: [
    {
      duration: { type: 'untilEndOfTurn' },
      hooks: {
        canMoveUnit: () => true,
        canAttack: () => true
      }
    }
  ]
}
```

---

## MALUS CARDS (5)

### 1. Enemy Disinformation
Effect: One chosen enemy unit cannot move this turn

```ts
export const EnemyDisinformation: CardDefinition = {
  id: 'enemy_disinformation',
  name: 'Enemy Disinformation',
  kind: 'malus',
  timing: 'immediate',
  creates: [
    {
      duration: { type: 'untilEndOfTurn' },
      hooks: {
        canMoveUnit: (ctx, unitId) => unitId !== ctx.selectedUnitId
      }
    }
  ]
}
```

---

### 2. Ammunition Shortage
Effect: All enemy attacks suffer −2 to roll

```ts
export const AmmunitionShortage: CardDefinition = {
  id: 'ammunition_shortage',
  name: 'Ammunition Shortage',
  kind: 'malus',
  timing: 'immediate',
  creates: [
    {
      duration: { type: 'untilEndOfTurn' },
      hooks: {
        modifyAttackRoll: (ctx, roll, meta) =>
          ctx.getUnitOwner(meta.attackerId) === ctx.opponentPlayerId
            ? roll - 2
            : roll
      }
    }
  ]
}
```

---

### 3. Mechanical Failure
Effect: One enemy unit cannot move or attack

```ts
export const MechanicalFailure: CardDefinition = {
  id: 'mechanical_failure',
  name: 'Mechanical Failure',
  kind: 'malus',
  timing: 'immediate',
  creates: [
    {
      duration: { type: 'untilEndOfTurn' },
      hooks: {
        canMoveUnit: (ctx, unitId) => unitId !== ctx.selectedUnitId,
        canAttack: (ctx, attackerId) => attackerId !== ctx.selectedUnitId
      }
    }
  ]
}
```

---

### 4. Disrupted Supply Lines
Effect: Enemy movement −1 (minimum 0)

```ts
export const DisruptedSupplyLines: CardDefinition = {
  id: 'disrupted_supply_lines',
  name: 'Disrupted Supply Lines',
  kind: 'malus',
  timing: 'immediate',
  creates: [
    {
      duration: { type: 'untilEndOfTurn' },
      hooks: {
        modifyMovement: (ctx, unitId, base) =>
          ctx.getUnitOwner(unitId) === ctx.opponentPlayerId
            ? Math.max(0, base - 1)
            : base
      }
    }
  ]
}
```

---

### 5. UN Ceasefire
Effect: No attacks for the rest of the turn

```ts
export const UNCeasefire: CardDefinition = {
  id: 'un_ceasefire',
  name: 'UN Ceasefire',
  kind: 'malus',
  timing: 'immediate',
  creates: [
    {
      duration: { type: 'untilEndOfTurn' },
      hooks: {
        canAttack: () => false
      }
    }
  ]
}
```
