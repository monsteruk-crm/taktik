import Box from "@mui/material/Box";
import type { GameState } from "@/lib/engine/gameState";
import { posKey } from "@/lib/engine/selectors";
import { getBoardOrigin, getBoardPixelSize, gridToScreen, TILE_LAYOUT } from "@/lib/ui/iso";
import { edgeKey, mergeNetworks } from "@/lib/ui/networks";

type IsometricBoardProps = {
  state: GameState;
  selectedUnitId: string | null;
  hoveredTile: { x: number; y: number } | null;
  moveRange: { x: number; y: number }[];
  targetableTiles: { x: number; y: number }[];
  attackableTiles: { x: number; y: number }[];
};

export default function IsometricBoard({
  state,
  selectedUnitId,
  hoveredTile,
  moveRange,
  targetableTiles,
  attackableTiles,
}: IsometricBoardProps) {
  const width = state.boardWidth;
  const height = state.boardHeight;
  const { originX, originY } = getBoardOrigin(width, height);
  const { boardPixelWidth, boardPixelHeight } = getBoardPixelSize(width, height);
  const moveRangeKeys = new Set(moveRange.map(posKey));
  const { width: TILE_W, height: TILE_H } = TILE_LAYOUT;
  const connectorsByPos = mergeNetworks(state.terrain);
  const UNIT_BASE_SIZE = TILE_W * 0.52;
  const UNIT_SCALE_BY_TYPE = {
    INFANTRY: 0.95,
    VEHICLE: 1.05,
    SPECIAL: 1,
  } as const;
  const UNIT_OFFSET_X = 0;
  const UNIT_OFFSET_Y = TILE_H * 0.3;
  const REGISTRY_MARK_DISPLAY = { w: TILE_W, h: TILE_W };

  const tiles = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const { sx, sy } = gridToScreen({ x, y });
      const left = originX + sx - TILE_W / 2;
      const top = originY + sy - TILE_H / 2;
      const connectors = connectorsByPos.get(`${x},${y}`);
      const baseZ = (x + y) * 3;
      const roadKey = edgeKey(connectors?.road);
      const riverKey = edgeKey(connectors?.river);
      const roadSrc = roadKey ? `/assets/tiles/networks/road_${roadKey}.png` : null;
      const riverSrc = riverKey ? `/assets/tiles/networks/river_${riverKey}.png` : null;
      tiles.push(
        <Box
          key={`tile-${x}-${y}`}
          component="img"
          draggable={false}
          alt="Ground tile"
          src="/assets/tiles/ground.png"
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
        tiles.push(
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
        tiles.push(
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
    }
  }

  const moveHighlights = moveRange.map((pos) => {
    const { sx, sy } = gridToScreen(pos);
    const left = originX + sx - TILE_W / 2;
    const top = originY + sy - TILE_H / 2;
    const zIndex = (pos.x + pos.y) * 3 + 5;
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
          zIndex,
          pointerEvents: "none",
          userSelect: "none",
          WebkitUserDrag: "none",
        }}
      />
    );
  });

  const targetHighlights = targetableTiles.map((pos) => {
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
  });

  const attackHighlights = attackableTiles.map((pos) => {
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
          zIndex,
          pointerEvents: "none",
          userSelect: "none",
          WebkitUserDrag: "none",
        }}
      />
    );
  });

  const hoverHighlight = hoveredTile
    ? (() => {
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
      })()
    : null;

  const registryTile = {
    x: Math.floor(width / 2),
    y: Math.floor(height / 2),
  };
  const { sx: regSx, sy: regSy } = gridToScreen(registryTile);
  const registryLeft = originX + regSx - REGISTRY_MARK_DISPLAY.w / 2;
  const registryTop = originY + regSy + TILE_H / 2 - REGISTRY_MARK_DISPLAY.h;


  const units = state.units.map((unit) => {
    const { sx, sy } = gridToScreen(unit.position);
    const left = originX + sx + UNIT_OFFSET_X;
    const top = originY + sy + UNIT_OFFSET_Y;
    const isSelected = unit.id === selectedUnitId;
    const isInMoveRange = moveRangeKeys.has(posKey(unit.position));
    const unitVariant = unit.owner === "PLAYER_A" ? "a" : "b";
    const unitSrc =
      unit.type === "INFANTRY"
        ? `/assets/units/light_${unitVariant}.png`
        : unit.type === "VEHICLE"
          ? `/assets/units/mechanized_${unitVariant}.png`
          : `/assets/units/special_${unitVariant}.png`;
    const spriteSize = UNIT_BASE_SIZE * UNIT_SCALE_BY_TYPE[unit.type];

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
          userSelect: "none",
          pointerEvents: "none",
          WebkitUserDrag: "none",
        }}
      />
    );
  });

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
      <Box
        component="img"
        alt="Registry marker"
        src="/assets/tiles/registry.png"
        draggable={false}
        sx={{
          position: "absolute",
          left: registryLeft,
          top: registryTop,
          width: REGISTRY_MARK_DISPLAY.w,
          height: REGISTRY_MARK_DISPLAY.h,
          zIndex: registryTile.x + registryTile.y + 900,
          userSelect: "none",
          pointerEvents: "none",
          WebkitUserDrag: "none",
        }}
      />
      {units}
    </Box>
  );
}
