import type { CardDefinition, Effect, GameState, ReactionWindow } from "./gameState";
import type { ReactionPlay } from "@/types/reactions";
import { buildContext, instantiateEffect, validateTargets } from "./effects";

export type { ReactionPlay } from "@/types/reactions";

type ValidationOptions = {
  expectedWindows?: ReactionWindow[];
  invalidWindowMessage?: string;
};

type ValidationResult =
  | { ok: true; card: CardDefinition }
  | { ok: false; reason: string };

export function getOpenReactionWindows(state: GameState): ReactionWindow[] {
  if (state.phase === "VICTORY") {
    return [];
  }
  if (state.phase === "MOVEMENT") {
    return ["beforeMove"];
  }
  if (state.phase === "DICE_RESOLUTION" && state.pendingAttack) {
    if (!state.lastRoll) {
      return ["beforeAttackRoll"];
    }
    return ["afterAttackRoll", "beforeDamage"];
  }
  return [];
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

export function validateTacticReaction(
  state: GameState,
  reaction: ReactionPlay,
  options: ValidationOptions = {}
): ValidationResult {
  const { expectedWindows, invalidWindowMessage } = options;
  if (expectedWindows && !expectedWindows.includes(reaction.window)) {
    return {
      ok: false,
      reason: invalidWindowMessage ?? "Invalid reaction window",
    };
  }

  const reactionCard = getTacticCard(state, reaction.cardId);
  if (!reactionCard) {
    return { ok: false, reason: "Tactic card not available" };
  }

  const definitionError = validateTacticDefinition(reactionCard);
  if (definitionError) {
    return { ok: false, reason: `Cannot play tactic: ${definitionError}` };
  }

  if (reactionCard.reactionWindow !== reaction.window) {
    return { ok: false, reason: "Reaction window mismatch" };
  }

  const windowError = validateReactionWindow(state, reaction.window);
  if (windowError) {
    return { ok: false, reason: `Cannot play tactic: ${windowError}` };
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
    return { ok: false, reason: `Cannot play tactic: ${targetError}` };
  }

  if (reaction.window === "beforeMove" && reactionCard.targeting.type === "unit") {
    const invalidTarget = (reaction.targets?.unitIds ?? []).find((unitId) =>
      state.units.find((unit) => unit.id === unitId && unit.hasMoved)
    );
    if (invalidTarget) {
      return { ok: false, reason: "Cannot play tactic: target already moved" };
    }
  }

  return { ok: true, card: reactionCard };
}

export function applyTacticReaction(
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

export function validateAndApplyTacticReaction(
  state: GameState,
  reaction: ReactionPlay,
  options: ValidationOptions = {}
): { ok: true; state: GameState; card: CardDefinition } | { ok: false; state: GameState } {
  const validation = validateTacticReaction(state, reaction, options);
  if (!validation.ok) {
    return { ok: false, state: { ...state, log: [...state.log, validation.reason] } };
  }
  const nextState = applyTacticReaction(
    state,
    validation.card,
    state.activePlayer,
    reaction.targets
  );
  return { ok: true, state: nextState, card: validation.card };
}

export function canPlayTacticInWindow(
  state: GameState,
  cardId: string,
  window: ReactionWindow,
  targets?: { unitIds?: string[] }
) {
  return validateTacticReaction(state, { cardId, window, targets }).ok;
}
