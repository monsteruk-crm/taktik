import type { EngineIntent, TerrainResult } from "@/types/reducer";
import type { GameState } from "./gameState";
import type { EngineEvent } from "./events";
import { createInitialGameState, createInitialGameStateFromBootstrap, gameReducer, prepareGameBootstrap } from "./reducer";
import { resolveEngineConfig, type EngineConfig } from "./config";

export type StartMatchConfig = {
  seed: number;
  config?: Partial<EngineConfig>;
  terrain?: TerrainResult;
};

export function startMatch(config: StartMatchConfig): GameState {
  const resolved = resolveEngineConfig(config.config);
  if (config.terrain) {
    const bootstrap = prepareGameBootstrap(config.seed);
    return createInitialGameStateFromBootstrap({
      bootstrap,
      terrain: config.terrain,
      config: resolved,
    });
  }
  return createInitialGameState(config.seed, resolved);
}

export function applyIntent(
  state: GameState,
  intent: EngineIntent
): { nextState: GameState; events: EngineEvent[] } {
  const nextState = gameReducer(state, intent);
  const events: EngineEvent[] = [{ type: "intent_applied", intent }];

  if (
    intent.type === "DRAW_CARD" &&
    state.commonDeck.length === 0 &&
    nextState.commonDeck.length > 0
  ) {
    events.push({
      type: "deck_shuffled",
      deck: "common",
      seedBefore: state.rngSeed,
      seedAfter: nextState.rngSeed,
    });
  }

  if (intent.type === "ROLL_DICE" && nextState.lastRoll && nextState.pendingAttack) {
    const wasRolled =
      !state.lastRoll ||
      state.lastRoll.value !== nextState.lastRoll.value ||
      state.lastRoll.outcome !== nextState.lastRoll.outcome;
    if (wasRolled) {
      events.push({
        type: "dice_rolled",
        attackerId: nextState.pendingAttack.attackerId,
        targetId: nextState.pendingAttack.targetId,
        value: nextState.lastRoll.value,
        outcome: nextState.lastRoll.outcome,
        owner: nextState.activePlayer,
      });
    }
  }

  return { nextState, events };
}
