/// <reference lib="webworker" />

import {
  formatTerrainStats,
  generateTerrainBiomes,
  generateTerrainNetworks,
} from "@/lib/engine/terrain";
import type { TerrainBiomeStats, TerrainType } from "@/lib/engine/gameState";
import type { TerrainSquarePenalties } from "@/lib/settings";

type TerrainWorkerRequest = {
  width: number;
  height: number;
  seed: number;
  roadDensity: number;
  riverDensity: number;
  maxBridges?: number;
  extraBridgeEvery?: number;
  extraBridgeMinSpacing?: number;
  penalties: TerrainSquarePenalties;
  debugTerrain?: boolean;
};

type TerrainWorkerResponse = {
  terrain: {
    road: { x: number; y: number }[];
    river: { x: number; y: number }[];
    biomes: TerrainType[][];
    stats: TerrainBiomeStats;
    nextSeed: number;
  };
};

const ctx: DedicatedWorkerGlobalScope = self as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<TerrainWorkerRequest>) => {
  const {
    width,
    height,
    seed,
    roadDensity,
    riverDensity,
    maxBridges,
    extraBridgeEvery,
    extraBridgeMinSpacing,
    penalties,
    debugTerrain,
  } = event.data;
  const networks = generateTerrainNetworks({
    width,
    height,
    seed,
    roadDensity,
    riverDensity,
    maxBridges,
    extraBridgeEvery,
    extraBridgeMinSpacing,
    penalties,
  });
  const biomes = generateTerrainBiomes({
    width,
    height,
    seed: networks.nextSeed,
    rivers: networks.river,
    roads: networks.road,
  });
  if (debugTerrain) {
    console.info("Terrain biome stats\n" + formatTerrainStats(biomes.stats));
  }
  const response: TerrainWorkerResponse = {
    terrain: {
      road: networks.road,
      river: networks.river,
      biomes: biomes.biomes,
      stats: biomes.stats,
      nextSeed: biomes.nextSeed,
    },
  };
  ctx.postMessage(response);
};
