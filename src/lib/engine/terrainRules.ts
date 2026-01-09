import type { BoardCell, TerrainType, UnitType } from "@/types/core";
import type { GameState, Unit } from "./gameState";
import type { UnitCapabilitiesConfig } from "@/types/settings";
import { initialUnitCapabilitiesByType } from "../settings";
import { posKey } from "./selectors";

export type Direction = "N" | "E" | "S" | "W";

export type TerrainDefinition = {
  id: TerrainType;
  movementCost: number;
  blocksMovement: boolean;
  combatModifiers: {
    hitChance?: number;
    defenseBonus?: number;
  };
  tags: string[];
};

export type OverlayDefinition = {
  id: string;
  movementRule: "restrict" | "boost" | "block";
  costModifier?: number;
  allowedDirections?: Direction[];
  allowedUnitTags?: string[];
  blockedUnitTags?: string[];
  tags: string[];
};

export type ConnectorDefinition = {
  id: string;
  allowsOverlay: string[];
  tags: string[];
};

export type ConnectorPlacementRule = {
  connectorId: string;
  requiresOverlays: string[];
};

export type MovementRuleCondition = {
  unitTypes?: UnitType[];
  unitTags?: string[];
  terrainTags?: string[];
  overlayTags?: string[];
  connectorTags?: string[];
};

export type MovementModifierRule = {
  id: string;
  costDelta?: number;
  blocksMovement?: boolean;
  requires: MovementRuleCondition;
};

export type CombatRuleCondition = {
  attackerUnitTypes?: UnitType[];
  defenderUnitTypes?: UnitType[];
  attackerUnitTags?: string[];
  defenderUnitTags?: string[];
  attackerTerrainTags?: string[];
  defenderTerrainTags?: string[];
  attackerOverlayTags?: string[];
  defenderOverlayTags?: string[];
};

export type CombatModifierRule = {
  id: string;
  rollModifier: number;
  requires: CombatRuleCondition;
};

export type TerrainRulesConfig = {
  terrainDefinitions: Record<TerrainType, TerrainDefinition>;
  overlayDefinitions: Record<string, OverlayDefinition>;
  connectorDefinitions: Record<string, ConnectorDefinition>;
  connectorPlacementRules: ConnectorPlacementRule[];
  overlayStateKeys: Record<string, "road" | "river">;
  unitCapabilitiesByType: UnitCapabilitiesConfig;
  movementRules: MovementModifierRule[];
  combatRules: CombatModifierRule[];
  baseHitThreshold: number;
};

const DIRECTIONS: Array<{ id: Direction; dx: number; dy: number }> = [
  { id: "N", dx: 0, dy: -1 },
  { id: "E", dx: 1, dy: 0 },
  { id: "S", dx: 0, dy: 1 },
  { id: "W", dx: -1, dy: 0 },
];

export const terrainRulesConfig: TerrainRulesConfig = {
  terrainDefinitions: {
    PLAIN: {
      id: "PLAIN",
      movementCost: 1,
      blocksMovement: false,
      combatModifiers: {},
      tags: ["open"],
    },
    ROUGH: {
      id: "ROUGH",
      movementCost: 2,
      blocksMovement: false,
      combatModifiers: {},
      tags: ["rough"],
    },
    FOREST: {
      id: "FOREST",
      movementCost: 2,
      blocksMovement: false,
      combatModifiers: { hitChance: -1 },
      tags: ["cover", "concealment"],
    },
    URBAN: {
      id: "URBAN",
      movementCost: 2,
      blocksMovement: false,
      combatModifiers: { hitChance: -1, defenseBonus: 1 },
      tags: ["cover", "structures"],
    },
    INDUSTRIAL: {
      id: "INDUSTRIAL",
      movementCost: 2,
      blocksMovement: false,
      combatModifiers: { hitChance: -1 },
      tags: ["cover", "structures"],
    },
    HILL: {
      id: "HILL",
      movementCost: 2,
      blocksMovement: false,
      combatModifiers: { defenseBonus: 1 },
      tags: ["elevated"],
    },
    WATER: {
      id: "WATER",
      movementCost: 99,
      blocksMovement: true,
      combatModifiers: {},
      tags: ["water"],
    },
  },
  overlayDefinitions: {
    road: {
      id: "road",
      movementRule: "boost",
      costModifier: -1,
      tags: ["path", "logistics"],
    },
    river: {
      id: "river",
      movementRule: "restrict",
      costModifier: 2,
      tags: ["water", "barrier"],
    },
  },
  connectorDefinitions: {
    bridge: {
      id: "bridge",
      allowsOverlay: ["river"],
      tags: ["crossing"],
    },
  },
  connectorPlacementRules: [
    { connectorId: "bridge", requiresOverlays: ["road", "river"] },
  ],
  overlayStateKeys: {
    road: "road",
    river: "river",
  },
  unitCapabilitiesByType: initialUnitCapabilitiesByType,
  movementRules: [],
  combatRules: [],
  baseHitThreshold: 4,
};

