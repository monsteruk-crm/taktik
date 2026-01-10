import type { CardDefinition } from "./gameState";
import {
  commandersLuck,
  denseFog,
  precisionShot,
  suppressiveFire,
  tacticalBlock,
} from "./cards/tactics";

export const rapidSupplyConvoy: CardDefinition = {
  id: "rapid_supply_convoy",
  name: "Rapid Supply Convoy",

  summary: "All your units gain +1 movement for the rest of the turn.",
  usage: "Play during your turn to temporarily increase the mobility of your forces.",
  images: {
    hi: "/assets/cards/hi/rapid_supply_convoy.png",
    lo: "/assets/cards/lo/rapid_supply_convoy.png",
  },

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

  summary: "One selected friendly unit gains increased movement this turn.",
  usage: "Choose one of your units. Use this card to rapidly reposition it.",
  images: {
    hi: "/assets/cards/hi/advanced_recon.png",
    lo: "/assets/cards/lo/advanced_recon.png",
  },

  kind: "bonus",
  timing: "stored",
  targeting: { type: "unit", owner: "self", count: 1, maxCount: 1 },
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


export const artillerySupport: CardDefinition = {
  id: "artillery_support",
  name: "Artillery Support",

  summary: "One friendly unit gains a significant attack bonus this turn.",
  usage: "Select one of your units before attacking to increase its firepower.",
  images: {
    hi: "/assets/cards/hi/artillery_support.png",
    lo: "/assets/cards/lo/artillery_support.png",
  },

  kind: "bonus",
  timing: "stored",
  targeting: { type: "unit", owner: "self", count: 1, maxCount: 1 },
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


export const troopMotivation: CardDefinition = {
  id: "troop_motivation",
  name: "Troop Motivation",

  summary: "All friendly units gain improved combat effectiveness this turn.",
  usage: "Play before attacking to boost the morale and accuracy of your troops.",
  images: {
    hi: "/assets/cards/hi/troop_motivation.png",
    lo: "/assets/cards/lo/troop_motivation.png",
  },

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


export const electronicCountermeasures: CardDefinition = {
  id: "electronic_countermeasures",
  name: "Electronic Countermeasures",

  summary: "Negates the impact of enemy disruption effects this turn.",
  usage: "Play in reaction to an enemy malus to protect your operations.",
  images: {
    hi: "/assets/cards/hi/electronic_countermeasures.png",
    lo: "/assets/cards/lo/electronic_countermeasures.png",
  },

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

  summary: "One enemy unit is misled and cannot move this turn.",
  usage: "Select an enemy unit to temporarily block its movement.",
  images: {
    hi: "/assets/cards/hi/enemy_disinformation.png",
    lo: "/assets/cards/lo/enemy_disinformation.png",
  },

  kind: "malus",
  timing: "immediate",
  targeting: { type: "unit", owner: "enemy", count: 1, maxCount: 1 },
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

export const ammunitionShortage: CardDefinition = {
  id: "ammunition_shortage",
  name: "Ammunition Shortage",

  summary: "Enemy attacks are less effective due to lack of supplies.",
  usage: "Play immediately to reduce the enemy’s attack effectiveness this turn.",
  images: {
    hi: "/assets/cards/hi/ammunition_shortage.png",
    lo: "/assets/cards/lo/ammunition_shortage.png",
  },

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

export const mechanicalFailure: CardDefinition = {
  id: "mechanical_failure",
  name: "Mechanical Failure",

  summary: "One enemy unit suffers a breakdown and cannot act this turn.",
  usage: "Choose an enemy unit to prevent it from moving or attacking.",
  images: {
    hi: "/assets/cards/hi/mechanical_failure.png",
    lo: "/assets/cards/lo/mechanical_failure.png",
  },

  kind: "malus",
  timing: "immediate",
  targeting: { type: "unit", owner: "enemy", count: 1, maxCount: 1 },
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

export const disruptedSupplyLines: CardDefinition = {
  id: "disrupted_supply_lines",
  name: "Disrupted Supply Lines",

  summary: "Enemy movement is reduced due to logistical disruption.",
  usage: "Play immediately to slow down enemy maneuvers this turn.",
  images: {
    hi: "/assets/cards/hi/disrupted_supply_lines.png",
    lo: "/assets/cards/lo/disrupted_supply_lines.png",
  },

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


export const unCeasefire: CardDefinition = {
  id: "un_ceasefire",
  name: "UN Ceasefire",

  summary: "All combat operations are suspended for the remainder of the turn.",
  usage: "Play immediately to enforce a temporary ceasefire.",
  images: {
    hi: "/assets/cards/hi/un_ceasefire.png",
    lo: "/assets/cards/lo/un_ceasefire.png",
  },

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
  precisionShot,
  tacticalBlock,
  commandersLuck,
  suppressiveFire,
  denseFog,
];

const allCards = [...commonDeckCards, ...tacticalDeckCards];
export const cardById = new Map(allCards.map((card) => [card.id, card]));
