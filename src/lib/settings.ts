import type { Player, UnitType } from "@/lib/engine/gameState";

export type TerrainParams = {
  roadDensity: number;
  riverDensity: number;
  maxBridges?: number;
};

export const initialTerrainParams: TerrainParams = {
  roadDensity: 0.15,
  riverDensity: 0.2,
  maxBridges: 10,
};

export type UnitComposition = {
  [player in Player]: Record<UnitType, number>;
};

export const initialUnitComposition: UnitComposition = {
  PLAYER_A: {
    INFANTRY: 0,
    VEHICLE: 1,
    SPECIAL: 0,
  },
  PLAYER_B: {
    INFANTRY: 0,
    VEHICLE: 3,
    SPECIAL: 0,
  },
};

export type BootstrapUnitPlacementConfig = {
  enemyDistance: number;
};

export const bootstrapUnitPlacement: BootstrapUnitPlacementConfig = {
  enemyDistance: 4,
};

export function getInitialRngSeed(): number {
  const envSeed = process.env.NEXT_PUBLIC_RNG_SEED;
  if (envSeed) {
    const parsed = Number.parseInt(envSeed, 10);
    if (Number.isFinite(parsed)) {
      return parsed >>> 0;
    }
  }
  return 1;
}

export type TerrainSquarePenalties = {
  roadSquarePenaltyNew: number;
  roadSquarePenaltyExisting: number;
};

export const initialTerrainSquarePenalties: TerrainSquarePenalties = {
  roadSquarePenaltyNew: 3.5,
  roadSquarePenaltyExisting: 8.5,
};

export type CardDrawOverlayTiming = {
  holdMs: number;
  tweenMs: number;
  exitBufferMs: number;
};

export const cardDrawOverlayTiming: CardDrawOverlayTiming = {
  holdMs: 3000,
  tweenMs: 600,
  exitBufferMs: 300,
};
