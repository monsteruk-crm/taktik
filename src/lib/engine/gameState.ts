import type { TerrainParams } from "@/lib/settings";

export type GamePhase =
    | "TURN_START"
    | "CARD_DRAW"
    | "CARD_RESOLUTION"
    | "MOVEMENT"
    | "ATTACK"
    | "DICE_RESOLUTION"
    | "END_TURN"
    | "VICTORY";

export type Player = "PLAYER_A" | "PLAYER_B";

export type UnitType = "INFANTRY" | "VEHICLE" | "SPECIAL";

export type BoardCell = { x: number; y: number };

export type TerrainType =
    | "PLAIN"
    | "ROUGH"
    | "FOREST"
    | "URBAN"
    | "INDUSTRIAL"
    | "HILL"
    | "WATER";

export type TerrainBiomeStats = {
    counts: Record<TerrainType, number>;
    regions: Record<TerrainType, number>;
};

export type Unit = {
    id: string;
    owner: Player;
    type: UnitType;
    position: BoardCell;
    movement: number;
    attack: number;
    hasMoved: boolean;
};

export type CardKind = "bonus" | "malus" | "tactic";
export type CardTiming = "immediate" | "stored" | "reaction";

export type ReactionWindow =
    | "beforeMove"
    | "afterMove"
    | "beforeAttackRoll"
    | "afterAttackRoll"
    | "beforeDamage";

export type TargetingSpec =
    | {
    type: "unit";
    owner: "self" | "enemy";
    count: 1 | 2;
}
    | {
    type: "none";
};

export type EffectDuration =
    | { type: "untilEndOfTurn" }
    | { type: "untilPhase"; phase: GamePhase }
    | { type: "nTurns"; turns: number };

export type AttackMeta = {
    attackerId: string;
    targetId: string;
};

export type Effect = {
    id: string;
    sourceCardId: string;
    ownerId: Player;
    remainingTurns?: number;
    expiresAtPhase?: GamePhase;
    targetUnitIds?: string[];
    hooks: EffectHooks;
};

export type EngineContext = {
    activePlayerId: Player;
    opponentPlayerId: Player;
    effect: Effect;
    getUnitOwner: (unitId: string) => Player | null;
    isUnitDamaged: (unitId: string) => boolean;
};

export type EffectHooks = {
    canMoveUnit?: (ctx: EngineContext, unitId: string) => boolean;
    canAttack?: (ctx: EngineContext, attackerId: string, targetId: string) => boolean;
    modifyMovement?: (ctx: EngineContext, unitId: string, baseMovement: number) => number;
    modifyAttackRoll?: (ctx: EngineContext, roll: number, meta: AttackMeta) => number;
    onPhaseStart?: (ctx: EngineContext, phase: GamePhase) => void;
};

export type EffectDefinition = {
    duration: EffectDuration;
    hooks: EffectHooks;
};

export type CardImages = {
    hi: string; // high-resolution artwork
    lo: string; // low-resolution / placeholder
};

export type CardDefinition = {
    id: string;
    name: string;

    // NEW — presentation only
    summary: string;
    usage: string;
    images: CardImages;

    // existing
    kind: "bonus" | "malus" | "tactic";
    timing: "immediate" | "stored" | "reaction";
    targeting: TargetingSpec;
    creates: EffectDefinition[];
    // REQUIRED for tactic cards
    reactionWindow?: ReactionWindow;
};


export type GameState = {
    phase: GamePhase;
    activePlayer: Player;
    turn: number;
    boardWidth: number;
    boardHeight: number;
    units: Unit[];
    movesThisTurn: number;
    terrain: {
        road: BoardCell[];
        river: BoardCell[];
        biomes: TerrainType[][];
        stats: TerrainBiomeStats | null;
        params: TerrainParams;
        seed: number;
    };
    commonDeck: CardDefinition[];
    tacticalDeck: CardDefinition[];
    selectedTacticalDeck: CardDefinition[];
    pendingCard: CardDefinition | null;
    pendingAttack: { attackerId: string; targetId: string } | null;
    storedBonuses: CardDefinition[];
    activeEffects: Effect[];
    nextEffectId: number;
    rngSeed: number;
    lastRoll: { value: number; outcome: "HIT" | "MISS" } | null;
    winner: Player | null;
    log: string[];
};
