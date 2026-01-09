import type {
  BootstrapUnitPlacementConfig,
  CardDrawOverlayTiming,
  MoveHighlightSweepConfig,
  TerrainParams,
  TerrainSquarePenalties,
  UnitComposition,
  UnitDisplayConfig,
  UnitAttackConfig,
  UnitMovementConfig,
  UnitDisplayTweak,
} from "@/types/settings";

export type {
  BootstrapUnitPlacementConfig,
  CardDrawOverlayTiming,
  MoveHighlightSweepConfig,
  TerrainParams,
  TerrainSquarePenalties,
  UnitComposition,
  UnitDisplayConfig,
  UnitAttackConfig,
  UnitMovementConfig,
  UnitDisplayTweak,
} from "@/types/settings";

export const initialTerrainParams: TerrainParams = {
  roadDensity: 0.2,
  riverDensity: 0.1,
  maxBridges: 10,
};

export const initialUnitComposition: UnitComposition = {
  PLAYER_A: {
    INFANTRY: 5,
    VEHICLE: 3,
    SPECIAL: 2,
  },
  PLAYER_B: {
    INFANTRY: 5,
    VEHICLE: 3,
    SPECIAL: 2,
  },
};

export const bootstrapUnitPlacement: BootstrapUnitPlacementConfig = {
  enemyDistance: 4,
  columnScatter: 3,
  rowScatter: 1,
};

export const initialUnitDisplayConfig: UnitDisplayConfig = {
  INFANTRY: {
    offsetX: 0,
    offsetY: 8,
    scale: 0.5,
  },
  VEHICLE: {
    offsetX: 5,
    offsetY: 14,
    scale: 0.5,
  },
  SPECIAL: {
    offsetX: 0,
    offsetY: 8,
    scale: 0.5,
  },
};

export const initialUnitMovementByType: UnitMovementConfig = {
  INFANTRY: 3,
  VEHICLE: 2,
  SPECIAL: 2,
};

export const initialUnitAttackByType: UnitAttackConfig = {
  INFANTRY: 1,
  VEHICLE: 2,
  SPECIAL: 3,
};

export const moveHighlightSweep: MoveHighlightSweepConfig = {
  msPerRing: 250,
  holdMs: 400,
  fadeWidth: 1,
  maxOpacity: 0.95,
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

export const initialTerrainSquarePenalties: TerrainSquarePenalties = {
  roadSquarePenaltyNew: 3.5,
  roadSquarePenaltyExisting: 8.5,
};

export const cardDrawOverlayTiming: CardDrawOverlayTiming = {
  holdMs: 3000,
  tweenMs: 600,
  exitBufferMs: 300,
};
