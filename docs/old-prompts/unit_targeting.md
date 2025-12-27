# Taktik — Explicit Card Targeting & Card Rewrite (Codex Instructions)

## Objective
Upgrade the existing card system to support explicit unit targeting while preserving:
- determinism
- UI-agnostic engine design
- effect-based rule overrides

Cards must no longer rely on implicit or global selection. All targeted cards must declare their requirements and receive targets explicitly.

---

## 1. Mandatory Model Changes

### 1.1 Add TargetingSpec

```ts
export type TargetingSpec =
  | {
      type: "unit";
      owner: "self" | "enemy";
      count: 1 | 2;
    }
  | {
      type: "none";
    };
```

### 1.2 Extend CardDefinition

```ts
export type CardDefinition = {
  id: string;
  name: string;
  kind: "bonus" | "malus" | "tactic";
  timing: "immediate" | "stored" | "reaction";
  targeting: TargetingSpec;
  creates: EffectDefinition[];
};
```

Cards without a `targeting` spec are invalid.

---

## 2. Engine Contract (Non-Negotiable)

### 2.1 `PLAY_CARD` action must include targets when required

```ts
export type PlayCardAction = {
  type: "PLAY_CARD";
  cardId: string;
  targets?: {
    unitIds?: UnitId[];
  };
};
```

If a card requires targets and they are missing or invalid, the action must be rejected.

### 2.2 Effect instances carry selected targets

```ts
export type Effect = {
  id: string;
  sourceCardId: string;
  ownerId: PlayerId;
  targetUnitIds?: UnitId[];
  hooks: EffectHooks;
};
```

Targets are immutable once the effect is created.

---

## 3. Target Validation (Engine-Side)

```ts
function validateTargets(
  ctx: EngineContext,
  card: CardDefinition,
  targets?: { unitIds?: UnitId[] }
) {
  if (card.targeting.type === "none") return;
  if (!targets?.unitIds) {
    throw new Error("Targets required");
  }
  if (targets.unitIds.length !== card.targeting.count) {
    throw new Error("Invalid target count");
  }
  for (const unitId of targets.unitIds) {
    const owner = ctx.getUnitOwner(unitId);
    if (
      card.targeting.owner === "enemy" &&
      owner !== ctx.opponentPlayerId
    ) {
      throw new Error("Invalid enemy target");
    }
    if (
      card.targeting.owner === "self" &&
      owner !== ctx.activePlayerId
    ) {
      throw new Error("Invalid friendly target");
    }
  }
}
```

---

## 4. Rewritten Existing Cards (from `cards.ts`)

### Bonus Cards

#### Rapid Supply Convoy
*No targeting*

```ts
export const rapidSupplyConvoy: CardDefinition = {
  id: "rapid_supply_convoy",
  name: "Rapid Supply Convoy",
  kind: "bonus",
  timing: "stored",
  targeting: { type: "none" },
  creates: [
    {
      duration: { type: "untilEndOfTurn" },
      hooks: {
        modifyMovement: (_, __, base) => base + 1,
      },
    },
  ],
};
```

#### Advanced Recon
*Target: 1 friendly unit*

```ts
export const advancedRecon: CardDefinition = {
  id: "advanced_recon",
  name: "Advanced Recon",
  kind: "bonus",
  timing: "stored",
  targeting: { type: "unit", owner: "self", count: 1 },
  creates: [
    {
      duration: { type: "untilEndOfTurn" },
      hooks: {
        modifyMovement: (ctx, unitId, base) =>
          ctx.effect.targetUnitIds?.includes(unitId)
            ? base + 2
            : base,
      },
    },
  ],
};
```

#### Artillery Support
*Target: 1 friendly unit*

```ts
export const artillerySupport: CardDefinition = {
  id: "artillery_support",
  name: "Artillery Support",
  kind: "bonus",
  timing: "stored",
  targeting: { type: "unit", owner: "self", count: 1 },
  creates: [
    {
      duration: { type: "untilEndOfTurn" },
      hooks: {
        modifyAttackRoll: (ctx, roll, meta) =>
          ctx.effect.targetUnitIds?.includes(meta.attackerId)
            ? roll + 2
            : roll,
      },
    },
  ],
};
```

