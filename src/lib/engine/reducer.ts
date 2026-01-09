import type {
  AttackMeta,
  CardDefinition,
  BoardCell,
  Effect,
  GamePhase,
  GameState,
  Player,
  TerrainType,
  Unit,
  UnitType,
} from "./gameState";
import type { GameAction, GameBootstrap, TerrainResult } from "@/types/reducer";
import { cardById, commonDeckCards, tacticalDeckCards } from "./cards";
import { buildContext, instantiateEffect, validateTargets } from "./effects";
import {
  applyTacticReaction,
  validateAndApplyTacticReaction,
  validateTacticReaction,
} from "./reactions";
import { rollDie } from "./rng";
import { generateTerrainBiomes, generateTerrainNetworks } from "./terrain";
import { resolveCombatRollModifiers } from "./terrainRules";
import { getMoveRange } from "./movement";
import {
  bootstrapUnitPlacement,
  getInitialRngSeed,
  initialUnitAttackByType,
  initialTerrainParams,
  initialTerrainSquarePenalties,
  initialUnitComposition,
  initialUnitMovementByType,
} from "@/lib/settings";

export type { GameAction, GameBootstrap, TerrainResult } from "@/types/reducer";

function shuffleWithSeed<T>(items: T[], seed: number): { shuffled: T[]; nextSeed: number } {
  const shuffled = [...items];
  let nextSeed = seed;
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    nextSeed = (nextSeed * 1664525 + 1013904223) >>> 0;
    const j = nextSeed % (i + 1);
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return { shuffled, nextSeed };
}

const phaseOrder: GamePhase[] = [
  "TURN_START",
  "CARD_DRAW",
  "CARD_RESOLUTION",
  "MOVEMENT",
  "ATTACK",
  "DICE_RESOLUTION",
  "END_TURN",
];

const boardWidth = 20;
const boardHeight = 30;
const maxMovesPerTurn = 5;

function buildTerrainBlockSet(terrain: { road: { x: number; y: number }[]; river: { x: number; y: number }[] }) {
  const blocked = new Set<string>();
  for (const cell of terrain.road) blocked.add(`${cell.x},${cell.y}`);
  for (const cell of terrain.river) blocked.add(`${cell.x},${cell.y}`);
  return blocked;
}

function findNearestClearCell(args: {
  start: { x: number; y: number };
  width: number;
  height: number;
  blocked: Set<string>;
  occupied: Set<string>;
  isAllowedCell: (cell: { x: number; y: number }) => boolean;
}): { x: number; y: number } {
  const { start, width, height, blocked, occupied, isAllowedCell } = args;
  const key = `${start.x},${start.y}`;
  if (!blocked.has(key) && !occupied.has(key) && isAllowedCell(start)) return start;

  const maxRadius = Math.max(width, height);
  for (let r = 1; r <= maxRadius; r += 1) {
    for (let dy = -r; dy <= r; dy += 1) {
      const dx = r - Math.abs(dy);
      const candidates = [
        { x: start.x + dx, y: start.y + dy },
        { x: start.x - dx, y: start.y + dy },
      ];
      for (const candidate of candidates) {
        if (candidate.x < 0 || candidate.x >= width || candidate.y < 0 || candidate.y >= height) {
          continue;
        }
        const candidateKey = `${candidate.x},${candidate.y}`;
        if (blocked.has(candidateKey) || occupied.has(candidateKey) || !isAllowedCell(candidate)) continue;
        return candidate;
      }
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const fallbackKey = `${x},${y}`;
      const candidate = { x, y };
      if (blocked.has(fallbackKey) || occupied.has(fallbackKey)) continue;
      if (!isAllowedCell(candidate)) continue;
      return candidate;
    }
  }

  return start;
}

