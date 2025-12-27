import Box from "@mui/material/Box";
import type { GameState } from "@/lib/engine/gameState";
import { posKey } from "@/lib/engine/selectors";
import { getBoardOrigin, getBoardPixelSize, gridToScreen, TILE_H, TILE_W } from "@/lib/ui/iso";

type IsometricBoardProps = {
  state: GameState;
  selectedUnitId: string | null;
  moveRange: { x: number; y: number }[];
};

export default function IsometricBoard({
  state,
  selectedUnitId,
  moveRange,
}: IsometricBoardProps) {
  const width = state.boardWidth;
  const height = state.boardHeight;
  const { originX, originY } = getBoardOrigin(width, height);
  const { boardPixelWidth, boardPixelHeight } = getBoardPixelSize(width, height);
  const moveRangeKeys = new Set(moveRange.map(posKey));

  const tiles = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const { sx, sy } = gridToScreen({ x, y });
      const left = originX + sx - TILE_W / 2;
      const top = originY + sy - TILE_H / 2;
      tiles.push(
        <Box
          key={`tile-${x}-${y}`}
          component="img"
          alt="Ground tile"
          src="/assets/tiles/ground.png"
          sx={{
            position: "absolute",
            left,
            top,
            width: TILE_W,
            height: TILE_H,
            zIndex: x + y,
            userSelect: "none",
            pointerEvents: "none",
          }}
        />
      );
    }
  }

  const highlights = moveRange.map((pos) => {
    const { sx, sy } = gridToScreen(pos);
    const left = originX + sx - TILE_W / 2;
    const top = originY + sy - TILE_H / 2;
    const zIndex = pos.x + pos.y + 1;
    return (
      <Box
        key={`highlight-${posKey(pos)}`}
        component="img"
        alt="Move highlight"
        src="/assets/tiles/highlight_move.png"
        className="moveHighlight"
        sx={{
          position: "absolute",
          left,
          top,
          width: TILE_W,
          height: TILE_H,
          zIndex,
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
    );
  });

  const unitOffsetX = 0;
  const unitOffsetY = 10;

  const units = state.units.map((unit) => {
    const { sx, sy } = gridToScreen(unit.position);
    const left = originX + sx + unitOffsetX;
    const top = originY + sy + unitOffsetY;
    const isSelected = unit.id === selectedUnitId;
    const isInMoveRange = moveRangeKeys.has(posKey(unit.position));
    const unitVariant = unit.owner === "PLAYER_A" ? "a" : "b";
    const unitSrc =
      unit.type === "INFANTRY"
        ? `/assets/units/light_${unitVariant}.png`
        : unit.type === "VEHICLE"
          ? `/assets/units/mechanized_${unitVariant}.png`
          : `/assets/units/special_${unitVariant}.png`;

    return (
      <Box
        key={`unit-${unit.id}`}
        component="img"
        alt={`${unit.type} unit`}
        src={unitSrc}
        sx={{
          position: "absolute",
          left,
          top,
          width: 64,
          height: 64,
          transform: "translate(-50%, -100%)",
          zIndex: unit.position.x + unit.position.y + 1000,
          outline: isSelected ? "3px solid #0f766e" : "none",
          outlineOffset: 2,
          opacity: isInMoveRange ? 0.85 : 1,
          userSelect: "none",
          pointerEvents: "none",
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
      {highlights}
      {units}
    </Box>
  );
}
