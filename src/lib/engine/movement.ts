import type { GameState } from "./gameState";
import { getUnitMovementWithEffects } from "./reducer";
import { getUnitById, inBounds, unitAt } from "./selectors";

export function getMoveRange(state: GameState, unitId: string) {
  const unit = getUnitById(state, unitId);
  if (!unit) {
    return [];
  }
  const movement = getUnitMovementWithEffects(state, unitId);
  if (movement <= 0) {
    return [];
  }

  const positions: { x: number; y: number }[] = [];
  const width = state.boardWidth;
  const height = state.boardHeight;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (x === unit.position.x && y === unit.position.y) {
        continue;
      }
      const pos = { x, y };
      if (!inBounds(pos, width, height)) {
        continue;
      }
      if (unitAt(pos, state.units)) {
        continue;
      }
      const dx = Math.abs(unit.position.x - x);
      const dy = Math.abs(unit.position.y - y);
      const distance = dx + dy;
      if (distance <= movement) {
        positions.push(pos);
      }
    }
  }

  return positions;
}