const unitStatsByType: Record<UnitType, { movement: number; attack: number }> = {
  INFANTRY: {
    movement: initialUnitMovementByType.INFANTRY,
    attack: initialUnitAttackByType.INFANTRY,
  },
  VEHICLE: {
    movement: initialUnitMovementByType.VEHICLE,
    attack: initialUnitAttackByType.VEHICLE,
  },
  SPECIAL: {
    movement: initialUnitMovementByType.SPECIAL,
    attack: initialUnitAttackByType.SPECIAL,
  },
};

function getCenteredColumns(count: number, centerX: number, width: number): number[] {
  if (count <= 0) return [];
  const columns: number[] = [];
  const cappedCenterX = Math.min(Math.max(centerX, 0), width - 1);
  columns.push(cappedCenterX);
  let ring = 1;
  while (columns.length < count && ring <= width) {
    const left = cappedCenterX - ring;
    if (left >= 0) {
      columns.push(left);
      if (columns.length === count) break;
    }
    const right = cappedCenterX + ring;
    if (right < width) {
      columns.push(right);
      if (columns.length === count) break;
    }
    ring += 1;
  }
  while (columns.length < count) {
    columns.push(cappedCenterX);
  }
  return columns;
}
export function prepareGameBootstrap(seed: number): GameBootstrap {
  const initialCommonDeck = shuffleWithSeed(commonDeckCards, seed);
  const initialTacticalDeck = shuffleWithSeed(
    tacticalDeckCards,
    initialCommonDeck.nextSeed
  );
  return {
    seed,
    commonDeck: initialCommonDeck.shuffled,
    tacticalDeck: initialTacticalDeck.shuffled,
    terrainSeed: initialTacticalDeck.nextSeed,
  };
}

export function createLoadingGameState(bootstrap: GameBootstrap): GameState {
  const biomes = Array.from({ length: boardHeight }, () =>
    Array.from({ length: boardWidth }, () => "PLAIN" as TerrainType)
  );
  return {
    phase: "TURN_START",
    activePlayer: "PLAYER_A",
    turn: 1,
    boardWidth,
    boardHeight,
    units: [],
    movesThisTurn: 0,
    terrain: {
      road: [],
      river: [],
      biomes,
      stats: null,
      params: initialTerrainParams,
      seed: bootstrap.terrainSeed,
    },
    commonDeck: bootstrap.commonDeck,
    tacticalDeck: bootstrap.tacticalDeck,
    selectedTacticalDeck: bootstrap.tacticalDeck,
    pendingCard: null,
    pendingAttack: null,
    storedBonuses: [],
    activeEffects: [],
    nextEffectId: 1,
    rngSeed: bootstrap.terrainSeed,
    lastRoll: null,
    winner: null,
    log: ["", "", "", "", ""],
  };
}

