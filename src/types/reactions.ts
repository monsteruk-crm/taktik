import type { ReactionWindow } from "@/types/engine";

export type ReactionPlay = {
  cardId: string;
  window: ReactionWindow;
  targets?: { unitIds?: string[] };
};
