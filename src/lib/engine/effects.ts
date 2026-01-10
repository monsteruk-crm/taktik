import type {
  CardDefinition,
  Effect,
  EffectDefinition,
  EngineContext,
  GameState,
} from "./gameState";

function getUnitOwner(units: GameState["units"], unitId: string) {
  return units.find((unit) => unit.id === unitId)?.owner ?? null;
}

export function buildContext(state: GameState, effect: Effect): EngineContext {
  return {
    activePlayerId: state.activePlayer,
    opponentPlayerId: state.activePlayer === "PLAYER_A" ? "PLAYER_B" : "PLAYER_A",
    effect,
    getUnitOwner: (unitId) => getUnitOwner(state.units, unitId),
    isUnitDamaged: () => false,
  };
}

export function instantiateEffect(
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

export function validateTargets(
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
  const minCount = card.targeting.count;
  const maxCount = card.targeting.maxCount ?? minCount;
  if (targets.unitIds.length < minCount || targets.unitIds.length > maxCount) {
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
