import type { EngineConfig, EngineEvent, EngineIntent, GameState, StartMatchConfig } from "@/lib/engine";
import { applyIntent, startMatch } from "@/lib/engine";
import { getInitialRngSeed } from "@/lib/settings";

export type LocalRuntimeState = {
  engineState: GameState;
  eventLog: EngineEvent[];
  players: [string, string];
  activePlayerId: string;
  seed: number;
  config?: Partial<EngineConfig>;
};

export type LocalRuntimeAction =
  | { type: "START_MATCH"; seed?: number; config?: Partial<EngineConfig>; players?: [string, string] }
  | { type: "APPLY_INTENT"; intent: EngineIntent; actorId?: string };

type RuntimeInitArgs = {
  seed?: number;
  config?: Partial<EngineConfig>;
  players?: [string, string];
};

function resolvePlayers(players?: [string, string]): [string, string] {
  return players ?? ["P1", "P2"];
}

function resolveSeed(seed?: number): number {
  if (typeof seed === "number") {
    return seed >>> 0;
  }
  return getInitialRngSeed();
}

export function createLocalRuntimeState(args: RuntimeInitArgs): LocalRuntimeState {
  const seed = resolveSeed(args.seed);
  const players = resolvePlayers(args.players);
  const startConfig: StartMatchConfig = {
    seed,
    config: args.config,
  };
  const engineState = startMatch(startConfig);
  return {
    engineState,
    eventLog: [{ type: "match_started", seed, config: args.config }],
    players,
    activePlayerId: engineState.activePlayer === "PLAYER_A" ? players[0] : players[1],
    seed,
    config: args.config,
  };
}

export function localRuntimeReducer(
  state: LocalRuntimeState,
  action: LocalRuntimeAction
): LocalRuntimeState {
  if (action.type === "START_MATCH") {
    return createLocalRuntimeState({
      seed: action.seed ?? state.seed,
      config: action.config ?? state.config,
      players: action.players ?? state.players,
    });
  }

  const { intent, actorId } = action;
  if (actorId && actorId !== state.activePlayerId) {
    return state;
  }

  const { nextState, events } = applyIntent(state.engineState, intent);
  const activePlayerId =
    nextState.activePlayer === "PLAYER_A" ? state.players[0] : state.players[1];
  return {
    ...state,
    engineState: nextState,
    activePlayerId,
    eventLog: [...state.eventLog, ...events],
  };
}

export function replayMatchFromEvents(args: {
  events: EngineEvent[];
  seed: number;
  config?: Partial<EngineConfig>;
}): GameState {
  const baseState = startMatch({ seed: args.seed, config: args.config });
  return args.events.reduce((state, event) => {
    if (event.type !== "intent_applied") {
      return state;
    }
    return applyIntent(state, event.intent).nextState;
  }, baseState);
}
