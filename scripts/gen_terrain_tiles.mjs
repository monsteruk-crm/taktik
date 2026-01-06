import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { PNG } from "pngjs";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "assets", "tiles");
const NETWORK_DIR = path.join(OUT_DIR, "networks");
const TEMP_DIR = path.join(ROOT, "temp");
const TEMP_NETWORK_DIR = path.join(TEMP_DIR, "networks");
const TERRAIN_TOP_DIR = path.join(TEMP_DIR, "terrain-tops");
const SCALE = 1;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writePng(filePath, png) {
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(filePath, buffer);
}

function rasterizeSvgToPng(svgPath, sizePx) {
  const buffer = execFileSync("convert", [
    svgPath,
    "-background",
    "none",
    "-trim",
    "+repage",
    "-resize",
    `${sizePx}x${sizePx}`,
    "-gravity",
    "center",
    "-extent",
    `${sizePx}x${sizePx}`,
    "png:-",
  ]);
  return PNG.sync.read(buffer);
}

function cropTileWithImagemagick(inputPath, outputPath) {
  execFileSync(
    "convert",
    [
      inputPath,
      "-alpha",
      "set",
      "-background",
      "none",
      "-trim",
      "+repage",
      "-gravity",
      "North",
      "-extent",
      "640x396",
      outputPath,
    ],
    { stdio: "inherit" }
  );
}

function setPixel(png, x, y, color) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const idx = (y * png.width + x) * 4;
  png.data[idx] = color[0];
  png.data[idx + 1] = color[1];
  png.data[idx + 2] = color[2];
  png.data[idx + 3] = color[3];
}

function blendPixel(png, x, y, color) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const idx = (y * png.width + x) * 4;
  const srcA = color[3] / 255;
  const dstA = png.data[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) {
    png.data[idx] = 0;
    png.data[idx + 1] = 0;
    png.data[idx + 2] = 0;
    png.data[idx + 3] = 0;
    return;
  }
  const srcR = color[0];
  const srcG = color[1];
  const srcB = color[2];
  const dstR = png.data[idx];
  const dstG = png.data[idx + 1];
  const dstB = png.data[idx + 2];
  png.data[idx] = Math.round((srcR * srcA + dstR * dstA * (1 - srcA)) / outA);
  png.data[idx + 1] = Math.round((srcG * srcA + dstG * dstA * (1 - srcA)) / outA);
  png.data[idx + 2] = Math.round((srcB * srcA + dstB * dstA * (1 - srcA)) / outA);
  png.data[idx + 3] = Math.round(outA * 255);
}

function applyColorKey(texture, colors, tolerance = 4) {
  if (!colors || colors.length === 0) {
    return;
  }
  for (let y = 0; y < texture.height; y += 1) {
    for (let x = 0; x < texture.width; x += 1) {
      const idx = (y * texture.width + x) * 4;
      const alpha = texture.data[idx + 3];
      if (alpha === 0) {
        continue;
      }
      const r = texture.data[idx];
      const g = texture.data[idx + 1];
      const b = texture.data[idx + 2];
      for (const color of colors) {
        if (
          Math.abs(r - color[0]) <= tolerance &&
          Math.abs(g - color[1]) <= tolerance &&
          Math.abs(b - color[2]) <= tolerance
        ) {
          texture.data[idx + 3] = 0;
          break;
        }
      }
    }
  }
}

const EDGE_ORDER = ["N", "E", "S", "W"];

function edgeKey(edges) {
  if (!edges || edges.length === 0) return "NONE";
  const set = new Set(edges);
  return EDGE_ORDER.filter((e) => set.has(e)).join("");
}

function fillPolygon(png, points, color) {
  const ys = points.map((p) => p.y);
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(png.height - 1, Math.ceil(Math.max(...ys)));

  for (let y = minY; y <= maxY; y += 1) {
    const intersections = [];
    for (let i = 0; i < points.length; i += 1) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      if (a.y === b.y) continue;

      const ymin = Math.min(a.y, b.y);
      const ymax = Math.max(a.y, b.y);
      if (y < ymin || y >= ymax) continue;

      const t = (y - a.y) / (b.y - a.y);
      const x = a.x + t * (b.x - a.x);
      intersections.push(x);
    }

    intersections.sort((l, r) => l - r);
    for (let i = 0; i + 1 < intersections.length; i += 2) {
      const x0 = Math.max(0, Math.ceil(intersections[i]));
      const x1 = Math.min(png.width - 1, Math.floor(intersections[i + 1]));
      for (let x = x0; x <= x1; x += 1) {
        setPixel(png, x, y, color);
      }
    }
  }
}