type TileContext = {
  terrain: TerrainDefinition;
  overlays: OverlayDefinition[];
  connectors: ConnectorDefinition[];
  terrainTags: string[];
  overlayTags: string[];
  connectorTags: string[];
};

type MovementStepResult = {
  cost: number;
  blocked: boolean;
};

type CombatModifierResult = {
  rollModifiers: number[];
  baseHitThreshold: number;
};

function getUnitTags(unit: Unit, config: TerrainRulesConfig): string[] {
  return config.unitCapabilitiesByType[unit.type]?.tags ?? [];
}

function buildOverlaySets(state: GameState, config: TerrainRulesConfig) {
  const sets = new Map<string, Set<string>>();
  for (const [overlayId, stateKey] of Object.entries(config.overlayStateKeys)) {
    const cells = state.terrain[stateKey];
    sets.set(overlayId, new Set(cells.map(posKey)));
  }
  return sets;
}

function getTileOverlays(
  overlaySets: Map<string, Set<string>>,
  cell: BoardCell
): string[] {
  const key = posKey(cell);
  const overlays: string[] = [];
  overlaySets.forEach((set, overlayId) => {
    if (set.has(key)) overlays.push(overlayId);
  });
  return overlays;
}

function getTileConnectors(
  overlayIds: string[],
  config: TerrainRulesConfig
): ConnectorDefinition[] {
  const connectors: ConnectorDefinition[] = [];
  for (const rule of config.connectorPlacementRules) {
    const matches = rule.requiresOverlays.every((id) => overlayIds.includes(id));
    if (!matches) continue;
    const connector = config.connectorDefinitions[rule.connectorId];
    if (connector) connectors.push(connector);
  }
  return connectors;
}

function collectTags(defs: Array<{ tags: string[] }>) {
  const tags = new Set<string>();
  for (const def of defs) {
    def.tags.forEach((tag) => tags.add(tag));
  }
  return Array.from(tags);
}

function buildTileContext(
  state: GameState,
  cell: BoardCell,
  overlaySets: Map<string, Set<string>>,
  config: TerrainRulesConfig
): TileContext {
  const terrainId = state.terrain.biomes[cell.y]?.[cell.x] ?? "PLAIN";
  const terrain = config.terrainDefinitions[terrainId];
  const overlayIds = getTileOverlays(overlaySets, cell);
  const overlays = overlayIds
    .map((id) => config.overlayDefinitions[id])
    .filter(Boolean);
  const connectors = getTileConnectors(overlayIds, config);
  return {
    terrain,
    overlays,
    connectors,
    terrainTags: terrain.tags,
    overlayTags: collectTags(overlays),
    connectorTags: collectTags(connectors),
  };
}

function directionBetween(from: BoardCell, to: BoardCell): Direction | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === -1) return "N";
  if (dx === 1 && dy === 0) return "E";
  if (dx === 0 && dy === 1) return "S";
  if (dx === -1 && dy === 0) return "W";
  return null;
}

function overlayAllowsUnit(overlay: OverlayDefinition, unitTags: string[]) {
  if (overlay.allowedUnitTags && overlay.allowedUnitTags.length > 0) {
    const allowed = overlay.allowedUnitTags.some((tag) => unitTags.includes(tag));
    if (!allowed) return false;
  }
  if (overlay.blockedUnitTags && overlay.blockedUnitTags.length > 0) {
    const blocked = overlay.blockedUnitTags.some((tag) => unitTags.includes(tag));
    if (blocked) return false;
  }
  return true;
}

