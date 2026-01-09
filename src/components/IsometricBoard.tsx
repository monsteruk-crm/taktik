"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { GameState, TerrainType } from "@/lib/engine/gameState";
import { posKey } from "@/lib/engine/selectors";
import { getBoardOrigin, getBoardPixelSize, gridToScreen, TILE_LAYOUT } from "@/lib/ui/iso";
import { edgeKey, mergeNetworks } from "@/lib/ui/networks";
import { TERRAIN_DEBUG_TILE_SRC, TERRAIN_TILE_SRC } from "@/lib/ui/terrain";
import { initialUnitDisplayConfig, moveHighlightSweep } from "@/lib/settings";
import BoardFxLayer from "@/components/BoardFxLayer";

const UNIT_SCALE_BY_TYPE = {
  INFANTRY: 0.95,
  VEHICLE: 1.05,
  SPECIAL: 1,
} as const;

type IsometricBoardProps = {
  state: GameState;
  selectedUnitId: string | null;
  hoveredTile: { x: number; y: number } | null;
  moveRange: { x: number; y: number }[];
  targetableTiles: { x: number; y: number }[];
  attackableTiles: { x: number; y: number }[];
  showTerrainDebug?: boolean;
};

export default function IsometricBoard({
  state,
  selectedUnitId,
  hoveredTile,
  moveRange,
  targetableTiles,
  attackableTiles,
  showTerrainDebug = false,
}: IsometricBoardProps) {
  const width = state.boardWidth;
  const height = state.boardHeight;
  const { originX, originY } = useMemo(() => getBoardOrigin(width, height), [width, height]);
  const { boardPixelWidth, boardPixelHeight } = useMemo(
    () => getBoardPixelSize(width, height),
    [width, height]
  );
  const moveRangeKeys = useMemo(() => new Set(moveRange.map(posKey)), [moveRange]);
  const selectedUnit = useMemo(
    () => state.units.find((unit) => unit.id === selectedUnitId) ?? null,
    [selectedUnitId, state.units]
  );
  const moveRangeDistances = useMemo(() => {
    if (!selectedUnit) {
      return new Map<string, number>();
    }
    const distances = new Map<string, number>();
    for (const pos of moveRange) {
      const dx = Math.abs(pos.x - selectedUnit.position.x);
      const dy = Math.abs(pos.y - selectedUnit.position.y);
      distances.set(posKey(pos), dx + dy);
    }
    return distances;
  }, [moveRange, selectedUnit]);
  const maxMoveDistance = useMemo(() => {
    let maxDistance = 0;
    moveRangeDistances.forEach((value) => {
      if (value > maxDistance) {
        maxDistance = value;
      }
    });
    return maxDistance;
  }, [moveRangeDistances]);
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [sweepRadius, setSweepRadius] = useState(0);
  const hasMountedRef = useRef(false);
  const { width: TILE_W, height: TILE_H } = TILE_LAYOUT;
  const { connectorsByPos, roadKeys, riverKeys } = useMemo(() => {
    return {
      connectorsByPos: mergeNetworks(state.terrain),
      roadKeys: new Set(state.terrain.road.map((cell) => `${cell.x},${cell.y}`)),
      riverKeys: new Set(state.terrain.river.map((cell) => `${cell.x},${cell.y}`)),
    };
  }, [state.terrain]);
  const UNIT_BASE_SIZE = TILE_W * 0.52;
  const UNIT_OFFSET_X = 0;
  const UNIT_OFFSET_Y = TILE_H * 0.3;

  useEffect(() => {
    hasMountedRef.current = true;
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setSweepRadius(maxMoveDistance);
      return;
    }
    if (!selectedUnit || moveRange.length === 0 || maxMoveDistance === 0) {
      setSweepRadius(0);
      return;
    }
    let rafId = 0;
    const ringTravelMs = Math.max(1, maxMoveDistance) * moveHighlightSweep.msPerRing;
    const holdMs = Math.max(0, moveHighlightSweep.holdMs);
    const cycleMs = ringTravelMs * 2 + holdMs * 2;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const phase = elapsed % cycleMs;
      let radius = 0;
      if (phase < ringTravelMs) {
        radius = (phase / ringTravelMs) * maxMoveDistance;
      } else if (phase < ringTravelMs + holdMs) {
        radius = maxMoveDistance;
      } else if (phase < ringTravelMs + holdMs + ringTravelMs) {
        radius = (1 - (phase - ringTravelMs - holdMs) / ringTravelMs) * maxMoveDistance;
      } else {
        radius = 0;
      }
      setSweepRadius(radius);
      rafId = window.requestAnimationFrame(step);
    };
    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [maxMoveDistance, moveRange.length, prefersReducedMotion, selectedUnit]);

  const tiles = useMemo(() => {
    const result: ReactElement[] = [];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const { sx, sy } = gridToScreen({ x, y });
        const left = originX + sx - TILE_W / 2;
        const top = originY + sy - TILE_H / 2;
        const connectors = connectorsByPos.get(`${x},${y}`);
        const baseZ = (x + y) * 3;
        const cellKey = `${x},${y}`;
        const hasBridge = roadKeys.has(cellKey) && riverKeys.has(cellKey);
        const roadKey = edgeKey(connectors?.road);
        const riverKey = edgeKey(connectors?.river);
        const roadSrc = roadKey ? `/assets/tiles/networks/road_${roadKey}.png` : null;
        const riverSrc = riverKey ? `/assets/tiles/networks/river_${riverKey}.png` : null;
        const terrainType =
          state.terrain.biomes[y]?.[x] ?? ("PLAIN" as TerrainType);
        const baseSrc = showTerrainDebug
          ? TERRAIN_DEBUG_TILE_SRC[terrainType]
          : TERRAIN_TILE_SRC[terrainType];
        result.push(
          <Box
            key={`tile-${x}-${y}`}
            component="img"
            draggable={false}
            alt="Ground tile"
            src={baseSrc}
            onDragStart={(event) => {
              event.preventDefault();
            }}
            sx={{
              position: "absolute",
              left,
              top,
              width: TILE_W,
              height: TILE_H,
              zIndex: baseZ,
              userSelect: "none",
              WebkitUserDrag: "none",
            }}
          />
        );
        if (riverSrc) {
          result.push(
            <Box
              key={`river-${x}-${y}`}
              component="img"
              draggable={false}
              alt="River overlay"
              src={riverSrc}
              sx={{
                position: "absolute",
                left,
                top,
                width: TILE_W,
                height: TILE_H,
                zIndex: baseZ + 1,
                pointerEvents: "none",
                userSelect: "none",
                WebkitUserDrag: "none",
              }}
            />
          );
        }
        if (roadSrc) {
          result.push(
            <Box
              key={`road-${x}-${y}`}
              component="img"
              draggable={false}
              alt="Road overlay"
              src={roadSrc}
              sx={{
                position: "absolute",
                left,
                top,
                width: TILE_W,
                height: TILE_H,
                zIndex: baseZ + 2,
                pointerEvents: "none",
                userSelect: "none",
                WebkitUserDrag: "none",
              }}
            />
          );
        }
        if (hasBridge) {
          result.push(
            <Box
              key={`bridge-${x}-${y}`}
              component="img"
              draggable={false}
              alt="Bridge overlay"
              src="/assets/tiles/networks/bridge_square.png"
              sx={{
                position: "absolute",
                left,
                top,
                width: TILE_W,
                height: TILE_H,
                zIndex: baseZ + 3,
                pointerEvents: "none",
                userSelect: "none",
                WebkitUserDrag: "none",
              }}
            />
          );
        }
      }
    }
    return result;
  }, [
    TILE_H,
    TILE_W,
    connectorsByPos,
    height,
    originX,
    originY,
    riverKeys,
    roadKeys,
    showTerrainDebug,
    state.terrain.biomes,
    width,
  ]);

  const moveHighlights = useMemo(
    () =>
      moveRange.map((pos) => {
        const { sx, sy } = gridToScreen(pos);
        const left = originX + sx - TILE_W / 2;
        const top = originY + sy - TILE_H / 2;
        const zIndex = (pos.x + pos.y) * 3 + 5;
        const distance = moveRangeDistances.get(posKey(pos)) ?? 0;
        const fadeWidth = moveHighlightSweep.fadeWidth;
        const rawOpacity = (sweepRadius - (distance - fadeWidth)) / fadeWidth;
        const opacity =
          Math.max(0, Math.min(1, rawOpacity)) * moveHighlightSweep.maxOpacity;
        return (
          <Box
            key={`highlight-${posKey(pos)}`}
            component="img"
            draggable={false}
            alt="Move highlight"
            src="/assets/tiles/highlight_move_adv.png"
            className="moveHighlight"
            onError={(event) => {
              event.currentTarget.src = "/assets/tiles/highlight_move.png";
            }}
            sx={{
              position: "absolute",
              left,
              top,
              width: TILE_W,
              height: TILE_H,
              opacity,
              zIndex,
              pointerEvents: "none",
              userSelect: "none",
              WebkitUserDrag: "none",
            }}
          />
        );
      }),
    [TILE_H, TILE_W, moveRange, moveRangeDistances, originX, originY, sweepRadius]
  );

  const targetHighlights = useMemo(
    () =>
      targetableTiles.map((pos) => {
        const { sx, sy } = gridToScreen(pos);
        const left = originX + sx - TILE_W / 2;
        const top = originY + sy - TILE_H / 2;
        const zIndex = (pos.x + pos.y) * 3 + 6;
        return (
          <Box
            key={`target-highlight-${posKey(pos)}`}
            component="img"
            draggable={false}
            alt="Target highlight"
            src="/assets/tiles/highlight_target_confirm.png"
            className="moveHighlight"
            onError={(event) => {
              event.currentTarget.src = "/assets/tiles/highlight_move.png";
            }}
            sx={{
              position: "absolute",
              left,
              top,
              width: TILE_W,
              height: TILE_H,
              zIndex,
              pointerEvents: "none",
              userSelect: "none",
              WebkitUserDrag: "none",
            }}
          />
        );
      }),
    [TILE_H, TILE_W, originX, originY, targetableTiles]
  );

  const attackHighlights = useMemo(
    () =>
      attackableTiles.map((pos) => {
        const { sx, sy } = gridToScreen(pos);
        const left = originX + sx - TILE_W / 2;
        const top = originY + sy - TILE_H / 2;
        const zIndex = (pos.x + pos.y) * 3 + 6;
        return (
          <Box
            key={`attack-highlight-${posKey(pos)}`}
            component="img"
            draggable={false}
            alt="Attack highlight"
            src="/assets/tiles/highlight_attack.png"
            className="moveHighlight"
            onError={(event) => {
              event.currentTarget.src = "/assets/tiles/highlight_move.png";
            }}
            sx={{
              position: "absolute",
              left,
              top,
              width: TILE_W,
              height: TILE_H,
              zIndex,
              pointerEvents: "none",
              userSelect: "none",
              WebkitUserDrag: "none",
            }}
          />
        );
      }),
    [TILE_H, TILE_W, attackableTiles, originX, originY]
  );

  const hoverHighlight = useMemo(() => {
    if (!hoveredTile) {
      return null;
    }
    const { sx, sy } = gridToScreen(hoveredTile);
    const left = originX + sx - TILE_W / 2;
    const top = originY + sy - TILE_H / 2;
    const zIndex = (hoveredTile.x + hoveredTile.y) * 3 + 7;
    return (
      <Box
        key={`hover-highlight-${posKey(hoveredTile)}`}
        component="img"
        draggable={false}
        alt="Hover highlight"
        src="/assets/tiles/highlight_move.png"
        className="moveHighlight"
        onError={(event) => {
          event.currentTarget.src = "/assets/tiles/highlight_move.png";
        }}
        sx={{
          position: "absolute",
          left,
          top,
          width: TILE_W,
          height: TILE_H,
          zIndex,
          pointerEvents: "none",
          userSelect: "none",
          WebkitUserDrag: "none",
        }}
      />
    );
  }, [TILE_H, TILE_W, hoveredTile, originX, originY]);


  const units = useMemo(
    () =>
      state.units.map((unit) => {
        const { sx, sy } = gridToScreen(unit.position);
        const displayTweak = initialUnitDisplayConfig[unit.type];
        const left = originX + sx + UNIT_OFFSET_X + displayTweak.offsetX;
        const top = originY + sy + UNIT_OFFSET_Y + displayTweak.offsetY;
        const isSelected = unit.id === selectedUnitId;
        const isInMoveRange = moveRangeKeys.has(posKey(unit.position));
        const canAnimate = hasMountedRef.current && !prefersReducedMotion;
        const unitVariant = unit.owner === "PLAYER_A" ? "a" : "b";
        const unitSrc =
          unit.type === "INFANTRY"
            ? `/assets/units/light_${unitVariant}.png`
            : unit.type === "VEHICLE"
              ? `/assets/units/mechanized_${unitVariant}.png`
              : `/assets/units/special_${unitVariant}.png`;
        const spriteSize =
          UNIT_BASE_SIZE *
          UNIT_SCALE_BY_TYPE[unit.type] *
          (1 + displayTweak.scale);

        return (
          <Box
            key={`unit-${unit.id}`}
            component="img"
            draggable={false}
            alt={`${unit.type} unit`}
            src={unitSrc}
            sx={{
              position: "absolute",
              left,
              top,
              width: spriteSize,
              height: spriteSize,
              transform: "translate(-50%, -100%)",
              zIndex: unit.position.x + unit.position.y + 1000,
              outline: isSelected ? "3px solid #0f766e" : "none",
              outlineOffset: 2,
              opacity: isInMoveRange ? 0.85 : 1,
              transition: canAnimate ? "left 200ms linear, top 200ms linear" : "none",
              userSelect: "none",
              pointerEvents: "none",
              WebkitUserDrag: "none",
            }}
          />
        );
      }),
    [UNIT_BASE_SIZE, UNIT_OFFSET_X, UNIT_OFFSET_Y, moveRangeKeys, originX, originY, selectedUnitId, state.units]
  );

  return (
    <Box
      sx={{
        position: "relative",
        width: boardPixelWidth,
        height: boardPixelHeight,
      }}
    >
      {tiles}
      {moveHighlights}
      {targetHighlights}
      {attackHighlights}
      {hoverHighlight}
      {units}
      <BoardFxLayer
        state={state}
        originX={originX}
        originY={originY}
        tileW={TILE_W}
        tileH={TILE_H}
        unitOffsetY={UNIT_OFFSET_Y}
        reducedMotion={prefersReducedMotion}
      />
    </Box>
  );
}