function applyTopFaceMask(png, cx, cy, tileW, tileH) {
  const halfW = tileW / 2;
  const halfH = tileH / 2;

  const minX = Math.floor(cx - halfW);
  const maxX = Math.ceil(cx + halfW);
  const minY = Math.floor(cy - halfH);
  const maxY = Math.ceil(cy + halfH);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      const inside = dx / halfW + dy / halfH <= 1;
      if (!inside) {
        const idx = (y * png.width + x) * 4;
        if (idx >= 0 && idx + 3 < png.data.length) {
          png.data[idx + 3] = 0;
        }
      }
    }
  }
}

function textureOnTopFace(png, texture, top, a, b, tileW, tileH, offset = { s: 0, t: 0 }) {
  const det = a.x * b.y - a.y * b.x;
  if (Math.abs(det) < 1e-6) {
    return;
  }

  const halfW = tileW / 2;
  const halfH = tileH / 2;
  const minX = Math.floor(top.x - halfW);
  const maxX = Math.ceil(top.x + halfW);
  const minY = Math.floor(top.y);
  const maxY = Math.ceil(top.y + tileH);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const vX = x - top.x;
      const vY = y - top.y;
      const s = (vX * b.y - vY * b.x) / det + offset.s;
      const t = (a.x * vY - a.y * vX) / det + offset.t;
      if (s < 0 || s > 1 || t < 0 || t > 1) {
        continue;
      }
      const tx = Math.min(
        texture.width - 1,
        Math.max(0, Math.floor(s * (texture.width - 1)))
      );
      const ty = Math.min(
        texture.height - 1,
        Math.max(0, Math.floor(t * (texture.height - 1)))
      );
      const idx = (ty * texture.width + tx) * 4;
      const alpha = texture.data[idx + 3];
      if (alpha === 0) {
        continue;
      }
      blendPixel(png, x, y, [
        texture.data[idx],
        texture.data[idx + 1],
        texture.data[idx + 2],
        alpha,
      ]);
    }
  }
}

function fillRect(png, x0, y0, x1, y1, color) {
  const minX = Math.max(0, Math.floor(Math.min(x0, x1)));
  const maxX = Math.min(png.width - 1, Math.ceil(Math.max(x0, x1)));
  const minY = Math.max(0, Math.floor(Math.min(y0, y1)));
  const maxY = Math.min(png.height - 1, Math.ceil(Math.max(y0, y1)));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      setPixel(png, x, y, color);
    }
  }
}

