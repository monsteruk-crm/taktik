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
  const UNIT_BASE_SIZE = TILE_W * 0.52;
  const UNIT_SCALE_BY_TYPE = {
    INFANTRY: 0.95,
    VEHICLE: 1.05,
    SPECIAL: 1,
  } as const;
  const UNIT_OFFSET_X = 0;
  const UNIT_OFFSET_Y = TILE_H * 0.3;

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
            zIndex: x + y,
            userSelect: "none",
            WebkitUserDrag: "none",
            transition: "filter 120ms ease",
            "&:hover": {
              filter: "brightness(1.15) saturate(1.4) hue-rotate(-20deg)",
            },
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
        draggable={false}
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
          WebkitUserDrag: "none",
        }}
      />
    );
  });


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
      {highlights}
      {units}
    </Box>
  );
}
