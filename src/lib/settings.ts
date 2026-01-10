import type {
  BootstrapUnitPlacementConfig,
  CardDrawOverlayTiming,
  AttackFxConfig,
  MoveHighlightSweepConfig,
  TerrainParams,
  TerrainPathfindingConfig,
  TerrainSquarePenalties,
  UnitComposition,
  UnitCapabilitiesConfig,
  UnitDisplayConfig,
  UnitAttackConfig,
  UnitMovementConfig,
  UnitDisplayTweak,
  TurnSelectionLimits,
} from "@/types/settings";

export type {
  BootstrapUnitPlacementConfig,
  CardDrawOverlayTiming,
  AttackFxConfig,
  MoveHighlightSweepConfig,
  TerrainParams,
  TerrainPathfindingConfig,
  TerrainSquarePenalties,
  UnitComposition,
  UnitCapabilitiesConfig,
  UnitDisplayConfig,
  UnitAttackConfig,
  UnitMovementConfig,
  UnitDisplayTweak,
  TurnSelectionLimits,
} from "@/types/settings";

export const initialTerrainParams: TerrainParams = {
  roadDensity: 0.3,
  riverDensity: 0.2,
  maxBridges:20,
  extraBridgeEvery: 14,
  extraBridgeMinSpacing: 6,
};

export const terrainPathfindingConfig: TerrainPathfindingConfig = {
  roadMaxExpandedPerTile: 520,
  riverTrunkMaxStepsPerTile: 4,
  riverTributaryMaxStepsFactor: 5,
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
  enemyDistance: 1,
  columnScatter: 0,
  rowScatter:0,
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
  SPECIAL: 3,
};

export const initialUnitAttackByType: UnitAttackConfig = {
  INFANTRY: 1,
  VEHICLE: 2,
  SPECIAL: 3,
};

export const turnSelectionLimits: TurnSelectionLimits = {
  maxMovesPerTurn: 5,
  maxAttacksPerTurn: 5,
};

export const initialUnitCapabilitiesByType: UnitCapabilitiesConfig = {
  INFANTRY: { tags: ["infantry"] },
  VEHICLE: { tags: ["vehicle"] },
  SPECIAL: { tags: ["special"] },
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

export const attackFxConfig: AttackFxConfig = {
  lineOffsetX: 0,
  lineOffsetY: -5,
  targetScaleY: 0.5,
};