function generateNetworkSurface({
  kind,
  edges,
  rectOnTopFace,
  rng,
  widthPx,
  color,
  innerColor,
  tileW,
  png,
}) {
  const c = 0.5;
  const width = widthPx / tileW;
  const half = width / 2;

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function drawRect(s0, s1, t0, t1, fill) {
    const sMin = clamp01(Math.min(s0, s1));
    const sMax = clamp01(Math.max(s0, s1));
    const tMin = clamp01(Math.min(t0, t1));
    const tMax = clamp01(Math.max(t0, t1));
    fillPolygon(png, rectOnTopFace(sMin, sMax, tMin, tMax), fill);
  }

  function drawArm(dir, armHalf, fill, offset = 0) {
    if (dir === "N") {
      drawRect(c - armHalf + offset, c + armHalf + offset, 0, c, fill);
    } else if (dir === "S") {
      drawRect(c - armHalf + offset, c + armHalf + offset, c, 1, fill);
    } else if (dir === "E") {
      drawRect(c, 1, c - armHalf + offset, c + armHalf + offset, fill);
    } else if (dir === "W") {
      drawRect(0, c, c - armHalf + offset, c + armHalf + offset, fill);
    }
  }

  function drawCenter(sizeHalf, fill) {
    drawRect(c - sizeHalf, c + sizeHalf, c - sizeHalf, c + sizeHalf, fill);
  }

  function drawMedianBlocks(fill, count, span, thickness) {
    for (let i = 0; i < count; i += 1) {
      const t = rng.range(0.15, 0.85);
      drawRect(c - thickness, c + thickness, t - span / 2, t + span / 2, fill);
    }
  }

  const edgeSet = new Set(edges);
  const degree = edges.length;
  const isStraight =
    degree === 2 &&
    ((edgeSet.has("N") && edgeSet.has("S")) || (edgeSet.has("E") && edgeSet.has("W")));
  const isCorner = degree === 2 && !isStraight;
  const isTJunction = degree === 3;
  const isCross = degree === 4;

  if (kind === "road") {
    const shoulder = width * rng.range(1.25, 1.4);
    const lane = width * rng.range(0.6, 0.7);
    const offset = width * rng.range(0.14, 0.22);
    const centerHalf = shoulder * 0.6;

    drawCenter(centerHalf, color);

    if (isStraight) {
      for (const dir of edges) {
        drawArm(dir, shoulder / 2, color);
      }

      if (edgeSet.has("N") && edgeSet.has("S")) {
        drawArm("N", lane / 2, innerColor ?? color, -offset);
        drawArm("S", lane / 2, innerColor ?? color, -offset);
        drawArm("N", lane / 2, innerColor ?? color, offset);
        drawArm("S", lane / 2, innerColor ?? color, offset);
        drawMedianBlocks(innerColor ?? color, 2, 0.08, lane / 4);
      } else {
        drawArm("E", lane / 2, innerColor ?? color, -offset);
        drawArm("W", lane / 2, innerColor ?? color, -offset);
        drawArm("E", lane / 2, innerColor ?? color, offset);
        drawArm("W", lane / 2, innerColor ?? color, offset);
        drawMedianBlocks(innerColor ?? color, 2, 0.08, lane / 4);
      }
    } else if (isCorner) {
      for (const dir of edges) {
        drawArm(dir, shoulder / 2, color);
        drawArm(dir, lane / 2, innerColor ?? color, 0);
      }
      drawCenter(shoulder * 0.75, color);
      if (edgeSet.has("N") && edgeSet.has("E")) {
        drawRect(c, c + shoulder, c - shoulder * 0.35, c + shoulder * 0.35, innerColor ?? color);
      } else if (edgeSet.has("E") && edgeSet.has("S")) {
        drawRect(c - shoulder * 0.35, c + shoulder * 0.35, c, c + shoulder, innerColor ?? color);
      } else if (edgeSet.has("S") && edgeSet.has("W")) {
        drawRect(c - shoulder, c, c - shoulder * 0.35, c + shoulder * 0.35, innerColor ?? color);
      } else if (edgeSet.has("W") && edgeSet.has("N")) {
        drawRect(c - shoulder * 0.35, c + shoulder * 0.35, c - shoulder, c, innerColor ?? color);
      }
      const secondary = lane * 0.9;
      if (edgeSet.has("N")) drawArm("N", secondary / 2, innerColor ?? color, -offset / 2);
      if (edgeSet.has("E")) drawArm("E", secondary / 2, innerColor ?? color, offset / 2);
      if (edgeSet.has("S")) drawArm("S", secondary / 2, innerColor ?? color, offset / 2);
      if (edgeSet.has("W")) drawArm("W", secondary / 2, innerColor ?? color, -offset / 2);
    } else if (isTJunction) {
      drawCenter(shoulder * 0.9, color);
      for (const dir of edges) {
        drawArm(dir, shoulder / 2, color);
        drawArm(dir, lane / 2, innerColor ?? color, 0);
      }
      const stubHalf = lane * 0.6;
      drawRect(c - stubHalf, c + stubHalf, c - stubHalf, c + stubHalf, innerColor ?? color);
      if (edgeSet.has("N")) drawRect(c - stubHalf, c + stubHalf, 0.1, 0.2, innerColor ?? color);
      if (edgeSet.has("S")) drawRect(c - stubHalf, c + stubHalf, 0.8, 0.9, innerColor ?? color);
      if (edgeSet.has("E")) drawRect(0.8, 0.9, c - stubHalf, c + stubHalf, innerColor ?? color);
      if (edgeSet.has("W")) drawRect(0.1, 0.2, c - stubHalf, c + stubHalf, innerColor ?? color);
    } else if (isCross) {
      drawCenter(shoulder * 1.05, color);
      for (const dir of edges) {
        drawArm(dir, shoulder / 2, color);
      }
      const quad = lane * 0.55;
      drawRect(c - quad, c, c - quad, c, innerColor ?? color);
      drawRect(c, c + quad, c - quad, c, innerColor ?? color);
      drawRect(c - quad, c, c, c + quad, innerColor ?? color);
      drawRect(c, c + quad, c, c + quad, innerColor ?? color);
      for (const dir of edges) {
        drawArm(dir, lane / 2, innerColor ?? color, 0);
      }
    } else {
      drawCenter(shoulder * 0.7, color);
      for (const dir of edges) {
        drawArm(dir, shoulder / 2, color);
        drawArm(dir, lane / 2, innerColor ?? color, 0);
      }
    }
  } else {
    const channel = width * rng.range(1.3, 1.6);
    const banks = channel * rng.range(1.15, 1.3);
    const inner = channel * rng.range(0.65, 0.8);

    drawCenter(banks * 0.6, color);

    for (const dir of edges) {
      drawArm(dir, banks / 2, color);
      drawArm(dir, inner / 2, innerColor ?? color, 0);
    }

    if (isCorner) {
      drawCenter(banks * 0.85, color);
      if (edgeSet.has("N") && edgeSet.has("E")) {
        drawRect(c, c + banks * 0.75, c - banks * 0.2, c + banks * 0.4, innerColor ?? color);
      } else if (edgeSet.has("E") && edgeSet.has("S")) {
        drawRect(c - banks * 0.2, c + banks * 0.4, c, c + banks * 0.75, innerColor ?? color);
      } else if (edgeSet.has("S") && edgeSet.has("W")) {
        drawRect(c - banks * 0.75, c, c - banks * 0.2, c + banks * 0.4, innerColor ?? color);
      } else if (edgeSet.has("W") && edgeSet.has("N")) {
        drawRect(c - banks * 0.2, c + banks * 0.4, c - banks * 0.75, c, innerColor ?? color);
      }
    } else if (isTJunction) {
      drawCenter(banks * 1.0, color);
      if (edgeSet.has("N") && edgeSet.has("E") && edgeSet.has("W")) {
        drawArm("S", banks * 0.65, color, rng.range(-0.05, 0.05));
      } else if (edgeSet.has("S") && edgeSet.has("E") && edgeSet.has("W")) {
        drawArm("N", banks * 0.65, color, rng.range(-0.05, 0.05));
      } else if (edgeSet.has("N") && edgeSet.has("S") && edgeSet.has("E")) {
        drawArm("W", banks * 0.65, color, rng.range(-0.05, 0.05));
      } else if (edgeSet.has("N") && edgeSet.has("S") && edgeSet.has("W")) {
        drawArm("E", banks * 0.65, color, rng.range(-0.05, 0.05));
      }
    } else if (isCross) {
      drawCenter(banks * 1.1, color);
      drawCenter(inner * 0.7, innerColor ?? color);
    } else if (isStraight) {
      const offset = width * rng.range(0.08, 0.16);
      if (edgeSet.has("N") && edgeSet.has("S")) {
        drawArm("N", banks / 2, color, -offset);
        drawArm("S", banks / 2, color, -offset);
        drawArm("N", inner / 2, innerColor ?? color, offset);
        drawArm("S", inner / 2, innerColor ?? color, offset);
      } else {
        drawArm("E", banks / 2, color, -offset);
        drawArm("W", banks / 2, color, -offset);
        drawArm("E", inner / 2, innerColor ?? color, offset);
        drawArm("W", inner / 2, innerColor ?? color, offset);
      }
    }

    if (rng.float() < 0.35) {
      const voidHalf = inner * rng.range(0.15, 0.25);
      drawRect(c - voidHalf, c + voidHalf, c - voidHalf, c + voidHalf, [0, 0, 0, 0]);
    }
  }
}