export function createInitialGameStateFromBootstrap(args: {
  bootstrap: GameBootstrap;
  terrain: TerrainResult;
}): GameState {
  const { bootstrap, terrain } = args;
  const terrainBlocked = buildTerrainBlockSet(terrain);
  const occupied = new Set<string>();
  const centerX = Math.floor(boardWidth / 2);
  const centerY = Math.floor(boardHeight / 2);
  const {
    enemyDistance: rawEnemyDistance,
    columnScatter: rawColumnScatter,
    rowScatter: rawRowScatter,
  } = bootstrapUnitPlacement;
  const enemyDistance = Math.max(1, rawEnemyDistance);
  const columnScatter = Math.max(0, Math.floor(rawColumnScatter));
  const rowScatter = Math.max(0, Math.floor(rawRowScatter));
  const clampRow = (value: number) => Math.max(0, Math.min(boardHeight - 1, value));
  const clampColumn = (value: number) => Math.max(0, Math.min(boardWidth - 1, value));
  const halfDistance = Math.floor(enemyDistance / 2);
  let rowA = clampRow(centerY - halfDistance);
  let rowB = clampRow(centerY + (enemyDistance - halfDistance));
  if (rowA >= rowB) {
    rowB = Math.min(boardHeight - 1, rowA + enemyDistance);
    rowA = Math.max(0, rowB - enemyDistance);
  }
  if (rowA >= rowB) {
    rowB = Math.min(boardHeight - 1, rowA + 1);
    rowA = Math.max(0, rowB - 1);
  }
  const rowForPlayer: Record<Player, number> = {
    PLAYER_A: Math.min(rowA, rowB),
    PLAYER_B: Math.max(rowA, rowB),
  };
  const playerOrder: Player[] = ["PLAYER_A", "PLAYER_B"];
  const unitTypeOrder: UnitType[] = ["INFANTRY", "VEHICLE", "SPECIAL"];
  const units: Unit[] = [];
  const biomesGrid = terrain.biomes;
  const isPlainTile = ({ x, y }: BoardCell) => biomesGrid[y][x] === "PLAIN";
  let placementSeed = terrain.nextSeed;
  const advancePlacementSeed = () => {
    placementSeed = (placementSeed * 1664525 + 1013904223) >>> 0;
    return placementSeed;
  };
  const randomOffset = (radius: number) => {
    if (radius <= 0) return 0;
    const range = radius * 2 + 1;
    const offset = advancePlacementSeed() % range;
    return offset - radius;
  };
  for (const player of playerOrder) {
    const prefix = player === "PLAYER_A" ? "A" : "B";
    const specs: { id: string; type: UnitType }[] = [];
    let serial = 1;
    const counts = initialUnitComposition[player];
    for (const type of unitTypeOrder) {
      const quantity = counts[type] ?? 0;
      for (let index = 0; index < quantity; index += 1) {
        specs.push({ id: `${prefix}${serial}`, type });
        serial += 1;
      }
    }
    if (specs.length === 0) continue;
    const columns = getCenteredColumns(specs.length, centerX, boardWidth);
    const row = rowForPlayer[player];
    specs.forEach((spec, specIndex) => {
      const baseColumn = columns[specIndex] ?? centerX;
      const offsetX = randomOffset(columnScatter);
      const startColumn = clampColumn(baseColumn + offsetX);
      const rowDirection = player === "PLAYER_A" ? -1 : 1;
      const offsetY = Math.abs(randomOffset(rowScatter));
      const startRow = clampRow(row + rowDirection * offsetY);
      const start = { x: startColumn, y: startRow };
      const position = findNearestClearCell({
        start,
        width: boardWidth,
        height: boardHeight,
        blocked: terrainBlocked,
        occupied,
        isAllowedCell: isPlainTile,
      });
      occupied.add(`${position.x},${position.y}`);
      units.push({
        id: spec.id,
        owner: player,
        type: spec.type,
        position,
        movement: unitStatsByType[spec.type].movement,
        attack: unitStatsByType[spec.type].attack,
        hasMoved: false,
      });
    });
  }

  return {
    phase: "TURN_START",
    activePlayer: "PLAYER_A",
    turn: 1,
    boardWidth,
    boardHeight,
    units,
    movesThisTurn: 0,
    terrain: {
      road: terrain.road,
      river: terrain.river,
      biomes: terrain.biomes,
      stats: terrain.stats,
      params: initialTerrainParams,
      seed: bootstrap.terrainSeed,
    },
    commonDeck: bootstrap.commonDeck,
    tacticalDeck: bootstrap.tacticalDeck,
    selectedTacticalDeck: bootstrap.tacticalDeck,
    pendingCard: null,
    pendingAttack: null,
    storedBonuses: [],
    activeEffects: [],
    nextEffectId: 1,
    rngSeed: placementSeed,
    lastRoll: null,
    winner: null,
    log: ["", "", "", "", ""],
  };
}

