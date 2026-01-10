import type {
  CardDrawOverlayTiming,
  AttackFxConfig,
  MoveHighlightSweepConfig,
  UnitDisplayConfig,
  UnitDisplayTweak,
} from "@/types/settings";
import { defaultEngineConfig } from "@/lib/engine/config";

export type {
  CardDrawOverlayTiming,
  AttackFxConfig,
  MoveHighlightSweepConfig,
  UnitDisplayConfig,
  UnitDisplayTweak,
} from "@/types/settings";
export type { EngineConfig } from "@/lib/engine/config";

export const initialTerrainParams = defaultEngineConfig.terrainParams;
export const terrainPathfindingConfig = defaultEngineConfig.terrainPathfindingConfig;
export const initialUnitComposition = defaultEngineConfig.unitComposition;
export const bootstrapUnitPlacement = defaultEngineConfig.bootstrapUnitPlacement;

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

export const initialUnitMovementByType = defaultEngineConfig.unitMovementByType;
export const initialUnitAttackByType = defaultEngineConfig.unitAttackByType;
export const turnSelectionLimits = defaultEngineConfig.turnSelectionLimits;
export const initialUnitCapabilitiesByType = defaultEngineConfig.unitCapabilitiesByType;

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

export const initialTerrainSquarePenalties = defaultEngineConfig.terrainSquarePenalties;

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