function makeNetworkOverlayTopFace({ edges, kind, widthPx, color, innerColor }) {
  const size = 1024 * SCALE;
  const png = new PNG({ width: size, height: size });
  png.data.fill(0);

  const cx = size / 2;
  const cy = 430 * SCALE;

  const tileW = 640 * SCALE;
  const tileH = 320 * SCALE;

  const top = { x: cx, y: cy - tileH / 2 };
  const right = { x: cx + tileW / 2, y: cy };
  const left = { x: cx - tileW / 2, y: cy };
  const a = { x: right.x - top.x, y: right.y - top.y };
  const b = { x: left.x - top.x, y: left.y - top.y };

  function rectOnTopFace(s0, s1, t0, t1) {
    return [
      { x: top.x + a.x * s0 + b.x * t0, y: top.y + a.y * s0 + b.y * t0 },
      { x: top.x + a.x * s1 + b.x * t0, y: top.y + a.y * s1 + b.y * t0 },
      { x: top.x + a.x * s1 + b.x * t1, y: top.y + a.y * s1 + b.y * t1 },
      { x: top.x + a.x * s0 + b.x * t1, y: top.y + a.y * s0 + b.y * t1 },
    ];
  }

  const slabAlpha = Math.round(255 * 0.05);
  const slabFill = [color[0], color[1], color[2], slabAlpha];
  fillPolygon(png, rectOnTopFace(0, 1, 0, 1), slabFill);

  const rngSeed =
    0x524f4144 ^
    edges.length ^
    edges.reduce((sum, edge) => sum + edge.charCodeAt(0), 0);
  const rng = makeRng(rngSeed);

  generateNetworkSurface({
    kind,
    edges,
    rectOnTopFace,
    rng,
    widthPx,
    color,
    innerColor,
    tileW,
    png,
  });

  applyTopFaceMask(png, cx, cy, tileW, tileH);

  return png;
}

