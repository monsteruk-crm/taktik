export type {
  CardDefinition,
  CardKind,
  CardTiming,
  Effect,
  GamePhase,
  GameState,
  Player,
  ReactionWindow,
  TargetingSpec,
  Unit,
  UnitType,
} from "./gameState";

export type { GameAction } from "./reducer";
export { gameReducer, getUnitMovementWithEffects, initialGameState } from "./reducer";
