export const TILE_LAYOUT = {
  width: 640/5,
  height: 396/5,
  originYOffset: 0,
  rowOverlap: 7.5,
} as const;
//128:640=x:396
export const TILE_W = TILE_LAYOUT.width;
export const TILE_H = TILE_LAYOUT.height;

export function getBoardOrigin(width: number, height: number) {
  return {
    originX: (height - 1) * (TILE_W / 2),
    originY: TILE_LAYOUT.originYOffset,
  };
}

export function getBoardPixelSize(width: number, height: number) {
  const stepY = TILE_H / 2 - TILE_LAYOUT.rowOverlap;
  return {
    boardPixelWidth: (width + height) * (TILE_W / 2),
    boardPixelHeight: (width + height) * stepY,
  };
}

export function gridToScreen(pos: { x: number; y: number }) {
  const stepY = TILE_H / 2 - TILE_LAYOUT.rowOverlap;
  return {
    sx: (pos.x - pos.y) * (TILE_W / 2),
    sy: (pos.x + pos.y) * stepY,
  };
}

export function screenToGrid(sx: number, sy: number) {
  const fx = sx / (TILE_W / 2);
  const fy = sy / (TILE_H / 2 - TILE_LAYOUT.rowOverlap);
  const x = (fy + fx) / 2;
  const y = (fy - fx) / 2;
  return { x: Math.round(x), y: Math.round(y) };
}