function overlayNeutralized(
  overlayId: string,
  connectors: ConnectorDefinition[]
) {
  return connectors.some((connector) => connector.allowsOverlay.includes(overlayId));
}

function movementRuleMatches(
  condition: MovementRuleCondition,
  unit: Unit,
  unitTags: string[],
  tile: TileContext
) {
  if (condition.unitTypes && !condition.unitTypes.includes(unit.type)) return false;
  if (condition.unitTags && !condition.unitTags.some((tag) => unitTags.includes(tag))) {
    return false;
  }
  if (condition.terrainTags && !condition.terrainTags.some((tag) => tile.terrainTags.includes(tag))) {
    return false;
  }
  if (condition.overlayTags && !condition.overlayTags.some((tag) => tile.overlayTags.includes(tag))) {
    return false;
  }
  if (condition.connectorTags && !condition.connectorTags.some((tag) => tile.connectorTags.includes(tag))) {
    return false;
  }
  return true;
}

function combatRuleMatches(
  condition: CombatRuleCondition,
  attacker: Unit,
  defender: Unit,
  attackerTags: string[],
  defenderTags: string[],
  attackerTile: TileContext,
  defenderTile: TileContext
) {
  if (condition.attackerUnitTypes && !condition.attackerUnitTypes.includes(attacker.type)) {
    return false;
  }
  if (condition.defenderUnitTypes && !condition.defenderUnitTypes.includes(defender.type)) {
    return false;
  }
  if (condition.attackerUnitTags && !condition.attackerUnitTags.some((tag) => attackerTags.includes(tag))) {
    return false;
  }
  if (condition.defenderUnitTags && !condition.defenderUnitTags.some((tag) => defenderTags.includes(tag))) {
    return false;
  }
  if (condition.attackerTerrainTags && !condition.attackerTerrainTags.some((tag) => attackerTile.terrainTags.includes(tag))) {
    return false;
  }
  if (condition.defenderTerrainTags && !condition.defenderTerrainTags.some((tag) => defenderTile.terrainTags.includes(tag))) {
    return false;
  }
  if (condition.attackerOverlayTags && !condition.attackerOverlayTags.some((tag) => attackerTile.overlayTags.includes(tag))) {
    return false;
  }
  if (condition.defenderOverlayTags && !condition.defenderOverlayTags.some((tag) => defenderTile.overlayTags.includes(tag))) {
    return false;
  }
  return true;
}

export function resolveMovementStepCost(args: {
  state: GameState;
  unit: Unit;
  from: BoardCell;
  to: BoardCell;
  config?: TerrainRulesConfig;
}): MovementStepResult {
  const { state, unit, from, to } = args;
  const config = args.config ?? terrainRulesConfig;
  const overlaySets = buildOverlaySets(state, config);
  const unitTags = getUnitTags(unit, config);
  const fromTile = buildTileContext(state, from, overlaySets, config);
  const toTile = buildTileContext(state, to, overlaySets, config);
  const direction = directionBetween(from, to);

  if (toTile.terrain.blocksMovement) {
    return { cost: 0, blocked: true };
  }

  let cost = toTile.terrain.movementCost;
  const overlayIds = toTile.overlays.map((overlay) => overlay.id);
  const fromOverlayIds = fromTile.overlays.map((overlay) => overlay.id);
  const connectors = [...fromTile.connectors, ...toTile.connectors];

  for (const overlayId of overlayIds) {
    const overlay = config.overlayDefinitions[overlayId];
    if (!overlay || !overlayAllowsUnit(overlay, unitTags)) {
      continue;
    }
    if (direction && overlay.allowedDirections && !overlay.allowedDirections.includes(direction)) {
      continue;
    }
    if (overlayNeutralized(overlayId, connectors)) {
      continue;
    }
    const fromHasOverlay = fromOverlayIds.includes(overlayId);
    const toHasOverlay = overlayIds.includes(overlayId);
    const alongOverlay = fromHasOverlay && toHasOverlay;
    if (overlay.movementRule === "boost") {
      if (alongOverlay) {
        cost += overlay.costModifier ?? 0;
      }
      continue;
    }
    if (overlay.movementRule === "block") {
      if (toHasOverlay || fromHasOverlay) {
        return { cost: 0, blocked: true };
      }
      continue;
    }
    if (overlay.movementRule === "restrict") {
      if (toHasOverlay || fromHasOverlay) {
        cost += overlay.costModifier ?? 0;
      }
    }
  }

  for (const rule of config.movementRules) {
    if (!movementRuleMatches(rule.requires, unit, unitTags, toTile)) {
      continue;
    }
    if (rule.blocksMovement) {
      return { cost: 0, blocked: true };
    }
    if (typeof rule.costDelta === "number") {
      cost += rule.costDelta;
    }
  }

  cost = Math.max(1, cost);
  return { cost, blocked: false };
}

