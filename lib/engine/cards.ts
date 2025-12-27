import type { CardDefinition } from "./gameState";

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
          ctx.effect.targetUnitIds?.includes(unitId) ? base + 2 : base,
      },
    },
  ],
};

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
          ctx.effect.targetUnitIds?.includes(meta.attackerId) ? roll + 2 : roll,
      },
    },
  ],
};

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
          ctx.getUnitOwner(meta.attackerId) === ctx.activePlayerId ? roll + 1 : roll,
      },
    },
  ],
};

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
        canMoveUnit: (ctx, unitId) => !ctx.effect.targetUnitIds?.includes(unitId),
      },
    },
  ],
};

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
          ctx.getUnitOwner(meta.attackerId) === ctx.opponentPlayerId ? roll - 2 : roll,
      },
    },
  ],
};

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
        canMoveUnit: (ctx, unitId) => !ctx.effect.targetUnitIds?.includes(unitId),
        canAttack: (ctx, attackerId) => !ctx.effect.targetUnitIds?.includes(attackerId),
      },
    },
  ],
};

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
          ctx.getUnitOwner(unitId) === ctx.opponentPlayerId ? Math.max(0, base - 1) : base,
      },
    },
  ],
};

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

export const commonDeckCards: CardDefinition[] = [
  rapidSupplyConvoy,
  advancedRecon,
  artillerySupport,
  troopMotivation,
  electronicCountermeasures,
  enemyDisinformation,
  ammunitionShortage,
  mechanicalFailure,
  disruptedSupplyLines,
  unCeasefire,
];

export const tacticalDeckCards: CardDefinition[] = [
  rapidSupplyConvoy,
  advancedRecon,
  artillerySupport,
  troopMotivation,
  electronicCountermeasures,
];

export const cardById = new Map(commonDeckCards.map((card) => [card.id, card]));
