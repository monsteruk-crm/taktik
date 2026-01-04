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
  const trunkA = [206, 206, 202, 255];
  const trunkB = [214, 214, 210, 255];

  fillPolygon(png, [right, bottom, bottom2, right2], sideFillRight);
  fillPolygon(png, [bottom, left, left2, bottom2], sideFillLeft);
  fillPolygon(png, [top, right, bottom, left], topFill);

  // FOREST: dense vertical block repetition (many tall thin rectangles), staggered rows,
  // small clear lanes. Still purely orthogonal geometry.
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

  // Define a few clear lanes (gaps) in s to keep readability.
  const lanes = [
    { s0: 0.26, s1: 0.32 },
    { s0: 0.58, s1: 0.64 },
  ];

  function inLane(s) {
    return lanes.some((l) => s >= l.s0 && s <= l.s1);
  }

  const rowCount = 12;
  for (let row = 0; row < rowCount; row += 1) {
    const t0 = 0.08 + (row / rowCount) * 0.84;
    const rowH = rng.range(0.035, 0.055);
    const t1 = Math.min(0.92, t0 + rowH);

    const stagger = (row % 2) * rng.range(0.010, 0.020);
    let s = 0.08 + stagger;
    while (s < 0.92) {
      if (inLane(s)) {
        s += 0.05;
        continue;
      }

      const w = rng.range(0.010, 0.020);
      const hBoost = rng.range(0.020, 0.060);
      const tTall0 = Math.max(0.06, t0 - hBoost * 0.6);
      const tTall1 = Math.min(0.94, t1 + hBoost * 0.4);
      const s0 = s;
      const s1 = Math.min(0.94, s + w);

      // Density zones: occasionally skip to create micro-lanes.
      if (rng.float() > 0.12) {
        fillPolygon(png, rectOnTopFace(s0, s1, tTall0, tTall1), rng.pick([trunkA, trunkB]));
      }

      s += w + rng.range(0.006, 0.014);
    }
  }

  return png;
}

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

  const topFill = [232, 232, 228, 255];
  const sideFillRight = [210, 210, 206, 255];
  const sideFillLeft = [204, 204, 200, 255];
  const bandA = [214, 214, 210, 255];
  const bandB = [206, 206, 202, 255];

  fillPolygon(png, [right, bottom, bottom2, right2], sideFillRight);
  fillPolygon(png, [bottom, left, left2, bottom2], sideFillLeft);
  fillPolygon(png, [top, right, bottom, left], topFill);

  // WATER: controlled banding with calm spacing, no curves; procedural surface.
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
  const bandCount = 12;
  let t = 0.10;
  for (let i = 0; i < bandCount; i += 1) {
    const h = rng.range(0.016, 0.026);
    const gap = rng.range(0.010, 0.020);
    const color = i % 2 === 0 ? bandA : bandB;

    // Slight angle: t offset varies with s.
    const skew = rng.pick([-0.03, -0.02, 0.02, 0.03]);
    const sSteps = 6;
    const sSpan = 0.82;
    const s0Base = 0.10;
    const step = sSpan / sSteps;
    for (let sIdx = 0; sIdx < sSteps; sIdx += 1) {
      const s0 = s0Base + sIdx * step;
      const s1 = s0Base + (sIdx + 1) * step;
      const t0 = t + skew * (sIdx / (sSteps - 1));
      const t1 = t0 + h;
      fillPolygon(png, rectOnTopFace(s0, s1, t0, t1), color);
    }

    t += h + gap;
    if (t > 0.86) break;
  }

  return png;
}

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

  const padA = [220, 220, 216, 255];
  const padB = [214, 214, 210, 255];
  const padC = [206, 206, 202, 255];
  const channel = [200, 200, 196, 255];

  fillPolygon(png, [right, bottom, bottom2, right2], sideFillRight);
  fillPolygon(png, [bottom, left, left2, bottom2], sideFillLeft);
  fillPolygon(png, [top, right, bottom, left], topFill);

  // INDUSTRIAL: heavy asymmetric machinery footprint logic:
  // chunky rectangles, offsets, dense clusters + a few small “service channel” lines.
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
  const palette = [padA, padB, padC];

  // Main dense cluster biased toward one quadrant to read asymmetric.
  const cluster = { s0: 0.16, s1: 0.78, t0: 0.18, t1: 0.76 };
  const chunkyCount = 18;
  for (let i = 0; i < chunkyCount; i += 1) {
    const w = rng.range(0.08, 0.22);
    const h = rng.range(0.06, 0.16);
    let s0 = rng.range(cluster.s0, Math.max(cluster.s0, cluster.s1 - w));
    let t0 = rng.range(cluster.t0, Math.max(cluster.t0, cluster.t1 - h));

    // Offset logic: snap-ish to a coarse grid, then nudge.
    const snap = 0.02;
    s0 = Math.round(s0 / snap) * snap + rng.pick([-0.01, 0, 0.01]);
    t0 = Math.round(t0 / snap) * snap + rng.pick([-0.01, 0, 0.01]);
    s0 = Math.max(0.10, Math.min(0.86 - w, s0));
    t0 = Math.max(0.10, Math.min(0.86 - h, t0));

    const s1 = s0 + w;
    const t1 = t0 + h;
    fillPolygon(png, rectOnTopFace(s0, s1, t0, t1), rng.pick(palette));

    // Occasional “baseplate” underlay: slightly larger faint pad behind a block.
    if (rng.float() < 0.22) {
      const pad = rng.range(0.008, 0.016);
      fillPolygon(
        png,
        rectOnTopFace(Math.max(0.08, s0 - pad), Math.min(0.92, s1 + pad), Math.max(0.08, t0 - pad), Math.min(0.92, t1 + pad)),
        padC,
      );
      fillPolygon(png, rectOnTopFace(s0, s1, t0, t1), rng.pick(palette));
    }
  }

  // Secondary sparse blocks to imply equipment sprawl beyond the main cluster.
  const sparseCount = 7;
  for (let i = 0; i < sparseCount; i += 1) {
    const w = rng.range(0.06, 0.14);
    const h = rng.range(0.05, 0.12);
    const s0 = rng.range(0.10, 0.86 - w);
    const t0 = rng.range(0.10, 0.86 - h);
    if (s0 > cluster.s0 && s0 < cluster.s1 && t0 > cluster.t0 && t0 < cluster.t1) continue;
    fillPolygon(png, rectOnTopFace(s0, s0 + w, t0, t0 + h), rng.pick(palette));
  }

  // Service channel lines: thin, hard-edged, short runs.
  const channelCount = 5;
  for (let i = 0; i < channelCount; i += 1) {
    const isHorizontal = rng.float() < 0.5;
    const thicknessT = rng.range(0.010, 0.016);
    if (isHorizontal) {
      const t0 = rng.range(0.18, 0.80);
      const s0 = rng.range(0.16, 0.70);
      const s1 = Math.min(0.90, s0 + rng.range(0.14, 0.26));
      fillPolygon(png, rectOnTopFace(s0, s1, t0, t0 + thicknessT), channel);
    } else {
      const s0 = rng.range(0.18, 0.80);
      const t0 = rng.range(0.16, 0.70);
      const t1 = Math.min(0.90, t0 + rng.range(0.14, 0.24));
      fillPolygon(png, rectOnTopFace(s0, s0 + thicknessT, t0, t1), channel);
    }
  }

  // One heavier diagonal spine (still orthogonal in param space, reads oblique on tile).
  fillPolygon(png, rectOnTopFace(0.22, 0.78, 0.44, 0.50), padB);

  return png;
}

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

