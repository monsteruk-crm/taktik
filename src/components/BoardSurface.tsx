"use client";

import type { RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameState } from "@/lib/engine/gameState";
import BoardViewport from "@/components/BoardViewport";
import IsometricBoard from "@/components/IsometricBoard";
import { getBoardOrigin, gridToScreen, screenToGrid } from "@/lib/ui/iso";

type BoardSurfaceProps = {
  state: GameState;
  mode: "MOVE" | "ATTACK";
  selectedUnitId: string | null;
  selectedAttackerId: string | null;
  moveRange: { x: number; y: number }[];
  targetableTiles: { x: number; y: number }[];
  attackableTiles: { x: number; y: number }[];
  terrainReady: boolean;
  showTerrainDebug?: boolean;
  onTileClick: (position: { x: number; y: number }) => void;
};

export default function BoardSurface({
  state,
  mode,
  selectedUnitId,
  selectedAttackerId,
  moveRange,
  targetableTiles,
  attackableTiles,
  terrainReady,
  showTerrainDebug = false,
  onTileClick,
}: BoardSurfaceProps) {
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const hoverFrameRef = useRef<number | null>(null);
  const hoverArgsRef = useRef<{
    clientX: number;
    clientY: number;
    panX: number;
    panY: number;
    zoom: number;
    viewportRef: RefObject<HTMLDivElement | null>;
    isPanning: boolean;
  } | null>(null);
  const { originX, originY } = useMemo(
    () => getBoardOrigin(state.boardWidth, state.boardHeight),
    [state.boardWidth, state.boardHeight]
  );
  const medianUnitPosition = useMemo(() => {
    if (state.units.length === 0) {
      return { x: Math.floor(state.boardWidth / 2), y: Math.floor(state.boardHeight / 2) };
    }
    const xs = state.units.map((unit) => unit.position.x).sort((a, b) => a - b);
    const ys = state.units.map((unit) => unit.position.y).sort((a, b) => a - b);
    const mid = Math.floor(xs.length / 2);
    const medianX = xs.length % 2 === 0 ? (xs[mid - 1] + xs[mid]) / 2 : xs[mid];
    const medianY = ys.length % 2 === 0 ? (ys[mid - 1] + ys[mid]) / 2 : ys[mid];
    return { x: medianX, y: medianY };
  }, [state.boardHeight, state.boardWidth, state.units]);
  const initialPan = useMemo(() => {
    const { sx, sy } = gridToScreen(medianUnitPosition);
    const worldX = originX + sx;
    const worldY = originY + sy;
    return ({ width, height }: { width: number; height: number }) => ({
      x: width / 2 - worldX,
      y: height / 2 - worldY,
    });
  }, [medianUnitPosition, originX, originY]);

  const clearHover = useCallback(() => {
    setHoveredTile((current) => (current ? null : current));
  }, []);

  const flushHover = useCallback(() => {
    hoverFrameRef.current = null;
    const args = hoverArgsRef.current;
    if (!args || !terrainReady) {
      return;
    }
    if (!args.viewportRef.current) {
      return;
    }
    if (args.isPanning) {
      clearHover();
      return;
    }
    const rect = args.viewportRef.current.getBoundingClientRect();
    const localX = (args.clientX - rect.left - args.panX) / args.zoom;
    const localY = (args.clientY - rect.top - args.panY) / args.zoom;
    const { x, y } = screenToGrid(localX - originX, localY - originY);
    if (x < 0 || x >= state.boardWidth || y < 0 || y >= state.boardHeight) {
      clearHover();
      return;
    }
    setHoveredTile((current) => {
      if (current && current.x === x && current.y === y) {
        return current;
      }
      return { x, y };
    });
  }, [clearHover, originX, originY, state.boardHeight, state.boardWidth, terrainReady]);

  const handleViewportHover = useCallback(
    (args: {
      clientX: number;
      clientY: number;
      panX: number;
      panY: number;
      zoom: number;
      viewportRef: RefObject<HTMLDivElement | null>;
      isPanning: boolean;
    }) => {
      hoverArgsRef.current = args;
      if (hoverFrameRef.current !== null) {
        return;
      }
      hoverFrameRef.current = window.requestAnimationFrame(flushHover);
    },
    [flushHover]
  );

  const handleHoverEnd = useCallback(() => {
    hoverArgsRef.current = null;
    setHoveredTile(null);
    if (hoverFrameRef.current !== null) {
      window.cancelAnimationFrame(hoverFrameRef.current);
      hoverFrameRef.current = null;
    }
  }, []);

  const handleViewportClick = useCallback(
    (args: {
      clientX: number;
      clientY: number;
      panX: number;
      panY: number;
      zoom: number;
      viewportRef: RefObject<HTMLDivElement | null>;
    }) => {
      if (!terrainReady) {
        return;
      }
      if (!args.viewportRef.current) {
        return;
      }
      const rect = args.viewportRef.current.getBoundingClientRect();
      const localX = (args.clientX - rect.left - args.panX) / args.zoom;
      const localY = (args.clientY - rect.top - args.panY) / args.zoom;
      const { x, y } = screenToGrid(localX - originX, localY - originY);
      if (x < 0 || x >= state.boardWidth || y < 0 || y >= state.boardHeight) {
        return;
      }
      onTileClick({ x, y });
    },
    [onTileClick, originX, originY, state.boardHeight, state.boardWidth, terrainReady]
  );

  useEffect(() => {
    return () => {
      if (hoverFrameRef.current !== null) {
        window.cancelAnimationFrame(hoverFrameRef.current);
      }
    };
  }, []);

  const activeUnitId = mode === "MOVE" ? selectedUnitId : selectedAttackerId;

  return (
    <BoardViewport
      onClick={handleViewportClick}
      onHover={handleViewportHover}
      onHoverEnd={handleHoverEnd}
      sx={{
        height: "100%",
      }}
      initialPan={initialPan}
    >
      {() => (
        <IsometricBoard
          state={state}
          selectedUnitId={activeUnitId}
          hoveredTile={hoveredTile}
          moveRange={moveRange}
          targetableTiles={targetableTiles}
          attackableTiles={attackableTiles}
          showTerrainDebug={showTerrainDebug}
        />
      )}
    </BoardViewport>
  );
}
