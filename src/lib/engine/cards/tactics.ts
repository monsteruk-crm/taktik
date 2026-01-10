import {CardDefinition} from "@/lib/engine";

export const precisionShot: CardDefinition = {
    id: "precision_shot",
    name: "Precision Shot",

    summary: "A selected unit delivers a highly accurate attack.",
    usage: "Play before rolling attack dice to increase attack effectiveness.",
    images: {
        hi: "/assets/cards/hi/precision_shot.png",
        lo: "/assets/cards/lo/precision_shot.png",
    },

    kind: "tactic",
    timing: "reaction",
    reactionWindow: "beforeAttackRoll",
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

export const tacticalBlock: CardDefinition = {
    id: "tactical_block",
    name: "Tactical Block",

    summary: "An enemy attack is neutralized at the last moment.",
    usage: "Play when an enemy declares an attack to cancel it.",
    images: {
        hi: "/assets/cards/hi/tactical_block.png",
        lo: "/assets/cards/lo/tactical_block.png",
    },

    kind: "tactic",
    timing: "reaction",
    reactionWindow: "beforeAttackRoll",
    targeting: { type: "unit", owner: "enemy", count: 1, maxCount: 1 },

    creates: [
        {
            duration: { type: "untilEndOfTurn" },
            hooks: {
                canAttack: (ctx, attackerId) =>
                    !ctx.effect.targetUnitIds?.includes(attackerId),
            },
        },
    ],
};

export const commandersLuck: CardDefinition = {
    id: "commanders_luck",
    name: "Commander’s Luck",

    summary: "You may reroll a critical attack roll.",
    usage: "Play immediately after an attack roll to reroll it.",
    images: {
        hi: "/assets/cards/hi/commanders_luck.png",
        lo: "/assets/cards/lo/commanders_luck.png",
    },

    kind: "tactic",
    timing: "reaction",
    reactionWindow: "afterAttackRoll",
    targeting: { type: "none" },

    creates: [
        {
            duration: { type: "untilEndOfTurn" },
            hooks: {}, // reroll handled by engine on reaction
        },
    ],
};

export const suppressiveFire: CardDefinition = {
    id: "suppressive_fire",
    name: "Suppressive Fire",

    summary: "Enemy movement is hindered by continuous fire.",
    usage: "Play before an enemy moves to reduce their mobility.",
    images: {
        hi: "/assets/cards/hi/suppressive_fire.png",
        lo: "/assets/cards/lo/suppressive_fire.png",
    },

    kind: "tactic",
    timing: "reaction",
    reactionWindow: "beforeMove",
    targeting: { type: "unit", owner: "enemy", count: 1, maxCount: 1 },

    creates: [
        {
            duration: { type: "untilEndOfTurn" },
            hooks: {
                modifyMovement: (ctx, unitId, base) =>
                    ctx.effect.targetUnitIds?.includes(unitId)
                        ? Math.max(0, base - 1)
                        : base,
            },
        },
    ],
};

export const denseFog: CardDefinition = {
    id: "dense_fog",
    name: "Dense Fog",

    summary: "Poor visibility reduces combat effectiveness.",
    usage: "Play before attacks to reduce all hit chances this turn.",
    images: {
        hi: "/assets/cards/hi/dense_fog.png",
        lo: "/assets/cards/lo/dense_fog.png",
    },

    kind: "tactic",
    timing: "reaction",
    reactionWindow: "beforeAttackRoll",
    targeting: { type: "none" },

    creates: [
        {
            duration: { type: "untilEndOfTurn" },
            hooks: {
                modifyAttackRoll: (_ctx, roll) => roll - 1,
            },
        },
    ],
};
