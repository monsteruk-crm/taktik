import { describe, expect, it } from "vitest";
import { applyIntent, startMatch, type EngineConfig, type EngineEvent, type EngineIntent } from "@/lib/engine";
import { replayMatchFromEvents } from "@/lib/runtime";

type SimulationResult = {
  state: ReturnType<typeof startMatch>;
  intents: EngineIntent[];
  events: EngineEvent[];
};

function applyAndRecord(
  state: ReturnType<typeof startMatch>,
  intent: EngineIntent,
  intents: EngineIntent[],
  events: EngineEvent[]
) {
  const result = applyIntent(state, intent);
  intents.push(intent);
  events.push(...result.events);
  return result.nextState;
}

function advanceToPhase(
  state: ReturnType<typeof startMatch>,
  target: ReturnType<typeof startMatch>["phase"],
  intents: EngineIntent[],
  events: EngineEvent[]
) {
  let nextState = state;
  let guard = 0;
  while (nextState.phase !== target && guard < 10) {
    nextState = applyAndRecord(nextState, { type: "NEXT_PHASE" }, intents, events);
    guard += 1;
  }
  return nextState;
}

function runHeadlessMatch(seed: number, config: Partial<EngineConfig>): SimulationResult {
  let state = startMatch({ seed, config });
  const intents: EngineIntent[] = [];
  const events: EngineEvent[] = [{ type: "match_started", seed, config }];
  let guard = 0;

  while (state.phase !== "VICTORY" && guard < 50) {
    state = advanceToPhase(state, "ATTACK", intents, events);
    const attacker = state.units.find((unit) => unit.owner === state.activePlayer);
    const target = state.units.find((unit) => unit.owner !== state.activePlayer);
    if (!attacker || !target) {
      break;
    }
    state = applyAndRecord(
      state,
      { type: "ATTACK_SELECT", attackerId: attacker.id, targetId: target.id },
      intents,
      events
    );
    state = advanceToPhase(state, "DICE_RESOLUTION", intents, events);
    state = applyAndRecord(state, { type: "ROLL_DICE" }, intents, events);
    state = applyAndRecord(state, { type: "RESOLVE_ATTACK" }, intents, events);
    if (state.phase !== "VICTORY") {
      state = applyAndRecord(state, { type: "END_TURN" }, intents, events);
      state = advanceToPhase(state, "TURN_START", intents, events);
    }
    guard += 1;
  }

  return { state, intents, events };
}

const fastMatchConfig: Partial<EngineConfig> = {
  unitComposition: {
    PLAYER_A: { INFANTRY: 1, VEHICLE: 0, SPECIAL: 0 },
    PLAYER_B: { INFANTRY: 1, VEHICLE: 0, SPECIAL: 0 },
  },
  unitAttackByType: {
    INFANTRY: 99,
    VEHICLE: 99,
    SPECIAL: 99,
  },
  unitMovementByType: {
    INFANTRY: 1,
    VEHICLE: 1,
    SPECIAL: 1,
  },
};

describe("engine abstraction runtime", () => {
  it("plays a full match headlessly", () => {
    const result = runHeadlessMatch(101, fastMatchConfig);
    expect(result.state.phase).toBe("VICTORY");
    expect(result.state.winner).not.toBeNull();
  });

  it("replays a match from the event log", () => {
    const result = runHeadlessMatch(202, fastMatchConfig);
    const replayed = replayMatchFromEvents({
      seed: 202,
      config: fastMatchConfig,
      events: result.events,
    });
    expect(replayed).toEqual(result.state);
  });

  it("is deterministic with the same seed and intents", () => {
    const runA = runHeadlessMatch(303, fastMatchConfig);
    let stateB = startMatch({ seed: 303, config: fastMatchConfig });
    for (const intent of runA.intents) {
      stateB = applyIntent(stateB, intent).nextState;
    }
    expect(stateB).toEqual(runA.state);
  });
});