function makeBridgeOverlayTopFace({ widthPx, color }) {
  const size = 1024 * SCALE;
  const png = new PNG({ width: size, height: size });
  png.data.fill(0);

  const cx = size / 2;
  const cy = 430 * SCALE;

  const tileW = 640 * SCALE;
  const tileH = 320 * SCALE;

  const top = { x: cx, y: cy - tileH / 2 };
  const right = { x: cx + tileW / 2, y: cy };
  const left = { x: cx - tileW / 2, y: cy };
  const a = { x: right.x - top.x, y: right.y - top.y };
  const b = { x: left.x - top.x, y: left.y - top.y };

  function rectOnTopFace(s0, s1, t0, t1) {
    return [
      { x: top.x + a.x * s0 + b.x * t0, y: top.y + a.y * s0 + b.y * t0 },
      { x: top.x + a.x * s1 + b.x * t0, y: top.y + a.y * s1 + b.y * t0 },
      { x: top.x + a.x * s1 + b.x * t1, y: top.y + a.y * s1 + b.y * t1 },
      { x: top.x + a.x * s0 + b.x * t1, y: top.y + a.y * s0 + b.y * t1 },
    ];
  }

  const slabAlpha = Math.round(255 * 0.05);
  const slabFill = [color[0], color[1], color[2], slabAlpha];
  fillPolygon(png, rectOnTopFace(0, 1, 0, 1), slabFill);

  const c = 0.5;
  const half = (widthPx / tileW) * 1.6;
  const square = rectOnTopFace(c - half, c + half, c - half, c + half);
  fillPolygon(png, square, color);

  applyTopFaceMask(png, cx, cy, tileW, tileH);

  return png;
}

function makeTileFromTopSvg(svgName, options = {}) {
  const size = 1024 * SCALE;
  const png = new PNG({ width: size, height: size });
  png.data.fill(0);

  const cx = size / 2;
  const cy = 430 * SCALE;

  const tileW = 640 * SCALE;
  const tileH = 320 * SCALE;
  const thickness = Math.round(tileW * 0.12);

  const top = { x: cx, y: cy - tileH / 2 };
  const right = { x: cx + tileW / 2, y: cy };
  const bottom = { x: cx, y: cy + tileH / 2 };
  const left = { x: cx - tileW / 2, y: cy };

  const down = { x: 0, y: thickness };
  const right2 = { x: right.x + down.x, y: right.y + down.y };
  const bottom2 = { x: bottom.x + down.x, y: bottom.y + down.y };
  const left2 = { x: left.x + down.x, y: left.y + down.y };

  const topFill = [232, 232, 228, 255];
  const sideFillRight = [210, 210, 206, 255];
  const sideFillLeft = [204, 204, 200, 255];

  // Draw side faces first so the top face cleanly overwrites shared edges.
  fillPolygon(png, [right, bottom, bottom2, right2], sideFillRight);
  fillPolygon(png, [bottom, left, left2, bottom2], sideFillLeft);
  fillPolygon(png, [top, right, bottom, left], topFill);

  const a = { x: right.x - top.x, y: right.y - top.y };
  const b = { x: left.x - top.x, y: left.y - top.y };
  const svgPath = path.join(TERRAIN_TOP_DIR, svgName);
  const texture = rasterizeSvgToPng(svgPath, 1024 * SCALE);
  if (options.maskColors) {
    applyColorKey(texture, options.maskColors, options.tolerance ?? 4);
  }
  textureOnTopFace(
    png,
    texture,
    top,
    a,
    b,
    tileW,
    tileH,
    options.sampleOffset ?? { s: 0, t: 0 }
  );

  return png;
}
//terrain-01-plain
function makeTilePlain1024() {
  return makeTileFromTopSvg("terrain-01-plain.svg");
}

function makeRng(seed) {
  let state = seed >>> 0;
  return {
    next() {
      // LCG (Numerical Recipes) — deterministic and fast.
      state = (1664525 * state + 1013904223) >>> 0;
      return state;
    },
    float() {
      return this.next() / 0xffffffff;
    },
    range(min, max) {
      return min + (max - min) * this.float();
    },
    int(min, maxInclusive) {
      return Math.floor(this.range(min, maxInclusive + 1));
    },
    pick(arr) {
      return arr[this.int(0, arr.length - 1)];
    },
  };
}
// terrain-02-rough
function makeTileRough1024() {
  return makeTileFromTopSvg("terrain-02-rough.svg");
}

// terrain-03-forest
function makeTileForest1024() {
  return makeTileFromTopSvg("terrain-03-forest.svg");
}

// terrain-04-urban
function makeTileUrban1024() {
  return makeTileFromTopSvg("base_04-urban.svg", {
    maskColors: [[210, 210, 203]],
    tolerance: 6,
    sampleOffset: { s: 0.012, t: 0.012 },
  });
}

// terrain-05-hill
function makeTileHill1024() {
  return makeTileFromTopSvg("terrain-05-hill.svg");
}

// terrain-06-water
function makeTileWater1024() {
  return makeTileFromTopSvg("terrain-06-water.svg");
}

// terrain-10-industrial
function makeTileIndustrial1024() {
  return makeTileFromTopSvg("base_10-industrial.svg");
}

