import type {
  BoardCell,
  GamePhase,
  Player,
  TerrainBiomeStats,
  TerrainType,
  UnitType,
} from "@/types/core";
import type { TerrainParams } from "@/types/settings";

export type { GamePhase, Player, UnitType, BoardCell, TerrainType, TerrainBiomeStats } from "@/types/core";

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
  hi: string;
  lo: string;
};

export type CardDefinition = {
  id: string;
  name: string;
  summary: string;
  usage: string;
  images: CardImages;
  kind: CardKind;
  timing: CardTiming;
  targeting: TargetingSpec;
  creates: EffectDefinition[];
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
