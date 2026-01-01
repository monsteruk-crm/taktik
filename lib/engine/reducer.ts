import type {
  AttackMeta,
  CardDefinition,
  Effect,
  EffectDefinition,
  EngineContext,
  GamePhase,
  GameState,
  ReactionWindow,
  Unit,
} from "./gameState";
import { cardById, commonDeckCards, tacticalDeckCards } from "./cards";
import { rollDie } from "./rng";

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

type ReactionPlay = { cardId: string; window: ReactionWindow; targets?: { unitIds?: string[] } };

export type GameAction =
  | { type: "NEXT_PHASE" }
  | { type: "TURN_START" }
  | { type: "END_TURN" }
  | { type: "DRAW_CARD" }
  | { type: "STORE_BONUS" }
  | { type: "PLAY_CARD"; cardId: string; targets?: { unitIds?: string[] } }
  | { type: "ATTACK_SELECT"; attackerId: string; targetId: string }
  | { type: "ROLL_DICE"; reaction?: ReactionPlay }
  | { type: "RESOLVE_ATTACK"; reaction?: ReactionPlay }
  | { type: "MOVE_UNIT"; unitId: string; to: { x: number; y: number }; reaction?: ReactionPlay };

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
const initialCommonDeck = shuffleWithSeed(commonDeckCards, 1);
const initialTacticalDeck = shuffleWithSeed(tacticalDeckCards, initialCommonDeck.nextSeed);

function manhattanDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getUnitAt(units: Unit[], position: { x: number; y: number }) {
  return units.find(
    (unit) => unit.position.x === position.x && unit.position.y === position.y
  );
}

function getUnitOwner(units: Unit[], unitId: string) {
  return units.find((unit) => unit.id === unitId)?.owner ?? null;
}

function buildContext(state: GameState, effect: Effect): EngineContext {
  return {
    activePlayerId: state.activePlayer,
    opponentPlayerId: state.activePlayer === "PLAYER_A" ? "PLAYER_B" : "PLAYER_A",
    effect,
    getUnitOwner: (unitId) => getUnitOwner(state.units, unitId),
    isUnitDamaged: () => false,
  };
}

function instantiateEffect(
  state: GameState,
  definition: EffectDefinition,
  sourceCardId: string,
  ownerId: GameState["activePlayer"],
  targetUnitIds?: string[]
): Effect {
  const duration = definition.duration;
  const effect: Effect = {
    id: `effect-${state.nextEffectId}`,
    sourceCardId,
    ownerId,
    hooks: definition.hooks,
    targetUnitIds,
  };

  if (duration.type === "untilEndOfTurn") {
    effect.remainingTurns = 1;
  }
  if (duration.type === "nTurns") {
    effect.remainingTurns = duration.turns;
  }
  if (duration.type === "untilPhase") {
    effect.expiresAtPhase = duration.phase;
  }

  return effect;
}

function validateTargets(
  ctx: EngineContext,
  card: CardDefinition,
  targets?: { unitIds?: string[] }
): string | null {
  if (card.targeting.type === "none") {
    return null;
  }
  if (!targets?.unitIds) {
    return "Targets required";
  }
  if (targets.unitIds.length !== card.targeting.count) {
    return "Invalid target count";
  }
  for (const unitId of targets.unitIds) {
    const owner = ctx.getUnitOwner(unitId);
    if (owner === null) {
      return "Invalid target unit";
    }
    if (card.targeting.owner === "enemy" && owner !== ctx.opponentPlayerId) {
      return "Invalid enemy target";
    }
    if (card.targeting.owner === "self" && owner !== ctx.activePlayerId) {
      return "Invalid friendly target";
    }
  }
  return null;
}

function getTacticCard(state: GameState, cardId: string) {
  return state.selectedTacticalDeck.find((card) => card.id === cardId) ?? null;
}

function validateTacticDefinition(card: CardDefinition) {
  if (card.kind !== "tactic") {
    return "Card is not a tactic";
  }
  if (card.timing !== "reaction") {
    return "Tactic timing must be reaction";
  }
  if (!card.reactionWindow) {
    return "Tactic reaction window missing";
  }
  return null;
}

function validateReactionWindow(state: GameState, window: ReactionWindow) {
  if (window === "beforeMove" || window === "afterMove") {
    if (state.phase !== "MOVEMENT") {
      return "Reaction window only available during movement";
    }
    return null;
  }
  if (window === "beforeAttackRoll") {
    if (state.phase !== "DICE_RESOLUTION") {
      return "Reaction window only available during dice resolution";
    }
    if (!state.pendingAttack) {
      return "No pending attack for reaction";
    }
    if (state.lastRoll) {
      return "Attack roll already completed";
    }
    return null;
  }
  if (window === "afterAttackRoll" || window === "beforeDamage") {
    if (state.phase !== "DICE_RESOLUTION") {
      return "Reaction window only available during dice resolution";
    }
    if (!state.pendingAttack) {
      return "No pending attack for reaction";
    }
    if (!state.lastRoll) {
      return "Attack roll not completed yet";
    }
    return null;
  }
  return "Unknown reaction window";
}