// main ground tile
function makeMainGroundTile() {
  const size = 1024 * SCALE;
  const png = new PNG({ width: size, height: size });
  png.data.fill(0);

  const cx = size / 2;
  const cy = 430 * SCALE;

  const tileW = 640 * SCALE;
  const tileH = 320 * SCALE;
  const thickness = Math.round(tileW * 0.12);

  const top = { x: cx, y: cy - tileH / 2 };
  const right = { x: cx + tileW / 2, y: cy };
  const bottom = { x: cx, y: cy + tileH / 2 };
  const left = { x: cx - tileW / 2, y: cy };

  const down = { x: 0, y: thickness };
  const right2 = { x: right.x + down.x, y: right.y + down.y };
  const bottom2 = { x: bottom.x + down.x, y: bottom.y + down.y };
  const left2 = { x: left.x + down.x, y: left.y + down.y };

  // TERRAIN: FLAT GROUND — top face completely empty, neutral slab tones.
  const topFill = [232, 232, 228, 255];
  const sideFillRight = [210, 210, 206, 255];
  const sideFillLeft = [204, 204, 200, 255];

  fillPolygon(png, [right, bottom, bottom2, right2], sideFillRight);
  fillPolygon(png, [bottom, left, left2, bottom2], sideFillLeft);
  fillPolygon(png, [top, right, bottom, left], topFill);

  return png;
}

function makeMainHighlightTile() {
  const size = 1024 * SCALE;
  const png = new PNG({ width: size, height: size });
  png.data.fill(0);

  const cx = size / 2;
  const cy = 430 * SCALE;

  const tileW = 640 * SCALE;
  const tileH = 320 * SCALE;

  const top = { x: cx, y: cy - tileH / 2 };
  const right = { x: cx + tileW / 2, y: cy };
  const bottom = { x: cx, y: cy + tileH / 2 };
  const left = { x: cx - tileW / 2, y: cy };

  // TILE HILIGHT: affects ONLY the top face; flat, desaturated cyan; no gradients/glow.
  const hiFill = [86, 165, 176, 170]; // pale blue-green, medium-light, low saturation
  const border = [86, 165, 176, 220];

  fillPolygon(png, [top, right, bottom, left], hiFill);

  // Optional thin inset border on top face only (hard-edged).
  const inset = 0.10;
  const pTop = { x: top.x + (right.x - top.x) * inset, y: top.y + (right.y - top.y) * inset };
  const pRight = {
    x: right.x + (bottom.x - right.x) * inset,
    y: right.y + (bottom.y - right.y) * inset,
  };
  const pBottom = {
    x: bottom.x + (left.x - bottom.x) * inset,
    y: bottom.y + (left.y - bottom.y) * inset,
  };
  const pLeft = { x: left.x + (top.x - left.x) * inset, y: left.y + (top.y - left.y) * inset };
  fillPolygon(png, [pTop, pRight, pBottom, pLeft], border);

  // Punch out the center so the border reads as an inset line, not a second fill layer.
  const inset2 = inset + 0.03;
  const iTop = { x: top.x + (right.x - top.x) * inset2, y: top.y + (right.y - top.y) * inset2 };
  const iRight = {
    x: right.x + (bottom.x - right.x) * inset2,
    y: right.y + (bottom.y - right.y) * inset2,
  };
  const iBottom = {
    x: bottom.x + (left.x - bottom.x) * inset2,
    y: bottom.y + (left.y - bottom.y) * inset2,
  };
  const iLeft = { x: left.x + (top.x - left.x) * inset2, y: left.y + (top.y - left.y) * inset2 };

  // Fill the inner region back with the base highlight fill.
  fillPolygon(png, [iTop, iRight, iBottom, iLeft], hiFill);

  return png;
}