#### Troop Motivation
*No targeting*

```ts
export const troopMotivation: CardDefinition = {
  id: "troop_motivation",
  name: "Troop Motivation",
  kind: "bonus",
  timing: "stored",
  targeting: { type: "none" },
  creates: [
    {
      duration: { type: "untilEndOfTurn" },
      hooks: {
        modifyAttackRoll: (ctx, roll, meta) =>
          ctx.getUnitOwner(meta.attackerId) === ctx.activePlayerId
            ? roll + 1
            : roll,
      },
    },
  ],
};
```

#### Electronic Countermeasures
*No targeting (reactive cancellation handled at play time)*

```ts
export const electronicCountermeasures: CardDefinition = {
  id: "electronic_countermeasures",
  name: "Electronic Countermeasures",
  kind: "bonus",
  timing: "reaction",
  targeting: { type: "none" },
  creates: [
    {
      duration: { type: "untilEndOfTurn" },
      hooks: {},
    },
  ],
};
```

### Malus Cards

#### Enemy Disinformation
*Target: 1 enemy unit*

```ts
export const enemyDisinformation: CardDefinition = {
  id: "enemy_disinformation",
  name: "Enemy Disinformation",
  kind: "malus",
  timing: "immediate",
  targeting: { type: "unit", owner: "enemy", count: 1 },
  creates: [
    {
      duration: { type: "untilEndOfTurn" },
      hooks: {
        canMoveUnit: (ctx, unitId) =>
          !ctx.effect.targetUnitIds?.includes(unitId),
      },
    },
  ],
};
```

#### Ammunition Shortage
*No targeting*

```ts
export const ammunitionShortage: CardDefinition = {
  id: "ammunition_shortage",
  name: "Ammunition Shortage",
  kind: "malus",
  timing: "immediate",
  targeting: { type: "none" },
  creates: [
    {
      duration: { type: "untilEndOfTurn" },
      hooks: {
        modifyAttackRoll: (ctx, roll, meta) =>
          ctx.getUnitOwner(meta.attackerId) === ctx.opponentPlayerId
            ? roll - 2
            : roll,
      },
    },
  ],
};
```

#### Mechanical Failure
*Target: 1 enemy unit*

```ts
export const mechanicalFailure: CardDefinition = {
  id: "mechanical_failure",
  name: "Mechanical Failure",
  kind: "malus",
  timing: "immediate",
  targeting: { type: "unit", owner: "enemy", count: 1 },
  creates: [
    {
      duration: { type: "untilEndOfTurn" },
      hooks: {
        canMoveUnit: (ctx, unitId) =>
          !ctx.effect.targetUnitIds?.includes(unitId),
        canAttack: (ctx, attackerId) =>
          !ctx.effect.targetUnitIds?.includes(attackerId),
      },
    },
  ],
};
```

#### Disrupted Supply Lines
*No targeting*

```ts
export const disruptedSupplyLines: CardDefinition = {
  id: "disrupted_supply_lines",
  name: "Disrupted Supply Lines",
  kind: "malus",
  timing: "immediate",
  targeting: { type: "none" },
  creates: [
    {
      duration: { type: "untilEndOfTurn" },
      hooks: {
        modifyMovement: (ctx, unitId, base) =>
          ctx.getUnitOwner(unitId) === ctx.opponentPlayerId
            ? Math.max(0, base - 1)
            : base,
      },
    },
  ],
};
```

#### UN Ceasefire
*No targeting*

```ts
export const unCeasefire: CardDefinition = {
  id: "un_ceasefire",
  name: "UN Ceasefire",
  kind: "malus",
  timing: "immediate",
  targeting: { type: "none" },
  creates: [
    {
      duration: { type: "untilEndOfTurn" },
      hooks: {
        canAttack: () => false,
      },
    },
  ],
};
```

---

## 5. Final Constraints (Do Not Violate)

- Cards never auto-select targets
- UI supplies targets, engine validates them
- Effects reference only their own `targetUnitIds`
- No `if (card.id === ...)` anywhere in the engine
- No global mutable "selected unit" state

If Codex follows this file, the card system will be:
- tactically meaningful
- replay-safe
- multiplayer-ready
- extensible without refactors
