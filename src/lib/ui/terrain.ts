import type { TerrainType } from "@/lib/engine/gameState";
import { terrainDebugColors } from "@/lib/ui/semanticColors";

export const TERRAIN_ORDER: TerrainType[] = [
  "PLAIN",
  "ROUGH",
  "FOREST",
  "URBAN",
  "INDUSTRIAL",
  "HILL",
  "WATER",
];

export const TERRAIN_TILE_SRC: Record<TerrainType, string> = {
  PLAIN: "/assets/tiles/terrain-01-plain.png",
  ROUGH: "/assets/tiles/terrain-02-rough.png",
  FOREST: "/assets/tiles/terrain-03-forest.png",
  URBAN: "/assets/tiles/terrain-04-urban.png",
  HILL: "/assets/tiles/terrain-05-hill.png",
  WATER: "/assets/tiles/terrain-06-water.png",
  INDUSTRIAL: "/assets/tiles/terrain-10-industrial.png",
};

export const TERRAIN_DEBUG_COLORS: Record<TerrainType, string> = terrainDebugColors;

export function makeTerrainDebugTileSrc(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><polygon points="50,0 100,25 50,50 0,25" fill="${color}" stroke="#1B1B1B" stroke-width="2"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const TERRAIN_DEBUG_TILE_SRC: Record<TerrainType, string> = {
  PLAIN: makeTerrainDebugTileSrc(TERRAIN_DEBUG_COLORS.PLAIN),
  ROUGH: makeTerrainDebugTileSrc(TERRAIN_DEBUG_COLORS.ROUGH),
  FOREST: makeTerrainDebugTileSrc(TERRAIN_DEBUG_COLORS.FOREST),
  URBAN: makeTerrainDebugTileSrc(TERRAIN_DEBUG_COLORS.URBAN),
  INDUSTRIAL: makeTerrainDebugTileSrc(TERRAIN_DEBUG_COLORS.INDUSTRIAL),
  HILL: makeTerrainDebugTileSrc(TERRAIN_DEBUG_COLORS.HILL),
  WATER: makeTerrainDebugTileSrc(TERRAIN_DEBUG_COLORS.WATER),
};
