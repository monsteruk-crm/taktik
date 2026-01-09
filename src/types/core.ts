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