export function createInitialGameState(seed: number): GameState {
  const bootstrap = prepareGameBootstrap(seed);
  const networks = generateTerrainNetworks({
    width: boardWidth,
    height: boardHeight,
    seed: bootstrap.terrainSeed,
    roadDensity: initialTerrainParams.roadDensity,
    riverDensity: initialTerrainParams.riverDensity,
    maxBridges: initialTerrainParams.maxBridges,
    penalties: initialTerrainSquarePenalties,
  });
  const biomes = generateTerrainBiomes({
    width: boardWidth,
    height: boardHeight,
    seed: networks.nextSeed,
    rivers: networks.river,
    roads: networks.road,
  });
  return createInitialGameStateFromBootstrap({
    bootstrap,
    terrain: {
      road: networks.road,
      river: networks.river,
      biomes: biomes.biomes,
      stats: biomes.stats,
      nextSeed: biomes.nextSeed,
    },
  });
}

const initialSeed = getInitialRngSeed();
const initialGameState = createLoadingGameState(prepareGameBootstrap(initialSeed));

function manhattanDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getUnitAt(units: Unit[], position: { x: number; y: number }) {
  return units.find(
    (unit) => unit.position.x === position.x && unit.position.y === position.y
  );
}

function canUnitMove(state: GameState, unitId: string) {
  return state.activeEffects.every((effect) => {
    const ctx = buildContext(state, effect);
    return effect.hooks.canMoveUnit?.(ctx, unitId) ?? true;
  });
}

function canUnitAttack(state: GameState, attackerId: string, targetId: string) {
  return state.activeEffects.every((effect) => {
    const ctx = buildContext(state, effect);
    return effect.hooks.canAttack?.(ctx, attackerId, targetId) ?? true;
  });
}

function getEffectiveMovement(state: GameState, unitId: string, baseMovement: number) {
  return state.activeEffects.reduce((value, effect) => {
    const ctx = buildContext(state, effect);
    return effect.hooks.modifyMovement?.(ctx, unitId, value) ?? value;
  }, baseMovement);
}

function getModifiedAttackRoll(state: GameState, roll: number, meta: AttackMeta) {
  return state.activeEffects.reduce((value, effect) => {
    const ctx = buildContext(state, effect);
    return effect.hooks.modifyAttackRoll?.(ctx, value, meta) ?? value;
  }, roll);
}

function expireEffectsAtPhase(state: GameState, phase: GamePhase) {
  const expired = state.activeEffects.filter((effect) => effect.expiresAtPhase === phase);
  const remaining = state.activeEffects.filter((effect) => effect.expiresAtPhase !== phase);
  return { expired, remaining };
}

function expireEffectsAtTurnEnd(state: GameState) {
  const expired: Effect[] = [];
  const remaining: Effect[] = [];

  for (const effect of state.activeEffects) {
    if (typeof effect.remainingTurns !== "number") {
      remaining.push(effect);
      continue;
    }
    const nextRemaining = effect.remainingTurns - 1;
    if (nextRemaining <= 0) {
      expired.push(effect);
    } else {
      remaining.push({ ...effect, remainingTurns: nextRemaining });
    }
  }

  return { expired, remaining };
}

function playCard(
  state: GameState,
  card: CardDefinition,
  ownerId: GameState["activePlayer"],
  targets?: { unitIds?: string[] }
) {
  let nextState = state;
  const effects: Effect[] = [];
  const validationEffect: Effect = {
    id: "validation",
    sourceCardId: card.id,
    ownerId,
    hooks: {},
    targetUnitIds: targets?.unitIds,
  };
  const validationError = validateTargets(buildContext(state, validationEffect), card, targets);
  if (validationError) {
    return { nextState: { ...state, log: [...state.log, `Cannot play card: ${validationError}`] }, didApply: false };
  }

  for (const def of card.creates) {
    const effect = instantiateEffect(nextState, def, card.id, ownerId, targets?.unitIds);
    nextState = { ...nextState, nextEffectId: nextState.nextEffectId + 1 };
    effects.push(effect);
  }

  let activeEffects = [...nextState.activeEffects, ...effects];
  let log = [...nextState.log, `Effect applied: ${card.name}`];

  if (card.timing === "reaction" && card.kind === "bonus") {
    const opponentId = ownerId === "PLAYER_A" ? "PLAYER_B" : "PLAYER_A";
    const removed = activeEffects.filter((effect) => {
      if (effect.ownerId !== opponentId) {
        return false;
      }
      const sourceCard = cardById.get(effect.sourceCardId);
      return sourceCard?.kind === "malus";
    });
    if (removed.length > 0) {
      activeEffects = activeEffects.filter((effect) => !removed.includes(effect));
      log = [...log, `Cancelled ${removed.length} enemy malus effect(s)`];
    }
  }

  return { nextState: { ...nextState, activeEffects, log }, didApply: true };
}