function applyTacticEffect(
  state: GameState,
  card: CardDefinition,
  ownerId: GameState["activePlayer"],
  targets?: { unitIds?: string[] }
) {
  let nextState = state;
  const effects: Effect[] = [];

  for (const def of card.creates) {
    const effect = instantiateEffect(nextState, def, card.id, ownerId, targets?.unitIds);
    nextState = { ...nextState, nextEffectId: nextState.nextEffectId + 1 };
    effects.push(effect);
  }

  return {
    ...nextState,
    activeEffects: [...nextState.activeEffects, ...effects],
    selectedTacticalDeck: nextState.selectedTacticalDeck.filter((item) => item.id !== card.id),
    log: [...nextState.log, `Tactic played: ${card.name} (${card.reactionWindow ?? "unknown"})`],
  };
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
  if (state.phase === "VICTORY") {
    return state;
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
    if (reaction && reaction.window !== "beforeMove" && reaction.window !== "afterMove") {
      return { ...state, log: [...state.log, "Invalid reaction window for movement"] };
    }
    let preMoveState = state;
    let reactionCard: CardDefinition | null = null;
    if (reaction) {
      reactionCard = getTacticCard(state, reaction.cardId);
      if (!reactionCard) {
        return { ...state, log: [...state.log, "Tactic card not available"] };
      }
      const definitionError = validateTacticDefinition(reactionCard);
      if (definitionError) {
        return {
          ...state,
          log: [...state.log, `Cannot play tactic: ${definitionError}`],
        };
      }
      if (reactionCard.reactionWindow !== reaction.window) {
        return { ...state, log: [...state.log, "Reaction window mismatch"] };
      }
      const windowError = validateReactionWindow(state, reaction.window);
      if (windowError) {
        return { ...state, log: [...state.log, `Cannot play tactic: ${windowError}`] };
      }
      const validationEffect: Effect = {
        id: "validation",
        sourceCardId: reactionCard.id,
        ownerId: state.activePlayer,
        hooks: {},
        targetUnitIds: reaction.targets?.unitIds,
      };
      const targetError = validateTargets(
        buildContext(state, validationEffect),
        reactionCard,
        reaction.targets
      );
      if (targetError) {
        return {
          ...state,
          log: [...state.log, `Cannot play tactic: ${targetError}`],
        };
      }
      if (reaction.window === "beforeMove" && reactionCard.targeting.type === "unit") {
        const invalidTarget = (reaction.targets?.unitIds ?? []).find((unitId) =>
          state.units.find((unit) => unit.id === unitId && unit.hasMoved)
        );
        if (invalidTarget) {
          return {
            ...state,
            log: [...state.log, "Cannot play tactic: target already moved"],
          };
        }
      }
      if (reaction.window === "beforeMove") {
        preMoveState = applyTacticEffect(
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
    const effectiveMovement = getEffectiveMovement(preMoveState, unit.id, unit.movement);
    const dx = Math.abs(unit.position.x - action.to.x);
    const dy = Math.abs(unit.position.y - action.to.y);
    const distance = Math.max(dx, dy);
    if (distance === 0 || distance > effectiveMovement) {
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
      nextState = applyTacticEffect(
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
    if (reaction && reaction.window !== "beforeAttackRoll") {
      return { ...state, log: [...state.log, "Invalid reaction window for roll"] };
    }
    let rollState = state;
    if (reaction) {
      const reactionCard = getTacticCard(state, reaction.cardId);
      if (!reactionCard) {
        return { ...state, log: [...state.log, "Tactic card not available"] };
      }
      const definitionError = validateTacticDefinition(reactionCard);
      if (definitionError) {
        return {
          ...state,
          log: [...state.log, `Cannot play tactic: ${definitionError}`],
        };
      }
      if (reactionCard.reactionWindow !== reaction.window) {
        return { ...state, log: [...state.log, "Reaction window mismatch"] };
      }
      const windowError = validateReactionWindow(state, reaction.window);
      if (windowError) {
        return { ...state, log: [...state.log, `Cannot play tactic: ${windowError}`] };
      }
      const validationEffect: Effect = {
        id: "validation",
        sourceCardId: reactionCard.id,
        ownerId: state.activePlayer,
        hooks: {},
        targetUnitIds: reaction.targets?.unitIds,
      };
      const targetError = validateTargets(
        buildContext(state, validationEffect),
        reactionCard,
        reaction.targets
      );
      if (targetError) {
        return {
          ...state,
          log: [...state.log, `Cannot play tactic: ${targetError}`],
        };
      }
      rollState = applyTacticEffect(
        state,
        reactionCard,
        state.activePlayer,
        reaction.targets
      );
    }

    const pendingAttack = rollState.pendingAttack;
    if (!pendingAttack) {
      return { ...rollState, log: [...rollState.log, "No pending attack to resolve"] };
    }
    const { result, nextSeed } = rollDie(rollState.rngSeed);
    const { attackerId, targetId } = pendingAttack;
    const modifiedRoll = getModifiedAttackRoll(rollState, result, { attackerId, targetId });
    const clampedRoll = Math.min(6, Math.max(1, modifiedRoll));
    const outcome = clampedRoll >= 4 ? "HIT" : "MISS";

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
    if (
      reaction &&
      reaction.window !== "afterAttackRoll" &&
      reaction.window !== "beforeDamage"
    ) {
      return { ...state, log: [...state.log, "Invalid reaction window for resolution"] };
    }
    let resolveState = state;
    let reactionCard: CardDefinition | null = null;
    if (reaction) {
      reactionCard = getTacticCard(state, reaction.cardId);
      if (!reactionCard) {
        return { ...state, log: [...state.log, "Tactic card not available"] };
      }
      const definitionError = validateTacticDefinition(reactionCard);
      if (definitionError) {
        return {
          ...state,
          log: [...state.log, `Cannot play tactic: ${definitionError}`],
        };
      }
      if (reactionCard.reactionWindow !== reaction.window) {
        return { ...state, log: [...state.log, "Reaction window mismatch"] };
      }
      const windowError = validateReactionWindow(state, reaction.window);
      if (windowError) {
        return { ...state, log: [...state.log, `Cannot play tactic: ${windowError}`] };
      }
      const validationEffect: Effect = {
        id: "validation",
        sourceCardId: reactionCard.id,
        ownerId: state.activePlayer,
        hooks: {},
        targetUnitIds: reaction.targets?.unitIds,
      };
      const targetError = validateTargets(
        buildContext(state, validationEffect),
        reactionCard,
        reaction.targets
      );
      if (targetError) {
        return {
          ...state,
          log: [...state.log, `Cannot play tactic: ${targetError}`],
        };
      }
      resolveState = applyTacticEffect(
        state,
        reactionCard,
        state.activePlayer,
        reaction.targets
      );
    }

    let rollValue = resolveState.lastRoll.value;
    let outcome = resolveState.lastRoll.outcome;
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

export const initialGameState: GameState = {
  phase: "TURN_START",
  activePlayer: "PLAYER_A",
  turn: 1,
  boardWidth,
  boardHeight,
  units: [
    {
      id: "A1",
      owner: "PLAYER_A",
      type: "INFANTRY",
      position: { x: 2, y: 2 },
      movement: 3,
      attack: 1,
      hasMoved: false,
    },
    {
      id: "A2",
      owner: "PLAYER_A",
      type: "VEHICLE",
      position: { x: 4, y: 2 },
      movement: 2,
      attack: 2,
      hasMoved: false,
    },
    {
      id: "A3",
      owner: "PLAYER_A",
      type: "SPECIAL",
      position: { x: 6, y: 2 },
      movement: 2,
      attack: 3,
      hasMoved: false,
    },
    {
      id: "B1",
      owner: "PLAYER_B",
      type: "INFANTRY",
      position: { x: 2, y: 6 },
      movement: 3,
      attack: 1,
      hasMoved: false,
    },
    {
      id: "B2",
      owner: "PLAYER_B",
      type: "VEHICLE",
      position: { x: 4, y: 6 },
      movement: 2,
      attack: 2,
      hasMoved: false,
    },
    {
      id: "B3",
      owner: "PLAYER_B",
      type: "SPECIAL",
      position: { x: 6, y: 6 },
      movement: 2,
      attack: 3,
      hasMoved: false,
    },
  ],
  movesThisTurn: 0,
  commonDeck: initialCommonDeck.shuffled,
  tacticalDeck: initialTacticalDeck.shuffled,
  selectedTacticalDeck: initialTacticalDeck.shuffled,
  pendingCard: null,
  pendingAttack: null,
  storedBonuses: [],
  activeEffects: [],
  nextEffectId: 1,
  rngSeed: initialTacticalDeck.nextSeed,
  lastRoll: null,
  winner: null,
  log: ["", "", "", "", ""],
};
