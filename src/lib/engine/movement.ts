import type { GameState } from "./gameState";
import { getUnitMovementWithEffects } from "./reducer";
import { getReachableTiles } from "./terrainRules";
import { getUnitById } from "./selectors";

export function getMoveRange(state: GameState, unitId: string) {
  const unit = getUnitById(state, unitId);
  if (!unit) {
    return [];
  }
  const movement = getUnitMovementWithEffects(state, unitId);
  if (movement <= 0) {
    return [];
  }

  return getReachableTiles({ state, unit, movementPoints: movement });
}