export function resolveCombatRollModifiers(args: {
  state: GameState;
  attacker: Unit;
  defender: Unit;
  config?: TerrainRulesConfig;
}): CombatModifierResult {
  const { state, attacker, defender } = args;
  const config = args.config ?? terrainRulesConfig;
  const overlaySets = buildOverlaySets(state, config);
  const attackerTile = buildTileContext(state, attacker.position, overlaySets, config);
  const defenderTile = buildTileContext(state, defender.position, overlaySets, config);
  const attackerTags = getUnitTags(attacker, config);
  const defenderTags = getUnitTags(defender, config);
  const modifiers: number[] = [];

  if (typeof attackerTile.terrain.combatModifiers.hitChance === "number") {
    modifiers.push(attackerTile.terrain.combatModifiers.hitChance);
  }
  if (typeof defenderTile.terrain.combatModifiers.hitChance === "number") {
    modifiers.push(defenderTile.terrain.combatModifiers.hitChance);
  }
  if (typeof defenderTile.terrain.combatModifiers.defenseBonus === "number") {
    modifiers.push(-defenderTile.terrain.combatModifiers.defenseBonus);
  }

  for (const rule of config.combatRules) {
    if (!combatRuleMatches(rule.requires, attacker, defender, attackerTags, defenderTags, attackerTile, defenderTile)) {
      continue;
    }
    modifiers.push(rule.rollModifier);
  }

  return {
    rollModifiers: modifiers,
    baseHitThreshold: config.baseHitThreshold,
  };
}

export function getReachableTiles(args: {
  state: GameState;
  unit: Unit;
  movementPoints: number;
  config?: TerrainRulesConfig;
}) {
  const { state, unit, movementPoints } = args;
  const config = args.config ?? terrainRulesConfig;
  if (movementPoints <= 0) {
    return [];
  }

  const width = state.boardWidth;
  const height = state.boardHeight;
  const start = unit.position;
  const startKey = posKey(start);
  const bestCost = new Map<string, number>();
  bestCost.set(startKey, 0);
  const open: Array<{ cell: BoardCell; cost: number }> = [{ cell: start, cost: 0 }];
  const reachable: BoardCell[] = [];

  while (open.length > 0) {
    let bestIndex = 0;
    for (let i = 1; i < open.length; i += 1) {
      if (open[i].cost < open[bestIndex].cost) {
        bestIndex = i;
      }
    }
    const current = open.splice(bestIndex, 1)[0];
    for (const dir of DIRECTIONS) {
      const next = { x: current.cell.x + dir.dx, y: current.cell.y + dir.dy };
      if (next.x < 0 || next.x >= width || next.y < 0 || next.y >= height) {
        continue;
      }
      if (next.x === start.x && next.y === start.y) {
        continue;
      }
      if (state.units.some((candidate) => candidate.position.x === next.x && candidate.position.y === next.y)) {
        continue;
      }
      const step = resolveMovementStepCost({ state, unit, from: current.cell, to: next, config });
      if (step.blocked) {
        continue;
      }
      const nextCost = current.cost + step.cost;
      if (nextCost > movementPoints) {
        continue;
      }
      const nextKey = posKey(next);
      const prevCost = bestCost.get(nextKey);
      if (typeof prevCost === "number" && prevCost <= nextCost) {
        continue;
      }
      bestCost.set(nextKey, nextCost);
      open.push({ cell: next, cost: nextCost });
      reachable.push(next);
    }
  }

  return reachable;
}