function makeHighlightTileTopFace({ fill, border, banding, segmentation }) {
  const size = 1024 * SCALE;
  const png = new PNG({ width: size, height: size });
  png.data.fill(0);

  const cx = size / 2;
  const cy = 430 * SCALE;

  const tileW = 640 * SCALE;
  const tileH = 320 * SCALE;

  const top = { x: cx, y: cy - tileH / 2 };
  const right = { x: cx + tileW / 2, y: cy };
  const bottom = { x: cx, y: cy + tileH / 2 };
  const left = { x: cx - tileW / 2, y: cy };

  if (segmentation === "diagonal-split") {
    const leftTint = fill;
    const rightTint = [fill[0], fill[1], fill[2], Math.min(255, fill[3] + 24)];
    fillPolygon(png, [top, right, bottom], rightTint);
    fillPolygon(png, [top, bottom, left], leftTint);
  } else if (segmentation === "radial-4") {
    const tintA = fill;
    const tintB = [fill[0], fill[1], fill[2], Math.min(255, fill[3] + 18)];
    fillPolygon(png, [top, right, { x: cx, y: cy }], tintB);
    fillPolygon(png, [right, bottom, { x: cx, y: cy }], tintA);
    fillPolygon(png, [bottom, left, { x: cx, y: cy }], tintB);
    fillPolygon(png, [left, top, { x: cx, y: cy }], tintA);
  } else {
    fillPolygon(png, [top, right, bottom, left], fill);
  }

  if (banding === "subtle") {
    // Thin, hard-edged bands aligned to the isometric axes (no arrows, no gradients).
    const a = { x: right.x - top.x, y: right.y - top.y };
    const b = { x: left.x - top.x, y: left.y - top.y };
    const bandFill = [fill[0], fill[1], fill[2], Math.min(255, fill[3] + 22)];
    const bands = [
      { t0: 0.34, t1: 0.36 },
      { t0: 0.49, t1: 0.51 },
      { t0: 0.64, t1: 0.66 },
    ];
    for (const band of bands) {
      const poly = [
        { x: top.x + a.x * 0.08 + b.x * band.t0, y: top.y + a.y * 0.08 + b.y * band.t0 },
        { x: top.x + a.x * 0.92 + b.x * band.t0, y: top.y + a.y * 0.92 + b.y * band.t0 },
        { x: top.x + a.x * 0.92 + b.x * band.t1, y: top.y + a.y * 0.92 + b.y * band.t1 },
        { x: top.x + a.x * 0.08 + b.x * band.t1, y: top.y + a.y * 0.08 + b.y * band.t1 },
      ];
      fillPolygon(png, poly, bandFill);
    }
  }

  if (border) {
    // Inset border plate (top-face only).
    const inset = 0.10;
    const pTop = { x: top.x + (right.x - top.x) * inset, y: top.y + (right.y - top.y) * inset };
    const pRight = {
      x: right.x + (bottom.x - right.x) * inset,
      y: right.y + (bottom.y - right.y) * inset,
    };
    const pBottom = {
      x: bottom.x + (left.x - bottom.x) * inset,
      y: bottom.y + (left.y - bottom.y) * inset,
    };
    const pLeft = { x: left.x + (top.x - left.x) * inset, y: left.y + (top.y - left.y) * inset };
    fillPolygon(png, [pTop, pRight, pBottom, pLeft], border);

    const inset2 = inset + 0.03;
    const iTop = {
      x: top.x + (right.x - top.x) * inset2,
      y: top.y + (right.y - top.y) * inset2,
    };
    const iRight = {
      x: right.x + (bottom.x - right.x) * inset2,
      y: right.y + (bottom.y - right.y) * inset2,
    };
    const iBottom = {
      x: bottom.x + (left.x - bottom.x) * inset2,
      y: bottom.y + (left.y - bottom.y) * inset2,
    };
    const iLeft = {
      x: left.x + (top.x - left.x) * inset2,
      y: left.y + (top.y - left.y) * inset2,
    };
    fillPolygon(png, [iTop, iRight, iBottom, iLeft], fill);
  }

  return png;
}

ensureDir(OUT_DIR);
ensureDir(NETWORK_DIR);
ensureDir(TEMP_DIR);
ensureDir(TEMP_NETWORK_DIR);
const generatedFiles = [];

const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
const onlyList = onlyArg ? onlyArg.slice("--only=".length).split(",") : null;
const only = onlyList ? new Set(onlyList.filter(Boolean)) : null;

function allowOnly(...ids) {
  if (!only) return true;
  return ids.some((id) => only.has(id));
}

if (allowOnly("terrain-01-plain", "terrain-01-plain.png")) {
  const plain = makeTilePlain1024();
  generatedFiles.push("terrain-01-plain.png");
  writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), plain);
}

if (allowOnly("terrain-02-rough", "terrain-02-rough.png")) {
  const rough = makeTileRough1024();
  generatedFiles.push("terrain-02-rough.png");
  writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), rough);
}

if (allowOnly("terrain-03-forest", "terrain-03-forest.png")) {
  const forest = makeTileForest1024();
  generatedFiles.push("terrain-03-forest.png");
  writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), forest);
}

if (allowOnly("terrain-04-urban", "terrain-04-urban.png")) {
  const urban = makeTileUrban1024();
  generatedFiles.push("terrain-04-urban.png");
  writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), urban);
}

if (allowOnly("terrain-05-hill", "terrain-05-hill.png")) {
  const hill = makeTileHill1024();
  generatedFiles.push("terrain-05-hill.png");
  writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), hill);
}

if (allowOnly("terrain-06-water", "terrain-06-water.png")) {
  const water = makeTileWater1024();
  generatedFiles.push("terrain-06-water.png");
  writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), water);
}

if (allowOnly("terrain-10-industrial", "terrain-10-industrial.png")) {
  const industrial = makeTileIndustrial1024();
  generatedFiles.push("terrain-10-industrial.png");
  writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), industrial);
}

// Main in-game tiles (overwrites legacy placeholders).
if (allowOnly("ground", "ground.png")) {
  const groundMain = makeMainGroundTile();
  generatedFiles.push("ground.png");
  writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), groundMain);
}

