import type {
  BootstrapUnitPlacementConfig,
  TerrainParams,
  TerrainPathfindingConfig,
  TerrainSquarePenalties,
  TurnSelectionLimits,
  UnitAttackConfig,
  UnitCapabilitiesConfig,
  UnitComposition,
  UnitMovementConfig,
} from "@/types/settings";

export type EngineConfig = {
  boardWidth: number;
  boardHeight: number;
  terrainParams: TerrainParams;
  terrainPathfindingConfig: TerrainPathfindingConfig;
  terrainSquarePenalties: TerrainSquarePenalties;
  unitComposition: UnitComposition;
  unitMovementByType: UnitMovementConfig;
  unitAttackByType: UnitAttackConfig;
  unitCapabilitiesByType: UnitCapabilitiesConfig;
  bootstrapUnitPlacement: BootstrapUnitPlacementConfig;
  turnSelectionLimits: TurnSelectionLimits;
};

export const defaultEngineConfig: EngineConfig = {
  boardWidth: 20,
  boardHeight: 30,
  terrainParams: {
    roadDensity: 0.3,
    riverDensity: 0.2,
    maxBridges: 20,
    extraBridgeEvery: 14,
    extraBridgeMinSpacing: 6,
  },
  terrainPathfindingConfig: {
    roadMaxExpandedPerTile: 520,
    riverTrunkMaxStepsPerTile: 4,
    riverTributaryMaxStepsFactor: 5,
  },
  terrainSquarePenalties: {
    roadSquarePenaltyNew: 3.5,
    roadSquarePenaltyExisting: 8.5,
  },
  unitComposition: {
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
  },
  unitMovementByType: {
    INFANTRY: 3,
    VEHICLE: 2,
    SPECIAL: 3,
  },
  unitAttackByType: {
    INFANTRY: 1,
    VEHICLE: 2,
    SPECIAL: 3,
  },
  unitCapabilitiesByType: {
    INFANTRY: { tags: ["infantry"] },
    VEHICLE: { tags: ["vehicle"] },
    SPECIAL: { tags: ["special"] },
  },
  bootstrapUnitPlacement: {
    enemyDistance: 1,
    columnScatter: 0,
    rowScatter: 0,
  },
  turnSelectionLimits: {
    maxMovesPerTurn: 5,
    maxAttacksPerTurn: 5,
  },
};

export function resolveEngineConfig(overrides?: Partial<EngineConfig>): EngineConfig {
  if (!overrides) return defaultEngineConfig;
  return {
    ...defaultEngineConfig,
    ...overrides,
    terrainParams: {
      ...defaultEngineConfig.terrainParams,
      ...overrides.terrainParams,
    },
    terrainPathfindingConfig: {
      ...defaultEngineConfig.terrainPathfindingConfig,
      ...overrides.terrainPathfindingConfig,
    },
    terrainSquarePenalties: {
      ...defaultEngineConfig.terrainSquarePenalties,
      ...overrides.terrainSquarePenalties,
    },
    unitComposition: {
      ...defaultEngineConfig.unitComposition,
      ...overrides.unitComposition,
    },
    unitMovementByType: {
      ...defaultEngineConfig.unitMovementByType,
      ...overrides.unitMovementByType,
    },
    unitAttackByType: {
      ...defaultEngineConfig.unitAttackByType,
      ...overrides.unitAttackByType,
    },
    unitCapabilitiesByType: {
      ...defaultEngineConfig.unitCapabilitiesByType,
      ...overrides.unitCapabilitiesByType,
    },
    bootstrapUnitPlacement: {
      ...defaultEngineConfig.bootstrapUnitPlacement,
      ...overrides.bootstrapUnitPlacement,
    },
    turnSelectionLimits: {
      ...defaultEngineConfig.turnSelectionLimits,
      ...overrides.turnSelectionLimits,
    },
  };
}

export const initialTerrainParams = defaultEngineConfig.terrainParams;
export const terrainPathfindingConfig = defaultEngineConfig.terrainPathfindingConfig;
export const initialTerrainSquarePenalties = defaultEngineConfig.terrainSquarePenalties;
export const initialUnitComposition = defaultEngineConfig.unitComposition;
export const initialUnitMovementByType = defaultEngineConfig.unitMovementByType;
export const initialUnitAttackByType = defaultEngineConfig.unitAttackByType;
export const initialUnitCapabilitiesByType = defaultEngineConfig.unitCapabilitiesByType;
export const bootstrapUnitPlacement = defaultEngineConfig.bootstrapUnitPlacement;
export const turnSelectionLimits = defaultEngineConfig.turnSelectionLimits;
