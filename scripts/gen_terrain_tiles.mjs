import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "assets", "tiles");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writePng(filePath, png) {
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(filePath, buffer);
}

function setPixel(png, x, y, color) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const idx = (y * png.width + x) * 4;
  png.data[idx] = color[0];
  png.data[idx + 1] = color[1];
  png.data[idx + 2] = color[2];
  png.data[idx + 3] = color[3];
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

function makeTilePlain1024() {
  const size = 1024;
  const png = new PNG({ width: size, height: size });
  png.data.fill(0);

  const cx = size / 2;
  const cy = 430;

  const tileW = 640;
  const tileH = 320;
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
  const size = 1024;
  const png = new PNG({ width: size, height: size });
  png.data.fill(0);

  const cx = size / 2;
  const cy = 430;

  const tileW = 640;
  const tileH = 320;
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
  const size = 1024;
  const png = new PNG({ width: size, height: size });
  png.data.fill(0);

  const cx = size / 2;
  const cy = 430;

  const tileW = 640;
  const tileH = 320;
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
  const size = 1024;
  const png = new PNG({ width: size, height: size });
  png.data.fill(0);

  const cx = size / 2;
  const cy = 430;

  const tileW = 640;
  const tileH = 320;
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
  const size = 1024;
  const png = new PNG({ width: size, height: size });
  png.data.fill(0);

  const cx = size / 2;
  const cy = 430;

  const tileW = 640;
  const tileH = 320;
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
  const size = 1024;
  const png = new PNG({ width: size, height: size });
  png.data.fill(0);

  const cx = size / 2;
  const cy = 430;

  const tileW = 640;
  const tileH = 320;
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

ensureDir(OUT_DIR);

const plain = makeTilePlain1024();
writePng(path.join(OUT_DIR, "terrain-01-plain.png"), plain);

const rough = makeTileRough1024();
writePng(path.join(OUT_DIR, "terrain-02-rough.png"), rough);

const forest = makeTileForest1024();
writePng(path.join(OUT_DIR, "terrain-03-forest.png"), forest);

const urban = makeTileUrban1024();
writePng(path.join(OUT_DIR, "terrain-04-urban.png"), urban);

const hill = makeTileHill1024();
writePng(path.join(OUT_DIR, "terrain-05-hill.png"), hill);

const water = makeTileWater1024();
writePng(path.join(OUT_DIR, "terrain-06-water.png"), water);

console.log(
  "Generated terrain tiles: terrain-01-plain.png, terrain-02-rough.png, terrain-03-forest.png, terrain-04-urban.png, terrain-05-hill.png, terrain-06-water.png",
);