if (allowOnly("highlight_move", "highlight_move.png")) {
  const highlightMain = makeMainHighlightTile();
  generatedFiles.push("highlight_move.png");
  writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), highlightMain);
}

// Advanced overlays (not wired into runtime yet).
if (allowOnly("highlight_attack", "highlight_attack.png")) {
  const attackHighlight = makeHighlightTileTopFace({
    fill: [126, 58, 47, 190], // muted rust red
    border: [126, 58, 47, 230],
    segmentation: "radial-4",
  });
  generatedFiles.push("highlight_attack.png");
  writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), attackHighlight);
}

if (allowOnly("highlight_move_adv", "highlight_move_adv.png")) {
  const moveHighlightAdvanced = makeHighlightTileTopFace({
    fill: [66, 135, 168, 190], // desaturated cold blue
    border: [66, 135, 168, 230],
    banding: "subtle",
  });
  generatedFiles.push("highlight_move_adv.png");
  writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), moveHighlightAdvanced);
}

if (allowOnly("highlight_target_confirm", "highlight_target_confirm.png")) {
  const targetConfirmHighlight = makeHighlightTileTopFace({
    fill: [164, 154, 96, 200], // pale khaki
    border: [164, 154, 96, 235],
    segmentation: "diagonal-split",
  });
  generatedFiles.push("highlight_target_confirm.png");
  writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), targetConfirmHighlight);
}

const NETWORKS = [
  {
    id: "road",
    kind: "stroke",
    widthPx: Math.round(640 * SCALE * 0.045),
    color: [70, 70, 66, 210],
    innerColor: [92, 92, 88, 210],
  },
  {
    id: "river",
    kind: "channel",
    widthPx: Math.round(640 * SCALE * 0.060),
    color: [58, 142, 170, 205],
    innerColor: [86, 176, 204, 210],
  },
];

const EDGE_SUBSETS = [];
for (let mask = 1; mask < 16; mask += 1) {
  const edges = [];
  if (mask & 1) edges.push("N");
  if (mask & 2) edges.push("E");
  if (mask & 4) edges.push("S");
  if (mask & 8) edges.push("W");
  EDGE_SUBSETS.push(edges);
}

const networkManifest = {};

for (const net of NETWORKS) {
  if (!allowOnly(net.id)) {
    const specific = EDGE_SUBSETS.some((edges) =>
      allowOnly(`${net.id}_${edgeKey(edges)}`, `${net.id}_${edgeKey(edges)}.png`)
    );
    if (!specific) continue;
  }
  const variants = [];
  for (const edges of EDGE_SUBSETS) {
    const key = edgeKey(edges);
    if (!allowOnly(net.id, `${net.id}_${key}`, `${net.id}_${key}.png`)) continue;
    const png = makeNetworkOverlayTopFace({
      edges,
      kind: net.kind,
      widthPx: net.widthPx,
      color: net.color,
      innerColor: net.innerColor,
    });
    const filename = `${net.id}_${key}.png`;
    variants.push(key);
    writePng(path.join(TEMP_NETWORK_DIR, filename), png);
  }
  if (variants.length) {
    networkManifest[net.id] = variants;
  }
}

if (allowOnly("bridge_square", "bridge_square.png", "bridge")) {
  const bridgeSquare = makeBridgeOverlayTopFace({
    widthPx: Math.round(640 * SCALE * 0.05),
    color: [139, 90, 43, 220],
  });
  const filename = "bridge_square.png";
  writePng(path.join(TEMP_NETWORK_DIR, filename), bridgeSquare);
  networkManifest.bridge = ["square"];
}

for (const fileName of generatedFiles) {
  cropTileWithImagemagick(
    path.join(TEMP_DIR, fileName),
    path.join(OUT_DIR, fileName)
  );
}

for (const [netId, variants] of Object.entries(networkManifest)) {
  for (const key of variants) {
    const filename = netId === "bridge" ? "bridge_square.png" : `${netId}_${key}.png`;
    cropTileWithImagemagick(
      path.join(TEMP_NETWORK_DIR, filename),
      path.join(NETWORK_DIR, filename)
    );
  }
}

fs.writeFileSync(
  path.join(NETWORK_DIR, "manifest.json"),
  JSON.stringify(networkManifest, null, 2)
);

console.log(
  "Generated terrain tiles: terrain-01-plain.png, terrain-02-rough.png, terrain-03-forest.png, terrain-04-urban.png, terrain-05-hill.png, terrain-06-water.png, terrain-10-industrial.png, ground.png, highlight_move.png, highlight_attack.png, highlight_move_adv.png, highlight_target_confirm.png",
);
console.log("Generated network overlays:", NETWORKS.map((n) => n.id).join(", "));
console.log("Cropped tiles with ImageMagick: convert ... -gravity North -extent 1918x1190");
