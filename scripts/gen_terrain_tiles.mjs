import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { PNG } from "pngjs";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "assets", "tiles");
const NETWORK_DIR = path.join(OUT_DIR, "networks");
const TEMP_DIR = path.join(ROOT, "temp");
const TEMP_NETWORK_DIR = path.join(TEMP_DIR, "networks");
const SCALE = 3;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writePng(filePath, png) {
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(filePath, buffer);
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
      "1918x1190",
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
//terrain-01-plain
function makeTilePlain1024() {
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
  const insetFill = [206, 206, 202, 255];

  // Draw side faces first so the top face cleanly overwrites shared edges.
  fillPolygon(png, [right, bottom, bottom2, right2], sideFillRight);
  fillPolygon(png, [bottom, left, left2, bottom2], sideFillLeft);
  fillPolygon(png, [top, right, bottom, left], topFill);

  // PLAIN markings: 2–4 thin insets / micro-blocks aligned to the isometric axes.
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

  fillPolygon(png, rectOnTopFace(0.12, 0.20, 0.08, 0.12), insetFill);
  fillPolygon(png, rectOnTopFace(0.76, 0.88, 0.12, 0.16), insetFill);
  fillPolygon(png, rectOnTopFace(0.46, 0.54, 0.80, 0.83), insetFill);

  return png;
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
  const fragA = [214, 214, 210, 255];
  const fragB = [206, 206, 202, 255];
  const fragC = [220, 220, 216, 255];

  fillPolygon(png, [right, bottom, bottom2, right2], sideFillRight);
  fillPolygon(png, [bottom, left, left2, bottom2], sideFillLeft);
  fillPolygon(png, [top, right, bottom, left], topFill);

  // ROUGH pattern: broken rectangular fragments + offsets + gaps.
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

  const rng = makeRng(0x54414b54); // "TAKT"
  const palette = [fragA, fragB, fragC];

  // Base fragments: medium rectangles with occasional micro-splits.
  const fragmentCount = 26;
  for (let i = 0; i < fragmentCount; i += 1) {
    const w = rng.range(0.05, 0.14);
    const h = rng.range(0.03, 0.10);
    let s0 = rng.range(0.06, 0.92 - w);
    let t0 = rng.range(0.06, 0.92 - h);

    // Offset/misalignment: nudge along the isometric axes.
    if (rng.float() < 0.55) s0 += rng.pick([-0.012, -0.008, 0.008, 0.012]);
    if (rng.float() < 0.55) t0 += rng.pick([-0.012, -0.008, 0.008, 0.012]);

    s0 = Math.max(0.03, Math.min(0.95 - w, s0));
    t0 = Math.max(0.03, Math.min(0.95 - h, t0));

    const s1 = s0 + w;
    const t1 = t0 + h;
    fillPolygon(png, rectOnTopFace(s0, s1, t0, t1), rng.pick(palette));

    // Occasional split to imply breaks without “debris”.
    if (rng.float() < 0.25) {
      const gap = rng.range(0.006, 0.014);
      const split = rng.range(0.35, 0.65);
      const sMid = s0 + w * split;
      const leftW = Math.max(0.012, sMid - s0 - gap / 2);
      const rightW = Math.max(0.012, s1 - sMid - gap / 2);
      const sL1 = s0 + leftW;
      const sR0 = s1 - rightW;
      fillPolygon(png, rectOnTopFace(s0, sL1, t0, t1), rng.pick(palette));
      fillPolygon(png, rectOnTopFace(sR0, s1, t0, t1), rng.pick(palette));
    }
  }

  // A few “gaps” by leaving thin void lanes: paint over with transparent by not drawing;
  // instead, add sparse clear lanes via long thin fragments that align but skip sections.
  for (let i = 0; i < 3; i += 1) {
    const laneT = rng.range(0.18, 0.78);
    const laneH = rng.range(0.014, 0.022);
    const segmentCount = rng.int(2, 4);
    let cursor = 0.08;
    for (let j = 0; j < segmentCount; j += 1) {
      const segW = rng.range(0.12, 0.22);
      const gapW = rng.range(0.04, 0.10);
      const s0 = Math.min(0.90, cursor + rng.pick([-0.01, 0, 0.01]));
      const s1 = Math.min(0.92, s0 + segW);
      fillPolygon(png, rectOnTopFace(s0, s1, laneT, laneT + laneH), rng.pick(palette));
      cursor = s1 + gapW;
    }
  }

  return png;
}
// terrain-03-forest
function makeTileForest1024() {
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
  // Forest should read as "vegetation mass" in a diagrammatic, hard-edged way.
  // Keep it restrained: desaturated field-green plates over the concrete slab.
  const canopyLight = [220, 228, 220, 255];
  const canopyMid = [178, 200, 178, 255];
  const canopyDark = [126, 160, 128, 255];
  const trunkDark = [92, 128, 96, 255];

  fillPolygon(png, [right, bottom, bottom2, right2], sideFillRight);
  fillPolygon(png, [bottom, left, left2, bottom2], sideFillLeft);
  fillPolygon(png, [top, right, bottom, left], topFill);

  // FOREST: clustered canopy plates + sparse trunk marks + a few clearings.
  // No curves, no gradients, no noise — just orthogonal plates on the top face.
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

  const rng = makeRng(0x464f5245); // "FORE"

  const margin = 0.06;
  const span = 0.88;
  const cols = 18;
  const rows = 12;
  const cellW = span / cols;
  const cellH = span / rows;
  const occupancy = Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));

  function markCanopyCluster({ cxCell, cyCell, rx, ry }) {
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const dx = (x - cxCell) / rx;
        const dy = (y - cyCell) / ry;
        const d = Math.abs(dx) + Math.abs(dy); // diamond metric for hard-edged clusters
        if (d > 1.02) continue;

        // Break the perimeter slightly so clusters don't read as a perfect stamp.
        if (d > 0.82 && rng.float() < 0.35) continue;
        occupancy[y][x] = true;
      }
    }
  }

  // 4–6 canopy clusters that read as "forest patches" at zoom.
  const clusterCount = rng.int(4, 6);
  for (let i = 0; i < clusterCount; i += 1) {
    markCanopyCluster({
      cxCell: rng.int(3, cols - 4),
      cyCell: rng.int(2, rows - 3),
      rx: rng.range(2.6, 4.6),
      ry: rng.range(2.2, 4.0),
    });
  }

  function areaFillRatio(x0, x1, y0, y1) {
    const xs = Math.max(0, Math.floor(x0));
    const xe = Math.min(cols - 1, Math.ceil(x1));
    const ys = Math.max(0, Math.floor(y0));
    const ye = Math.min(rows - 1, Math.ceil(y1));
    let filled = 0;
    let total = 0;
    for (let y = ys; y <= ye; y += 1) {
      for (let x = xs; x <= xe; x += 1) {
        total += 1;
        if (occupancy[y][x]) filled += 1;
      }
    }
    return total ? filled / total : 0;
  }

  // Ensure the canopy reaches all edges. The NE edge is easy to under-fill when
  // clusters land mostly center/left; add a deterministic corrective cluster if needed.
  const neRatio = areaFillRatio(cols - 6, cols - 1, 0, 3);
  if (neRatio < 0.18) {
    markCanopyCluster({ cxCell: cols - 3, cyCell: 2, rx: 3.6, ry: 2.8 });
  }

  // Paint canopy plates (blocky, restrained palette).
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (!occupancy[y][x]) continue;

      const s0 = margin + x * cellW + cellW * 0.06;
      const s1 = margin + (x + 1) * cellW - cellW * 0.06;
      const t0 = margin + y * cellH + cellH * 0.06;
      const t1 = margin + (y + 1) * cellH - cellH * 0.06;

      const fill = rng.pick([canopyMid, canopyMid, canopyLight, canopyDark]);
      fillPolygon(png, rectOnTopFace(s0, s1, t0, t1), fill);

      // Occasional intra-cell notch: a tiny clearing to avoid solid carpets.
      if (rng.float() < 0.10) {
        const notchW = cellW * rng.range(0.22, 0.34);
        const notchH = cellH * rng.range(0.22, 0.34);
        const ns0 = s0 + cellW * rng.range(0.08, 0.55);
        const nt0 = t0 + cellH * rng.range(0.10, 0.55);
        fillPolygon(png, rectOnTopFace(ns0, ns0 + notchW, nt0, nt0 + notchH), topFill);
      }

      // Trunk marks: thin dark plates inside canopy cells (sparingly).
      if (rng.float() < 0.30) {
        const trunkS0 = s0 + (s1 - s0) * rng.range(0.35, 0.55);
        const trunkS1 = trunkS0 + (s1 - s0) * rng.range(0.14, 0.20);
        const trunkT0 = t0 + (t1 - t0) * rng.range(0.10, 0.20);
        const trunkT1 = t0 + (t1 - t0) * rng.range(0.78, 0.92);
        fillPolygon(png, rectOnTopFace(trunkS0, trunkS1, trunkT0, trunkT1), trunkDark);
      }
    }
  }

  // A few clearings (explicit, readable voids).
  const clearingCount = rng.int(2, 3);
  for (let i = 0; i < clearingCount; i += 1) {
    const w = rng.range(0.12, 0.22);
    const h = rng.range(0.08, 0.16);
    const s0 = rng.range(0.12, 0.88 - w);
    const t0 = rng.range(0.12, 0.88 - h);
    fillPolygon(png, rectOnTopFace(s0, s0 + w, t0, t0 + h), topFill);
  }

  return png;
}
// terrain-04-urban
function makeTileUrban1024() {
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
  const blockA = [214, 214, 210, 255];
  const blockB = [206, 206, 202, 255];
  const blockC = [220, 220, 216, 255];

  fillPolygon(png, [right, bottom, bottom2, right2], sideFillRight);
  fillPolygon(png, [bottom, left, left2, bottom2], sideFillLeft);
  fillPolygon(png, [top, right, bottom, left], topFill);

  // URBAN: rigid orthogonal structure with corridors like streets.
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

  const rng = makeRng(0x5552424e); // "URBN"
  const palette = [blockA, blockB, blockC];

  // Establish “streets” as fixed gaps in a grid.
  const streetsS = [0.22, 0.48, 0.74];
  const streetsT = [0.24, 0.52, 0.78];
  const streetW = 0.030;

  function isStreetSpan(s0, s1, t0, t1) {
    const midS = (s0 + s1) / 2;
    const midT = (t0 + t1) / 2;
    return (
      streetsS.some((s) => Math.abs(midS - s) <= streetW / 2) ||
      streetsT.some((t) => Math.abs(midT - t) <= streetW / 2)
    );
  }

  // Fill “building footprints” in each cell, leaving streets clear.
  const cells = [
    { s0: 0.08, s1: 0.42, t0: 0.08, t1: 0.42 },
    { s0: 0.08, s1: 0.42, t0: 0.42, t1: 0.92 },
    { s0: 0.42, s1: 0.92, t0: 0.08, t1: 0.42 },
    { s0: 0.42, s1: 0.92, t0: 0.42, t1: 0.92 },
  ];

  for (const cell of cells) {
    const pad = 0.018;
    const sStart = cell.s0 + pad;
    const sEnd = cell.s1 - pad;
    const tStart = cell.t0 + pad;
    const tEnd = cell.t1 - pad;

    const buildingCount = rng.int(4, 7);
    for (let i = 0; i < buildingCount; i += 1) {
      const w = rng.range(0.06, 0.16);
      const h = rng.range(0.05, 0.14);
      const s0 = rng.range(sStart, Math.max(sStart, sEnd - w));
      const t0 = rng.range(tStart, Math.max(tStart, tEnd - h));
      const s1 = s0 + w;
      const t1 = t0 + h;

      if (isStreetSpan(s0, s1, t0, t1)) continue;
      fillPolygon(png, rectOnTopFace(s0, s1, t0, t1), rng.pick(palette));
    }
  }

  // Add a few long corridor edges as crisp orthogonal bars.
  const corridorColor = blockB;
  for (const s of streetsS) {
    fillPolygon(png, rectOnTopFace(s - streetW / 2, s + streetW / 2, 0.10, 0.90), corridorColor);
  }
  for (const t of streetsT) {
    fillPolygon(png, rectOnTopFace(0.10, 0.90, t - streetW / 2, t + streetW / 2), corridorColor);
  }

  return png;
}
// terrain-05-hill
function makeTileHill1024() {
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
  const bandA = [220, 220, 216, 255];
  const bandB = [214, 214, 210, 255];
  const bandC = [206, 206, 202, 255];

  fillPolygon(png, [right, bottom, bottom2, right2], sideFillRight);
  fillPolygon(png, [bottom, left, left2, bottom2], sideFillLeft);
  fillPolygon(png, [top, right, bottom, left], topFill);

  // HILL: 3–5 nested diamond / angular contour plates (discrete steps).
  const bands = [bandA, bandB, bandC, bandB, bandA];
  const levels = 5;
  for (let i = 0; i < levels; i += 1) {
    const inset = 0.08 + i * 0.09;
    const pTop = { x: top.x + (right.x - top.x) * inset, y: top.y + (right.y - top.y) * inset };
    const pRight = { x: right.x + (bottom.x - right.x) * inset, y: right.y + (bottom.y - right.y) * inset };
    const pBottom = { x: bottom.x + (left.x - bottom.x) * inset, y: bottom.y + (left.y - bottom.y) * inset };
    const pLeft = { x: left.x + (top.x - left.x) * inset, y: left.y + (top.y - left.y) * inset };
    fillPolygon(png, [pTop, pRight, pBottom, pLeft], bands[i]);
  }

  return png;
}
// terrain-06-water
function makeTileWater1024() {
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

  // Water needs to read as water even on a mostly-concrete board.
  // Keep it diagrammatic: flat, hard-edged, no curves, no gradients.
  const topFill = [219, 232, 242, 255]; // pale operational blue (opaque)
  const sideFillRight = [198, 214, 226, 255];
  const sideFillLeft = [190, 206, 218, 255];
  const bandDeep = [96, 162, 188, 255];
  const bandMid = [152, 204, 224, 255];
  const bandShine = [238, 248, 253, 255];

  fillPolygon(png, [right, bottom, bottom2, right2], sideFillRight);
  fillPolygon(png, [bottom, left, left2, bottom2], sideFillLeft);
  fillPolygon(png, [top, right, bottom, left], topFill);

  // WATER: layered "current lanes" + hard-edged highlights (no curves, no noise).
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

  const rng = makeRng(0x57415452); // "WATR"
  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function drawLaneSegment({ s0, s1, t0, t1 }) {
    const sMin = clamp01(Math.min(s0, s1));
    const sMax = clamp01(Math.max(s0, s1));
    const tMin = clamp01(Math.min(t0, t1));
    const tMax = clamp01(Math.max(t0, t1));

    if (sMax - sMin < 0.006 || tMax - tMin < 0.006) return;

    // Base water band + thin hard-edged highlight rails (avoid "outlined boxes").
    fillPolygon(png, rectOnTopFace(sMin, sMax, tMin, tMax), bandMid);

    const h = tMax - tMin;
    const edgeH = Math.min(0.010, Math.max(0.006, h * 0.18));
    const railOffset = rng.range(0.0, 0.18) * (h - edgeH);
    fillPolygon(
      png,
      rectOnTopFace(sMin, sMax, tMin + railOffset, tMin + railOffset + edgeH),
      bandShine
    );
    fillPolygon(
      png,
      rectOnTopFace(sMin, sMax, tMax - edgeH - railOffset, tMax - railOffset),
      bandDeep
    );

    // Notches: cut small gaps back to topFill to imply chop/ripple without curves/noise.
    const notchCount = rng.int(0, 2);
    for (let i = 0; i < notchCount; i += 1) {
      const notchW = rng.range(0.020, 0.045);
      const notchH = rng.range(0.010, 0.020);
      const notchS0 = rng.range(sMin + 0.01, sMax - 0.01 - notchW);
      const notchT0 = rng.range(tMin + 0.01, tMax - 0.01 - notchH);
      fillPolygon(png, rectOnTopFace(notchS0, notchS0 + notchW, notchT0, notchT0 + notchH), topFill);
    }
  }

  // Main current lanes (wide, readable at board zoom).
  const laneBases = [0.16, 0.34, 0.52, 0.70];
  for (const base of laneBases) {
    const laneH = rng.range(0.060, 0.088);
    let s = 0.08 + rng.range(-0.02, 0.02);
    let t = base + rng.range(-0.025, 0.025);
    const segments = rng.int(7, 10);

    for (let i = 0; i < segments; i += 1) {
      const segW = rng.range(0.10, 0.18);
      const gapW = rng.range(0.012, 0.032);
      const drift = rng.pick([-0.016, -0.010, -0.006, 0.006, 0.010, 0.016]);

      // Leave occasional holes so the surface doesn't become a barcode slab.
      if (rng.float() > 0.16) {
        drawLaneSegment({ s0: s, s1: s + segW, t0: t, t1: t + laneH });
      }

      s += segW + gapW;
      t = clamp01(t + drift);

      if (s > 0.92) break;
    }
  }

  // Secondary micro-caps (short slashes) for "ripples" without curves/noise.
  const microCount = 20;
  for (let i = 0; i < microCount; i += 1) {
    const w = rng.range(0.028, 0.060);
    const h = rng.range(0.010, 0.020);
    const s0 = rng.range(0.10, 0.90 - w);
    const t0 = rng.range(0.10, 0.90 - h);
    const fill = rng.pick([bandMid, bandShine]);

    // Bias some ripples to align with the current lanes.
    if (rng.float() < 0.55) {
      fillPolygon(png, rectOnTopFace(s0, s0 + w, t0, t0 + h), fill);
    } else {
      fillPolygon(png, rectOnTopFace(s0, s0 + h, t0, t0 + w), fill);
    }
  }

  return png;
}
// terrain-10-industrial
function makeTileIndustrial1024() {
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

  // Industrial needs higher contrast than urban/rough: it should read as "hard plant/facility".
  // Still diagrammatic: flat plates + seams, no curves, no gradients.
  const padLight = [218, 218, 214, 255];
  const padMid = [198, 198, 194, 255];
  const padDark = [172, 172, 168, 255];
  const seam = [132, 132, 128, 255];
  const channel = [150, 150, 146, 255];

  fillPolygon(png, [right, bottom, bottom2, right2], sideFillRight);
  fillPolygon(png, [bottom, left, left2, bottom2], sideFillLeft);
  fillPolygon(png, [top, right, bottom, left], topFill);

  // INDUSTRIAL: hard facility footprint with plate fields, a few heavy modules,
  // and service corridors / rails. Mostly structured; only micro-variation.
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

  const rng = makeRng(0x494e4455); // "INDU"
  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function drawPlate(s0, s1, t0, t1, fill, inset = 0) {
    const sMin = clamp01(Math.min(s0, s1) + inset);
    const sMax = clamp01(Math.max(s0, s1) - inset);
    const tMin = clamp01(Math.min(t0, t1) + inset);
    const tMax = clamp01(Math.max(t0, t1) - inset);
    if (sMax <= sMin || tMax <= tMin) return;
    fillPolygon(png, rectOnTopFace(sMin, sMax, tMin, tMax), fill);
  }

  // Foundation field (slightly darker than topFill).
  drawPlate(0.10, 0.90, 0.10, 0.90, padLight);

  // Two long bays (reads like factory halls) + one heavy core block.
  drawPlate(0.16, 0.52, 0.18, 0.34, padMid, 0.004);
  drawPlate(0.30, 0.86, 0.40, 0.56, padMid, 0.004);
  drawPlate(0.58, 0.86, 0.18, 0.38, padDark, 0.004);

  // Cutouts (service voids) to avoid a monolithic slab.
  drawPlate(0.44, 0.56, 0.22, 0.32, topFill, 0);
  drawPlate(0.66, 0.80, 0.44, 0.52, topFill, 0);
  drawPlate(0.22, 0.34, 0.44, 0.52, topFill, 0);

  // Perimeter service corridor ring (thin seams).
  const seamT = 0.012;
  drawPlate(0.12, 0.88, 0.12, 0.12 + seamT, seam);
  drawPlate(0.12, 0.88, 0.88 - seamT, 0.88, seam);
  drawPlate(0.12, 0.12 + seamT, 0.12, 0.88, seam);
  drawPlate(0.88 - seamT, 0.88, 0.12, 0.88, seam);

  // Rail pairs (two parallel channels) across the tile.
  const railW = 0.010;
  const railGap = 0.018;
  const railT = 0.62;
  drawPlate(0.14, 0.88, railT, railT + railW, channel);
  drawPlate(0.14, 0.88, railT + railGap, railT + railGap + railW, channel);

  // Small vents/bolts: sparse micro-squares within bays (very restrained).
  const boltCount = 10;
  for (let i = 0; i < boltCount; i += 1) {
    const w = rng.range(0.016, 0.026);
    const h = rng.range(0.016, 0.026);
    const s0 = rng.pick([rng.range(0.18, 0.48), rng.range(0.34, 0.82), rng.range(0.60, 0.82)]);
    const t0 = rng.pick([rng.range(0.20, 0.32), rng.range(0.42, 0.54), rng.range(0.64, 0.78)]);
    drawPlate(s0, s0 + w, t0, t0 + h, rng.pick([seam, channel]), 0.002);
  }

  // One oblique spine to break strict orthogonality (reads in iso as a diagonal run).
  drawPlate(0.18, 0.86, 0.34, 0.36, seam);
  drawPlate(0.18, 0.86, 0.38, 0.40, seam);

  return png;
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