export function getUnitMovementWithEffects(state: GameState, unitId: string) {
  const unit = state.units.find((candidate) => candidate.id === unitId);
  if (!unit) {
    return 0;
  }
  if (!canUnitMove(state, unitId)) {
    return 0;
  }
  return getEffectiveMovement(state, unitId, unit.movement);
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (action.type === "LOAD_STATE") {
    return action.state;
  }

  if (state.phase === "VICTORY") {
    return state;
  }

  if (action.type === "RESET_GAME") {
    const seed = typeof action.seed === "number" ? action.seed : state.rngSeed;
    return createLoadingGameState(prepareGameBootstrap(seed >>> 0));
  }

  if (action.type === "NEXT_PHASE") {
    const index = phaseOrder.indexOf(state.phase);
    if (index === -1) {
      return state;
    }
    const nextPhase = phaseOrder[(index + 1) % phaseOrder.length];
    const isNewTurn = nextPhase === "TURN_START";
    const { expired, remaining } = expireEffectsAtPhase(state, nextPhase);
    return {
      ...state,
      phase: nextPhase,
      movesThisTurn: isNewTurn ? 0 : state.movesThisTurn,
      units: isNewTurn
        ? state.units.map((unit) => ({ ...unit, hasMoved: false }))
        : state.units,
      activeEffects: remaining,
      log:
        expired.length > 0
          ? [...state.log, `Effects expired: ${expired.length}`]
          : state.log,
    };
  }

  if (action.type === "TURN_START") {
    const { expired, remaining } = expireEffectsAtPhase(state, "TURN_START");
    return {
      ...state,
      phase: "TURN_START",
      movesThisTurn: 0,
      units: state.units.map((unit) => ({ ...unit, hasMoved: false })),
      activeEffects: remaining,
      log: [
        ...state.log,
        `Turn ${state.turn} start: ${state.activePlayer}`,
        ...(expired.length > 0 ? [`Effects expired: ${expired.length}`] : []),
      ],
    };
  }

  if (action.type === "END_TURN") {
    const { expired, remaining } = expireEffectsAtTurnEnd(state);
    const nextPlayer = state.activePlayer === "PLAYER_A" ? "PLAYER_B" : "PLAYER_A";
    return {
      ...state,
      phase: "END_TURN",
      activePlayer: nextPlayer,
      turn: state.turn + 1,
      activeEffects: remaining,
      log: [
        ...state.log,
        `Turn ended. Next player: ${nextPlayer}`,
        ...(expired.length > 0 ? [`Effects expired: ${expired.length}`] : []),
      ],
    };
  }

  if (action.type === "DRAW_CARD") {
    if (state.pendingCard) {
      return {
        ...state,
        log: [...state.log, "Resolve the current bonus card before drawing another"],
      };
    }
    let deck = state.commonDeck;
    let rngSeed = state.rngSeed;
    let log = state.log;
    if (deck.length === 0) {
      const refill = shuffleWithSeed(commonDeckCards, rngSeed);
      deck = refill.shuffled;
      rngSeed = refill.nextSeed;
      log = [...log, "Common deck refilled and shuffled"];
    }
    if (deck.length === 0) {
      return { ...state, log: [...log, "No cards left in the common deck"] };
    }

    const [drawnCard, ...restDeck] = deck;
    if (drawnCard.kind === "malus") {
      if (drawnCard.targeting.type === "none") {
        const { nextState: afterPlay } = playCard(
          { ...state, commonDeck: restDeck, rngSeed, log },
          drawnCard,
          state.activePlayer
        );
        return {
          ...afterPlay,
          commonDeck: restDeck,
          rngSeed,
          log: [...afterPlay.log, `Malus resolved: ${drawnCard.name}`],
        };
      }
      return {
        ...state,
        commonDeck: restDeck,
        pendingCard: drawnCard,
        rngSeed,
        log: [...log, `Malus drawn: ${drawnCard.name} (select targets to resolve)`],
      };
    }

    return {
      ...state,
      commonDeck: restDeck,
      pendingCard: drawnCard,
      rngSeed,
      log: [...log, `Bonus drawn: ${drawnCard.name}`],
    };
  }

  if (action.type === "STORE_BONUS") {
    if (!state.pendingCard || state.pendingCard.kind !== "bonus") {
      return { ...state, log: [...state.log, "No bonus card to store"] };
    }
    if (state.storedBonuses.length >= 6) {
      return {
        ...state,
        log: [...state.log, "Cannot store more than 6 bonus cards"],
      };
    }
    return {
      ...state,
      pendingCard: null,
      storedBonuses: [...state.storedBonuses, state.pendingCard],
      log: [...state.log, `Bonus stored: ${state.pendingCard.name}`],
    };
  }

  if (action.type === "PLAY_CARD") {
    if (!state.pendingCard || state.pendingCard.id !== action.cardId) {
      return { ...state, log: [...state.log, "No pending card to play"] };
    }
    const { nextState, didApply } = playCard(
      state,
      state.pendingCard,
      state.activePlayer,
      action.targets
    );
    return {
      ...nextState,
      pendingCard: didApply ? null : state.pendingCard,
      log: didApply ? [...nextState.log, `Card played: ${state.pendingCard.name}`] : nextState.log,
    };
  }

  if (action.type === "MOVE_UNIT") {
    if (state.phase !== "MOVEMENT") {
      return {
        ...state,
        log: [...state.log, "Cannot move units outside the MOVEMENT phase"],
      };
    }
    const reaction = action.reaction;
    let preMoveState = state;
    let reactionCard: CardDefinition | null = null;
    if (reaction) {
      const validation = validateTacticReaction(state, reaction, {
        expectedWindows: ["beforeMove", "afterMove"],
        invalidWindowMessage: "Invalid reaction window for movement",
      });
      if (!validation.ok) {
        return { ...state, log: [...state.log, validation.reason] };
      }
      reactionCard = validation.card;
      if (reaction.window === "beforeMove") {
        preMoveState = applyTacticReaction(
          state,
          reactionCard,
          state.activePlayer,
          reaction.targets
        );
      }
    }
    const unit = state.units.find((candidate) => candidate.id === action.unitId);
    if (!unit) {
      return { ...state, log: [...state.log, `Unit ${action.unitId} not found`] };
    }
    if (unit.hasMoved) {
      return {
        ...state,
        log: [...state.log, `Unit ${unit.id} already moved this turn`],
      };
    }
    if (state.movesThisTurn >= maxMovesPerTurn) {
      return {
        ...state,
        log: [...state.log, "Move limit reached (5 units per turn)"],
      };
    }
    if (
      action.to.x < 0 ||
      action.to.x >= state.boardWidth ||
      action.to.y < 0 ||
      action.to.y >= state.boardHeight
    ) {
      return {
        ...state,
        log: [...state.log, `Illegal move for ${unit.id} to (${action.to.x},${action.to.y})`],
      };
    }
    if (!canUnitMove(preMoveState, unit.id)) {
      return {
        ...state,
        log: [...state.log, `Unit ${unit.id} cannot move due to active effects`],
      };
    }
    const moveRange = getMoveRange(preMoveState, unit.id);
    const canReach = moveRange.some(
      (pos) => pos.x === action.to.x && pos.y === action.to.y
    );
    if (!canReach) {
      return {
        ...state,
        log: [...state.log, `Illegal move for ${unit.id} to (${action.to.x},${action.to.y})`],
      };
    }
    if (getUnitAt(state.units, action.to)) {
      return {
        ...state,
        log: [...state.log, `Tile (${action.to.x},${action.to.y}) is occupied`],
      };
    }

    let nextState = preMoveState;
    const units = nextState.units.map((candidate) =>
      candidate.id === unit.id
        ? { ...candidate, position: action.to, hasMoved: true }
        : candidate
    );

    nextState = {
      ...nextState,
      units,
      movesThisTurn: nextState.movesThisTurn + 1,
      log: [...nextState.log, `Unit ${unit.id} moved to (${action.to.x},${action.to.y})`],
    };
    if (reaction && reaction.window === "afterMove" && reactionCard) {
      nextState = applyTacticReaction(
        nextState,
        reactionCard,
        nextState.activePlayer,
        reaction.targets
      );
    }
    return nextState;
  }

  if (action.type === "ATTACK_SELECT") {
    if (state.phase !== "ATTACK") {
      return {
        ...state,
        log: [...state.log, "Cannot select attacks outside the ATTACK phase"],
      };
    }
    const attacker = state.units.find((unit) => unit.id === action.attackerId);
    const target = state.units.find((unit) => unit.id === action.targetId);

    if (!attacker || !target) {
      return {
        ...state,
        log: [...state.log, "Attack selection requires valid attacker and target"],
      };
    }
    if (attacker.owner === target.owner) {
      return {
        ...state,
        log: [...state.log, "Cannot attack a unit you own"],
      };
    }
    if (!canUnitAttack(state, attacker.id, target.id)) {
      return {
        ...state,
        log: [...state.log, `Attack blocked by active effects: ${attacker.id} -> ${target.id}`],
      };
    }

    const distance = manhattanDistance(attacker.position, target.position);
    if (distance === 0 || distance > attacker.attack) {
      return {
        ...state,
        log: [
          ...state.log,
          `Attack out of range: ${attacker.id} -> ${target.id}`,
        ],
      };
    }

    return {
      ...state,
      pendingAttack: { attackerId: attacker.id, targetId: target.id },
      log: [...state.log, `Attack selected: ${attacker.id} -> ${target.id}`],
    };
  }

  if (action.type === "ROLL_DICE") {
    if (state.phase !== "DICE_RESOLUTION") {
      return {
        ...state,
        log: [...state.log, "Cannot roll dice outside the DICE_RESOLUTION phase"],
      };
    }
    if (!state.pendingAttack) {
      return { ...state, log: [...state.log, "No pending attack to resolve"] };
    }
    if (state.lastRoll) {
      return { ...state, log: [...state.log, "Attack roll already completed"] };
    }

    const reaction = action.reaction;
    let rollState = state;
    if (reaction) {
      const reactionResult = validateAndApplyTacticReaction(state, reaction, {
        expectedWindows: ["beforeAttackRoll"],
        invalidWindowMessage: "Invalid reaction window for roll",
      });
      if (!reactionResult.ok) {
        return reactionResult.state;
      }
      rollState = reactionResult.state;
    }

    const pendingAttack = rollState.pendingAttack;
    if (!pendingAttack) {
      return { ...rollState, log: [...rollState.log, "No pending attack to resolve"] };
    }
    const { result, nextSeed } = rollDie(rollState.rngSeed);
    const { attackerId, targetId } = pendingAttack;
    const attacker = rollState.units.find((unit) => unit.id === attackerId);
    const target = rollState.units.find((unit) => unit.id === targetId);
    if (!attacker || !target) {
      return { ...rollState, log: [...rollState.log, "Pending attack units are missing"] };
    }
    const terrainRoll = resolveCombatRollModifiers({
      state: rollState,
      attacker,
      defender: target,
    });
    const modifiedRoll = getModifiedAttackRoll(rollState, result, { attackerId, targetId });
    const rollWithTerrain =
      modifiedRoll +
      terrainRoll.rollModifiers.reduce((sum, value) => sum + value, 0);
    const clampedRoll = Math.min(6, Math.max(1, rollWithTerrain));
    const outcome =
      clampedRoll >= terrainRoll.baseHitThreshold ? "HIT" : "MISS";

    return {
      ...rollState,
      rngSeed: nextSeed,
      lastRoll: { value: clampedRoll, outcome },
      log: [
        ...rollState.log,
        `Rolled ${result} -> ${clampedRoll} (${outcome}) (${attackerId} vs ${targetId})`,
      ],
    };
  }

  if (action.type === "RESOLVE_ATTACK") {
    if (state.phase !== "DICE_RESOLUTION") {
      return {
        ...state,
        log: [...state.log, "Cannot resolve attacks outside the DICE_RESOLUTION phase"],
      };
    }
    if (!state.pendingAttack) {
      return { ...state, log: [...state.log, "No pending attack to resolve"] };
    }
    if (!state.lastRoll) {
      return { ...state, log: [...state.log, "Roll dice before resolving damage"] };
    }

    const reaction = action.reaction;
    let resolveState = state;
    let reactionCard: CardDefinition | null = null;
    if (reaction) {
      const reactionResult = validateAndApplyTacticReaction(state, reaction, {
        expectedWindows: ["afterAttackRoll", "beforeDamage"],
        invalidWindowMessage: "Invalid reaction window for resolution",
      });
      if (!reactionResult.ok) {
        return reactionResult.state;
      }
      resolveState = reactionResult.state;
      reactionCard = reactionResult.card;
    }

    const lastRoll = resolveState.lastRoll;
    if (!lastRoll) {
      return {
        ...resolveState,
        log: [...resolveState.log, "No roll available after reaction resolution"],
      };
    }
    let rollValue = lastRoll.value;
    let outcome = lastRoll.outcome;
    if (reactionCard?.id === "commanders_luck") {
      const { result, nextSeed } = rollDie(resolveState.rngSeed);
      const pendingAttack = resolveState.pendingAttack;
      if (!pendingAttack) {
        return { ...resolveState, log: [...resolveState.log, "No pending attack to resolve"] };
      }
      const { attackerId, targetId } = pendingAttack;
      const modifiedRoll = getModifiedAttackRoll(resolveState, result, {
        attackerId,
        targetId,
      });
      const clampedRoll = Math.min(6, Math.max(1, modifiedRoll));
      rollValue = clampedRoll;
      outcome = clampedRoll >= 4 ? "HIT" : "MISS";
      resolveState = {
        ...resolveState,
        rngSeed: nextSeed,
        lastRoll: { value: clampedRoll, outcome },
        log: [
          ...resolveState.log,
          `Commander's Luck reroll: ${result} -> ${clampedRoll} (${outcome})`,
        ],
      };
    }

    const pendingAttack = resolveState.pendingAttack;
    if (!pendingAttack) {
      return { ...resolveState, log: [...resolveState.log, "No pending attack to resolve"] };
    }
    const { attackerId, targetId } = pendingAttack;
    const nextUnits =
      outcome === "HIT"
        ? resolveState.units.filter((unit) => unit.id !== targetId)
        : resolveState.units;
    const remainingOwners = new Set(nextUnits.map((unit) => unit.owner));
    const hasVictory = remainingOwners.size === 1;
    const winner = hasVictory
      ? (remainingOwners.values().next().value ?? null)
      : null;

    return {
      ...resolveState,
      phase: hasVictory ? "VICTORY" : resolveState.phase,
      pendingAttack: null,
      lastRoll: null,
      units: nextUnits,
      winner,
      log: [
        ...resolveState.log,
        `Attack resolved: ${attackerId} -> ${targetId} (${rollValue} ${outcome})`,
        ...(hasVictory && winner ? [`Victory: ${winner} wins by annihilation`] : []),
      ],
    };
  }

  return state;
}

export { initialGameState };
