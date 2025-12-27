import Box from "@mui/material/Box";
import type { Unit } from "@/lib/engine/gameState";

type BoardProps = {
  units: Unit[];
  selectedUnitId: string | null;
  selectedUnitForMove: Unit | null;
  selectedUnitMovement: number | null;
  highlightedUnitIds?: string[];
  onTileClick: (position: { x: number; y: number }) => void;
};

export default function Board({
  units,
  selectedUnitId,
  selectedUnitForMove,
  selectedUnitMovement,
  highlightedUnitIds,
  onTileClick,
}: BoardProps) {
  const width = 20;
  const height = 30;
  const unitByPosition = new Map<string, Unit>();
  const moveRangePositions = new Set<string>();

  for (const unit of units) {
    unitByPosition.set(`${unit.position.x},${unit.position.y}`, unit);
  }

  if (selectedUnitForMove && selectedUnitMovement !== null) {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const distance =
          Math.abs(selectedUnitForMove.position.x - x) +
          Math.abs(selectedUnitForMove.position.y - y);
        if (distance > 0 && distance <= selectedUnitMovement) {
          const occupied = unitByPosition.has(`${x},${y}`);
          if (!occupied) {
            moveRangePositions.add(`${x},${y}`);
          }
        }
      }
    }
  }

  const tiles = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const unit = unitByPosition.get(`${x},${y}`);
      const isSelected = unit?.id === selectedUnitId;
      const isHighlighted = unit ? highlightedUnitIds?.includes(unit.id) ?? false : false;
      const inMoveRange = moveRangePositions.has(`${x},${y}`);
      const backgroundColor = inMoveRange
        ? "#fff4cc"
        : unit?.owner === "PLAYER_A"
          ? "#dbeafe"
          : unit?.owner === "PLAYER_B"
            ? "#fee2e2"
            : "#ffffff";

      return (
        <Box
          key={`${x}-${y}`}
          sx={{
            display: "flex",
            height: 48,
            width: 64,
            alignItems: "center",
            justifyContent: "center",
            border: isHighlighted ? "3px solid #16a34a" : "1px solid #000",
            fontSize: "0.75rem",
            backgroundColor,
          }}
          onClick={() => onTileClick({ x, y })}
        >
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box>
              ({x},{y})
            </Box>
            {unit ? (
              <Box>
                {unit.id} {unit.owner}
                {isSelected ? " SELECTED" : ""}
              </Box>
            ) : null}
          </Box>
        </Box>
      );
    })
  ).flat();

  return (
    <Box
      sx={{
        maxHeight: "70vh",
        maxWidth: "100%",
        width: "100%",
        overflow: "auto",
        border: "1px solid #000",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${width}, 4rem)`,
          gridTemplateRows: `repeat(${height}, 3rem)`,
        }}
      >
        {tiles}
      </Box>
    </Box>
  );
}
