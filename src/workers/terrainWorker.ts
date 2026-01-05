/// <reference lib="webworker" />

import { generateTerrainNetworks } from "@/lib/engine/terrain";
import type { TerrainSquarePenalties } from "@/lib/settings";

type TerrainWorkerRequest = {
  width: number;
  height: number;
  seed: number;
  roadDensity: number;
  riverDensity: number;
  maxBridges?: number;
  penalties: TerrainSquarePenalties;
};

type TerrainWorkerResponse = {
  terrain: {
    road: { x: number; y: number }[];
    river: { x: number; y: number }[];
    nextSeed: number;
  };
};

const ctx: DedicatedWorkerGlobalScope = self as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<TerrainWorkerRequest>) => {
  const { width, height, seed, roadDensity, riverDensity, maxBridges, penalties } = event.data;
  const terrain = generateTerrainNetworks({
    width,
    height,
    seed,
    roadDensity,
    riverDensity,
    maxBridges,
    penalties,
  });
  const response: TerrainWorkerResponse = { terrain };
  ctx.postMessage(response);
};
