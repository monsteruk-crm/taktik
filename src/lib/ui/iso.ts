export const TILE_W = 128;
export const TILE_H = 64;

export function getBoardOrigin(width: number, height: number) {
  return {
    originX: (height - 1) * (TILE_W / 2),
    originY: 0,
  };
}

export function getBoardPixelSize(width: number, height: number) {
  return {
    boardPixelWidth: (width + height) * (TILE_W / 2),
    boardPixelHeight: (width + height) * (TILE_H / 2),
  };
}

export function gridToScreen(pos: { x: number; y: number }) {
  return {
    sx: (pos.x - pos.y) * (TILE_W / 2),
    sy: (pos.x + pos.y) * (TILE_H / 2),
  };
}

export function screenToGrid(sx: number, sy: number) {
  const fx = sx / (TILE_W / 2);
  const fy = sy / (TILE_H / 2);
  const x = (fy + fx) / 2;
  const y = (fy - fx) / 2;
  return { x: Math.round(x), y: Math.round(y) };
}
