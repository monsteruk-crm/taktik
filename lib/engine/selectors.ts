import type { GameState } from "./gameState";

export type GridPos = { x: number; y: number };

export function posKey(pos: GridPos) {
  return `${pos.x},${pos.y}`;
}

export function inBounds(pos: GridPos, width: number, height: number) {
  return pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height;
}

export function unitAt(pos: GridPos, units: GameState["units"]) {
  return units.find((unit) => unit.position.x === pos.x && unit.position.y === pos.y) ?? null;
}

export function getUnitById(state: GameState, unitId: string) {
  return state.units.find((unit) => unit.id === unitId) ?? null;
}
