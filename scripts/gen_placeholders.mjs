import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const ROOT = process.cwd();
const TILE_W = 128;
const TILE_H = 64;
const UNIT_SIZE = 64;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writePng(filePath, png) {
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(filePath, buffer);
}

function createDiamondTile({ fill, stroke }) {
  const png = new PNG({ width: TILE_W, height: TILE_H });
  const cx = TILE_W / 2;
  const cy = TILE_H / 2;
  for (let y = 0; y < TILE_H; y += 1) {
    for (let x = 0; x < TILE_W; x += 1) {
      const dx = Math.abs(x - cx) / (TILE_W / 2);
      const dy = Math.abs(y - cy) / (TILE_H / 2);
      const inside = dx + dy <= 1;
      const idx = (y * TILE_W + x) * 4;
      if (!inside) {
        png.data[idx + 3] = 0;
        continue;
      }
      const nearEdge = dx + dy > 0.96;
      const color = nearEdge ? stroke : fill;
      png.data[idx] = color[0];
      png.data[idx + 1] = color[1];
      png.data[idx + 2] = color[2];
      png.data[idx + 3] = color[3];
    }
  }
  return png;
}

function createHighlightTile() {
  const png = new PNG({ width: TILE_W, height: TILE_H });
  const cx = TILE_W / 2;
  const cy = TILE_H / 2;
  for (let y = 0; y < TILE_H; y += 1) {
    for (let x = 0; x < TILE_W; x += 1) {
      const dx = Math.abs(x - cx) / (TILE_W / 2);
      const dy = Math.abs(y - cy) / (TILE_H / 2);
      const dist = dx + dy;
      const inside = dist <= 1;
      const idx = (y * TILE_W + x) * 4;
      if (!inside) {
        png.data[idx + 3] = 0;
        continue;
      }
      const alpha = Math.max(0, Math.min(180, Math.round((1 - dist) * 180)));
      png.data[idx] = 34;
      png.data[idx + 1] = 211;
      png.data[idx + 2] = 238;
      png.data[idx + 3] = alpha;
    }
  }
  return png;
}

function createUnitIcon({ fill, stroke, shape }) {
  const png = new PNG({ width: UNIT_SIZE, height: UNIT_SIZE });
  const cx = UNIT_SIZE / 2;
  const cy = UNIT_SIZE / 2;
  const radius = UNIT_SIZE * 0.32;

  for (let y = 0; y < UNIT_SIZE; y += 1) {
    for (let x = 0; x < UNIT_SIZE; x += 1) {
      const idx = (y * UNIT_SIZE + x) * 4;
      let inside = false;
      if (shape === "circle") {
        const dx = x - cx;
        const dy = y - cy;
        inside = dx * dx + dy * dy <= radius * radius;
      } else if (shape === "square") {
        inside = Math.abs(x - cx) <= radius && Math.abs(y - cy) <= radius;
      } else {
        const dx = Math.abs(x - cx);
        const dy = y - (cy - radius);
        inside = dy >= 0 && dy <= radius * 2 && dx <= (radius - dy / 2);
      }

      if (!inside) {
        png.data[idx + 3] = 0;
        continue;
      }

      const edge =
        x === Math.round(cx - radius) ||
        x === Math.round(cx + radius) ||
        y === Math.round(cy - radius) ||
        y === Math.round(cy + radius);
      const color = edge ? stroke : fill;
      png.data[idx] = color[0];
      png.data[idx + 1] = color[1];
      png.data[idx + 2] = color[2];
      png.data[idx + 3] = color[3];
    }
  }

  return png;
}

const tileDir = path.join(ROOT, "public", "assets", "tiles");
const unitDir = path.join(ROOT, "public", "assets", "units");

ensureDir(tileDir);
ensureDir(unitDir);

const ground = createDiamondTile({
  fill: [120, 170, 120, 255],
  stroke: [60, 100, 60, 255],
});
writePng(path.join(tileDir, "ground.png"), ground);

const highlight = createHighlightTile();
writePng(path.join(tileDir, "highlight_move.png"), highlight);

const infantry = createUnitIcon({
  fill: [59, 130, 246, 255],
  stroke: [37, 99, 235, 255],
  shape: "circle",
});
writePng(path.join(unitDir, "infantry.png"), infantry);

const mech = createUnitIcon({
  fill: [107, 114, 128, 255],
  stroke: [75, 85, 99, 255],
  shape: "square",
});
writePng(path.join(unitDir, "mech.png"), mech);

const special = createUnitIcon({
  fill: [249, 115, 22, 255],
  stroke: [234, 88, 12, 255],
  shape: "triangle",
});
writePng(path.join(unitDir, "special.png"), special);

console.log("Generated placeholder isometric assets.");
