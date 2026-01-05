import type { Player, UnitType } from "@/lib/engine/gameState";

export type TerrainParams = {
  roadDensity: number;
  riverDensity: number;
  maxBridges?: number;
};

export const initialTerrainParams: TerrainParams = {
  roadDensity: 0.15,
  riverDensity: 0.16,
  maxBridges: 6,
};

export type UnitComposition = {
  [player in Player]: Record<UnitType, number>;
};

export const initialUnitComposition: UnitComposition = {
  PLAYER_A: {
    INFANTRY: 3,
    VEHICLE: 3,
    SPECIAL: 1,
  },
  PLAYER_B: {
    INFANTRY: 3,
    VEHICLE: 3,
    SPECIAL: 2,
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