const plain = makeTilePlain1024();
generatedFiles.push("terrain-01-plain.png");
writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), plain);

const rough = makeTileRough1024();
generatedFiles.push("terrain-02-rough.png");
writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), rough);

const forest = makeTileForest1024();
generatedFiles.push("terrain-03-forest.png");
writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), forest);

const urban = makeTileUrban1024();
generatedFiles.push("terrain-04-urban.png");
writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), urban);

const hill = makeTileHill1024();
generatedFiles.push("terrain-05-hill.png");
writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), hill);

const water = makeTileWater1024();
generatedFiles.push("terrain-06-water.png");
writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), water);

const industrial = makeTileIndustrial1024();
generatedFiles.push("terrain-10-industrial.png");
writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), industrial);

// Main in-game tiles (overwrites legacy placeholders).
const groundMain = makeMainGroundTile();
generatedFiles.push("ground.png");
writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), groundMain);

const highlightMain = makeMainHighlightTile();
generatedFiles.push("highlight_move.png");
writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), highlightMain);

// Advanced overlays (not wired into runtime yet).
const attackHighlight = makeHighlightTileTopFace({
  fill: [126, 58, 47, 190], // muted rust red
  border: [126, 58, 47, 230],
  segmentation: "radial-4",
});
generatedFiles.push("highlight_attack.png");
writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), attackHighlight);

const moveHighlightAdvanced = makeHighlightTileTopFace({
  fill: [66, 135, 168, 190], // desaturated cold blue
  border: [66, 135, 168, 230],
  banding: "subtle",
});
generatedFiles.push("highlight_move_adv.png");
writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), moveHighlightAdvanced);

const targetConfirmHighlight = makeHighlightTileTopFace({
  fill: [164, 154, 96, 200], // pale khaki
  border: [164, 154, 96, 235],
  segmentation: "diagonal-split",
});
generatedFiles.push("highlight_target_confirm.png");
writePng(path.join(TEMP_DIR, generatedFiles[generatedFiles.length - 1]), targetConfirmHighlight);

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
  const variants = [];
  for (const edges of EDGE_SUBSETS) {
    const key = edgeKey(edges);
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
  networkManifest[net.id] = variants;
}

for (const fileName of generatedFiles) {
  cropTileWithImagemagick(
    path.join(TEMP_DIR, fileName),
    path.join(OUT_DIR, fileName)
  );
}

for (const [netId, variants] of Object.entries(networkManifest)) {
  for (const key of variants) {
    const filename = `${netId}_${key}.png`;
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
