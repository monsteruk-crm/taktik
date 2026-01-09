import type { BoardCell, TerrainBiomeStats, TerrainType } from "@/types/core";
import type { CardDefinition, GameState } from "@/types/engine";
import type { ReactionPlay } from "@/types/reactions";

export type TerrainResult = {
  road: BoardCell[];
  river: BoardCell[];
  biomes: TerrainType[][];
  stats: TerrainBiomeStats;
  nextSeed: number;
};

export type GameBootstrap = {
  seed: number;
  commonDeck: CardDefinition[];
  tacticalDeck: CardDefinition[];
  terrainSeed: number;
};

export type GameAction =
  | { type: "NEXT_PHASE" }
  | { type: "TURN_START" }
  | { type: "END_TURN" }
  | { type: "RESET_GAME"; seed?: number }
  | { type: "LOAD_STATE"; state: GameState }
  | { type: "DRAW_CARD" }
  | { type: "STORE_BONUS" }
  | { type: "PLAY_CARD"; cardId: string; targets?: { unitIds?: string[] } }
  | { type: "ATTACK_SELECT"; attackerId: string; targetId: string }
  | { type: "ROLL_DICE"; reaction?: ReactionPlay }
  | { type: "RESOLVE_ATTACK"; reaction?: ReactionPlay }
  | { type: "MOVE_UNIT"; unitId: string; to: { x: number; y: number }; reaction?: ReactionPlay };
