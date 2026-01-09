import { describe, expect, it } from "vitest";
import type { GameState, Unit } from "../gameState";
import { initialTerrainParams } from "../../settings";
import {
  getReachableTiles,
  resolveCombatRollModifiers,
  resolveMovementStepCost,
} from "../terrainRules";

function makeBiomes(width: number, height: number, fill: "PLAIN" | "ROUGH" | "FOREST" | "URBAN" | "INDUSTRIAL" | "HILL" | "WATER") {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => fill)
  );
}

function makeBaseState(): GameState {
  return {
    phase: "MOVEMENT",
    activePlayer: "PLAYER_A",
    turn: 1,
    boardWidth: 3,
    boardHeight: 3,
    units: [],
    movesThisTurn: 0,
    terrain: {
      road: [],
      river: [],
      biomes: makeBiomes(3, 3, "PLAIN"),
      stats: null,
      params: initialTerrainParams,
      seed: 1,
    },
    commonDeck: [],
    tacticalDeck: [],
    selectedTacticalDeck: [],
    pendingCard: null,
    pendingAttack: null,
    storedBonuses: [],
    activeEffects: [],
    nextEffectId: 1,
    rngSeed: 1,
    lastRoll: null,
    winner: null,
    log: [],
  };
}

function makeUnit(id: string, type: Unit["type"], x: number, y: number): Unit {
  return {
    id,
    owner: "PLAYER_A",
    type,
    position: { x, y },
    movement: 3,
    attack: 2,
    hasMoved: false,
  };
}

describe("terrain rules movement", () => {
  it("uses terrain movement cost for steps", () => {
    const state = makeBaseState();
    state.terrain.biomes[0][1] = "ROUGH";
    const unit = makeUnit("u1", "INFANTRY", 0, 0);
    const step = resolveMovementStepCost({
      state,
      unit,
      from: { x: 0, y: 0 },
      to: { x: 1, y: 0 },
    });
    expect(step.blocked).toBe(false);
    expect(step.cost).toBe(2);
  });

  it("applies road boost only on connected road tiles", () => {
    const state = makeBaseState();
    state.terrain.road = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ];
    const unit = makeUnit("u1", "INFANTRY", 0, 0);
    const stepOnRoad = resolveMovementStepCost({
      state,
      unit,
      from: { x: 0, y: 0 },
      to: { x: 1, y: 0 },
    });
    expect(stepOnRoad.cost).toBe(1);

    const stepOffRoad = resolveMovementStepCost({
      state,
      unit,
      from: { x: 1, y: 0 },
      to: { x: 1, y: 1 },
    });
    expect(stepOffRoad.cost).toBe(1);
  });

  it("applies river penalty unless a bridge cancels it", () => {
    const state = makeBaseState();
    state.terrain.river = [{ x: 1, y: 0 }];
    const unit = makeUnit("u1", "INFANTRY", 0, 0);
    const stepPenalty = resolveMovementStepCost({
      state,
      unit,
      from: { x: 0, y: 0 },
      to: { x: 1, y: 0 },
    });
    expect(stepPenalty.cost).toBe(3);

    state.terrain.road = [{ x: 1, y: 0 }];
    const stepBridge = resolveMovementStepCost({
      state,
      unit,
      from: { x: 0, y: 0 },
      to: { x: 1, y: 0 },
    });
    expect(stepBridge.cost).toBe(1);
  });

  it("computes reachable tiles by movement cost", () => {
    const state = makeBaseState();
    state.terrain.biomes[0][1] = "ROUGH";
    const unit = makeUnit("u1", "INFANTRY", 0, 0);
    state.units = [unit];
    const reachable = getReachableTiles({ state, unit, movementPoints: 2 });
    const keys = new Set(reachable.map((pos) => `${pos.x},${pos.y}`));
    expect(keys.has("1,0")).toBe(true);
    expect(keys.has("2,0")).toBe(false);
  });
});

describe("terrain rules combat modifiers", () => {
  it("applies defender terrain hit penalties", () => {
    const state = makeBaseState();
    state.terrain.biomes[0][1] = "FOREST";
    const attacker = makeUnit("a1", "INFANTRY", 0, 0);
    const defender = makeUnit("d1", "INFANTRY", 1, 0);
    state.units = [attacker, defender];
    const result = resolveCombatRollModifiers({ state, attacker, defender });
    const total = result.rollModifiers.reduce((sum, value) => sum + value, 0);
    expect(total).toBe(-1);
  });

  it("applies defense bonus as a negative roll modifier", () => {
    const state = makeBaseState();
    state.terrain.biomes[0][1] = "HILL";
    const attacker = makeUnit("a1", "INFANTRY", 0, 0);
    const defender = makeUnit("d1", "INFANTRY", 1, 0);
    state.units = [attacker, defender];
    const result = resolveCombatRollModifiers({ state, attacker, defender });
    const total = result.rollModifiers.reduce((sum, value) => sum + value, 0);
    expect(total).toBe(-1);
  });
});
