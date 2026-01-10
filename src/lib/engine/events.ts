import type { EngineIntent } from "@/types/reducer";
import type { EngineConfig } from "./config";
import type { Player } from "./gameState";

export type EngineEvent =
  | { type: "match_started"; seed: number; config?: Partial<EngineConfig> }
  | { type: "intent_applied"; intent: EngineIntent }
  | {
      type: "deck_shuffled";
      deck: "common";
      seedBefore: number;
      seedAfter: number;
    }
  | {
      type: "dice_rolled";
      attackerId: string;
      targetId: string;
      value: number;
      outcome: "HIT" | "MISS";
      owner: Player;
    };
