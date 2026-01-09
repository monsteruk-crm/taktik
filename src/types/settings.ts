import type { Player, UnitType } from "@/types/core";

export type TerrainParams = {
  roadDensity: number;
  riverDensity: number;
  maxBridges?: number;
};

export type UnitComposition = {
  [player in Player]: Record<UnitType, number>;
};

export type BootstrapUnitPlacementConfig = {
  enemyDistance: number;
  columnScatter: number;
  rowScatter: number;
};

export type UnitDisplayTweak = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

export type UnitDisplayConfig = {
  [unitType in UnitType]: UnitDisplayTweak;
};

export type UnitMovementConfig = {
  [unitType in UnitType]: number;
};

export type UnitAttackConfig = {
  [unitType in UnitType]: number;
};

export type MoveHighlightSweepConfig = {
  msPerRing: number;
  holdMs: number;
  fadeWidth: number;
  maxOpacity: number;
};

export type TerrainSquarePenalties = {
  roadSquarePenaltyNew: number;
  roadSquarePenaltyExisting: number;
};

export type CardDrawOverlayTiming = {
  holdMs: number;
  tweenMs: number;
  exitBufferMs: number;
};
