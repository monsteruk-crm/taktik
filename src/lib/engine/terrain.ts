import type { BoardCell } from "./gameState";

const DIRECTIONS = [
  { key: "N", dx: 0, dy: -1 },
  { key: "E", dx: 1, dy: 0 },
  { key: "S", dx: 0, dy: 1 },
  { key: "W", dx: -1, dy: 0 },
] as const;

type Dir = (typeof DIRECTIONS)[number];

function nextSeed(seed: number) {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function makeRng(seed: number) {
  let state = seed >>> 0;
  return {
    seed() {
      return state >>> 0;
    },
    float() {
      state = nextSeed(state);
      return state / 0x100000000; // [0,1)
    },
    int(min: number, max: number) {
      const f = this.float();
      return min + Math.floor(f * (max - min + 1)); // inclusive
    },
    pick<T>(items: readonly T[]): T {
      return items[this.int(0, items.length - 1)];
    },
    shuffle<T>(arr: T[]): T[] {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = this.int(0, i);
        const tmp = arr[i];
        arr[i] = arr[j]!;
        arr[j] = tmp!;
      }
      return arr;
    },
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/**
 * IMPORTANT: matches the old engine behavior:
 * - params like 4 must "max out" to 0.6 (overload mode)
 */
function normalizeDensity(density: number) {
  if (!Number.isFinite(density)) return 0.01;
  return clamp(density, 0.01, 0.6);
}

function keyOf(c: BoardCell) {
  return `${c.x},${c.y}`;
}

function parseKey(k: string): BoardCell {
  const [x, y] = k.split(",").map(Number);
  return { x, y };
}

function inBounds(c: BoardCell, width: number, height: number) {
  return c.x >= 0 && c.x < width && c.y >= 0 && c.y < height;
}

function manhattan(a: BoardCell, b: BoardCell) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function neighbors(
    c: BoardCell,
    width: number,
    height: number
): Array<{ cell: BoardCell; dir: Dir }> {
  const out: Array<{ cell: BoardCell; dir: Dir }> = [];
  for (const dir of DIRECTIONS) {
    const n = { x: c.x + dir.dx, y: c.y + dir.dy };
    if (inBounds(n, width, height)) out.push({ cell: n, dir });
  }
  return out;
}

function neighborCount(set: Set<string>, c: BoardCell, width: number, height: number) {
  let n = 0;
  for (const { cell } of neighbors(c, width, height)) {
    if (set.has(keyOf(cell))) n++;
  }
  return n;
}

function randomEdgeCell(rng: ReturnType<typeof makeRng>, width: number, height: number): BoardCell {
  const side = rng.int(0, 3);
  if (side === 0) return { x: rng.int(0, width - 1), y: 0 };
  if (side === 1) return { x: width - 1, y: rng.int(0, height - 1) };
  if (side === 2) return { x: rng.int(0, width - 1), y: height - 1 };
  return { x: 0, y: rng.int(0, height - 1) };
}

function randomInteriorCell(rng: ReturnType<typeof makeRng>, width: number, height: number): BoardCell {
  if (width <= 2 || height <= 2) return { x: rng.int(0, width - 1), y: rng.int(0, height - 1) };
  return { x: rng.int(1, width - 2), y: rng.int(1, height - 2) };
}

function oppositeEdgeTarget(
    rng: ReturnType<typeof makeRng>,
    width: number,
    height: number,
    start: BoardCell
): BoardCell {
  if (start.y === 0) return { x: rng.int(0, width - 1), y: height - 1 };
  if (start.y === height - 1) return { x: rng.int(0, width - 1), y: 0 };
  if (start.x === 0) return { x: width - 1, y: rng.int(0, height - 1) };
  return { x: 0, y: rng.int(0, height - 1) };
}

function pickFarEdgePair(
    rng: ReturnType<typeof makeRng>,
    width: number,
    height: number,
    tries: number
): { start: BoardCell; goal: BoardCell } {
  let best: { start: BoardCell; goal: BoardCell; dist: number } | null = null;
  for (let i = 0; i < tries; i++) {
    const s = randomEdgeCell(rng, width, height);
    const g = oppositeEdgeTarget(rng, width, height, s);
    const d = manhattan(s, g);
    if (!best || d > best.dist) best = { start: s, goal: g, dist: d };
  }
  return { start: best!.start, goal: best!.goal };
}

function computeDegrees(set: Set<string>, width: number, height: number) {
  const deg = new Map<string, number>();
  for (const k of set) {
    const c = parseKey(k);
    deg.set(k, neighborCount(set, c, width, height));
  }
  return deg;
}

function isStraightCell(cellKey: string, set: Set<string>) {
  const [xs, ys] = cellKey.split(",");
  const x = Number(xs);
  const y = Number(ys);
  const hasN = set.has(`${x},${y - 1}`);
  const hasS = set.has(`${x},${y + 1}`);
  const hasE = set.has(`${x + 1},${y}`);
  const hasW = set.has(`${x - 1},${y}`);
  const deg = Number(hasN) + Number(hasS) + Number(hasE) + Number(hasW);
  if (deg !== 2) return false;
  return (hasN && hasS) || (hasE && hasW);
}

function axisOf(dir: Dir): "H" | "V" {
  return dir.dx === 0 ? "V" : "H";
}

function wouldCreateSquare(
  set: Set<string>,
  cell: BoardCell,
  width: number,
  height: number
) {
  const positions = [
    { x: cell.x, y: cell.y },
    { x: cell.x - 1, y: cell.y },
    { x: cell.x, y: cell.y - 1 },
    { x: cell.x - 1, y: cell.y - 1 },
  ];

  for (const pos of positions) {
    const a = { x: pos.x, y: pos.y };
    const b = { x: pos.x + 1, y: pos.y };
    const c = { x: pos.x, y: pos.y + 1 };
    const d = { x: pos.x + 1, y: pos.y + 1 };
    if (!inBounds(a, width, height)) continue;
    if (!inBounds(b, width, height)) continue;
    if (!inBounds(c, width, height)) continue;
    if (!inBounds(d, width, height)) continue;
    const aKey = keyOf(a);
    const bKey = keyOf(b);
    const cKey = keyOf(c);
    const dKey = keyOf(d);
    const filled =
      (a.x === cell.x && a.y === cell.y ? 1 : set.has(aKey) ? 1 : 0) +
      (b.x === cell.x && b.y === cell.y ? 1 : set.has(bKey) ? 1 : 0) +
      (c.x === cell.x && c.y === cell.y ? 1 : set.has(cKey) ? 1 : 0) +
      (d.x === cell.x && d.y === cell.y ? 1 : set.has(dKey) ? 1 : 0);
    if (filled === 4) return true;
  }

  return false;
}

function buffered(set: Set<string>, width: number, height: number, radius: number) {
  const out = new Set<string>(set);
  if (radius <= 0) return out;
  for (const k of set) {
    const c = parseKey(k);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const n = { x: c.x + dx, y: c.y + dy };
        if (inBounds(n, width, height)) out.add(keyOf(n));
      }
    }
  }
  return out;
}

type AStarCostFn = (args: {
  from: BoardCell;
  to: BoardCell;
  dir: Dir;
  prevDir: Dir | null;
  prevPrevDir: Dir | null;
  runLen: number;
  nextRunLen: number;
  g: number;
}) => number;

function sameAxis(a: Dir, b: Dir) {
  return (a.dx === 0 && b.dx === 0) || (a.dy === 0 && b.dy === 0);
}

function isOpposite(a: Dir, b: Dir) {
  return a.dx === -b.dx && a.dy === -b.dy;
}

function aStarPath(args: {
  width: number;
  height: number;
  start: BoardCell;
  goal: BoardCell;
  blocked: Set<string>;
  allowGoalOnBlocked?: boolean;
  stepCost: AStarCostFn;
  maxExpanded?: number;
}): BoardCell[] | null {
  const { width, height, start, goal, blocked } = args;
  const allowGoalOnBlocked = args.allowGoalOnBlocked ?? false;
  const maxExpanded = args.maxExpanded ?? width * height * 60;

  const startKey = `${start.x},${start.y},_,_,0`;
  const maxRunBucket = 4;

  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const cameFrom = new Map<string, string>();

  const open: string[] = [startKey];
  gScore.set(startKey, 0);
  fScore.set(startKey, manhattan(start, goal));

  function parseStateKey(k: string): { cell: BoardCell; prevDir: Dir | null; prevPrevDir: Dir | null; runLen: number } {
    const [xs, ys, d, p, runStr] = k.split(",");
    const cell = { x: Number(xs), y: Number(ys) };
    const prevDir = d === "_" ? null : (DIRECTIONS.find((dd) => dd.key === d) ?? null);
    const prevPrevDir = p === "_" ? null : (DIRECTIONS.find((dd) => dd.key === p) ?? null);
    const runLen = runStr ? Number(runStr) : 0;
    return { cell, prevDir, prevPrevDir, runLen };
  }

  function lowestFIndex(): number {
    let bestI = 0;
    let bestF = Infinity;
    for (let i = 0; i < open.length; i++) {
      const k = open[i]!;
      const f = fScore.get(k) ?? Infinity;
      const tie = (gScore.get(k) ?? 0) * 0.0001;
      const val = f + tie;
      if (val < bestF) {
        bestF = val;
        bestI = i;
      }
    }
    return bestI;
  }

  let expanded = 0;
  while (open.length > 0 && expanded < maxExpanded) {
    expanded++;
    const idx = lowestFIndex();
    const currentKey = open.splice(idx, 1)[0]!;
    const { cell: current, prevDir, prevPrevDir, runLen } = parseStateKey(currentKey);

    if (current.x === goal.x && current.y === goal.y) {
      const path: BoardCell[] = [goal];
      let cur = currentKey;
      while (cameFrom.has(cur)) {
        cur = cameFrom.get(cur)!;
        const { cell } = parseStateKey(cur);
        path.push(cell);
      }
      path.reverse();
      const out: BoardCell[] = [];
      for (const c of path) {
        if (out.length === 0 || out[out.length - 1]!.x !== c.x || out[out.length - 1]!.y !== c.y) {
          out.push(c);
        }
      }
      return out;
    }

    for (const { cell: nxt, dir } of neighbors(current, width, height)) {
      const nxtCellKey = keyOf(nxt);
      if (blocked.has(nxtCellKey) && !(allowGoalOnBlocked && nxt.x === goal.x && nxt.y === goal.y)) {
        continue;
      }

      const nextRunLen =
        prevDir && sameAxis(prevDir, dir) ? Math.min(runLen + 1, maxRunBucket) : 1;
      const nextPrevPrev = prevDir ? prevDir.key : "_";
      const nxtStateKey = `${nxt.x},${nxt.y},${dir.key},${nextPrevPrev},${nextRunLen}`;
      const gCurrent = gScore.get(currentKey) ?? Infinity;

      const step = args.stepCost({
        from: current,
        to: nxt,
        dir,
        prevDir,
        prevPrevDir,
        runLen,
        nextRunLen,
        g: gCurrent,
      });
      const tentativeG = gCurrent + step;
      const prevBest = gScore.get(nxtStateKey);

      if (prevBest === undefined || tentativeG < prevBest) {
        cameFrom.set(nxtStateKey, currentKey);
        gScore.set(nxtStateKey, tentativeG);

        const h = manhattan(nxt, goal) + (nxt.x * 0.0002 + nxt.y * 0.0001);
        fScore.set(nxtStateKey, tentativeG + h);

        if (!open.includes(nxtStateKey)) open.push(nxtStateKey);
      }
    }
  }

  return null;
}

function addPath(set: Set<string>, path: BoardCell[]) {
  for (const c of path) set.add(keyOf(c));
}

function countIntersections(path: BoardCell[], existing: Set<string>) {
  let hits = 0;
  for (const c of path) {
    if (existing.has(keyOf(c))) hits++;
  }
  return hits;
}

function tooManyNewHighDegree(
    path: BoardCell[],
    existing: Set<string>,
    width: number,
    height: number,
    maxDeg: number,
    maxCount: number
) {
  let count = 0;
  for (const c of path) {
    const k = keyOf(c);
    if (existing.has(k)) continue;
    const deg = neighborCount(existing, c, width, height);
    if (deg >= maxDeg) count++;
    if (count > maxCount) return true;
  }
  return false;
}

function riverWalk(args: {
  rng: ReturnType<typeof makeRng>;
  width: number;
  height: number;
  start: BoardCell;
  goal?: BoardCell;
  blocked: Set<string>;
  avoidSquaresWith: Set<string>;
  allowSquareAtGoal?: boolean;
  minAxisRun: number;
  turnProb: number;
  maxSteps: number;
}): BoardCell[] | null {
  const {
    rng,
    width,
    height,
    start,
    blocked,
    avoidSquaresWith,
    minAxisRun,
    turnProb,
    maxSteps,
  } = args;
  const goal = args.goal;
  const allowSquareAtGoal = args.allowSquareAtGoal ?? false;
  // Sanity: axis-run persistence + anti-ABAB filter prevents checkerboard lattices at high density.
  const path: BoardCell[] = [start];
  let current = start;
  let lastDir: Dir | null = null;
  let runAxis: "H" | "V" | null = null;
  let runLen = 0;
  const recentDirs: Dir[] = [];

  for (let steps = 0; steps < maxSteps; steps += 1) {
    if (goal && current.x === goal.x && current.y === goal.y) return path;

    let options = DIRECTIONS.filter((dir) => {
      const next = { x: current.x + dir.dx, y: current.y + dir.dy };
      if (!inBounds(next, width, height)) return false;
      const key = keyOf(next);
      if (blocked.has(key) && !(goal && next.x === goal.x && next.y === goal.y)) return false;
      if (
        !allowSquareAtGoal &&
        !(goal && next.x === goal.x && next.y === goal.y) &&
        wouldCreateSquare(avoidSquaresWith, next, width, height)
      ) {
        return false;
      }
      return true;
    });

    if (options.length === 0) return null;

    if (lastDir) {
      const lastDirSnapshot: Dir = lastDir;
      const withoutBacktrack = options.filter((dir) => !isOpposite(lastDirSnapshot, dir));
      if (withoutBacktrack.length > 0) options = withoutBacktrack;
    }

    if (lastDir) {
      const axis = axisOf(lastDir);
      const sameAxis = options.filter((dir) => axisOf(dir) === axis);
      const turnAxis = options.filter((dir) => axisOf(dir) !== axis);
      const canTurn = runLen >= minAxisRun && rng.float() < turnProb;

      if (runLen < minAxisRun && sameAxis.length > 0) {
        options = sameAxis;
      } else if (canTurn && turnAxis.length > 0) {
        options = turnAxis;
      } else if (sameAxis.length > 0) {
        options = sameAxis;
      }
    }

    if (recentDirs.length >= 3) {
      const a = recentDirs[recentDirs.length - 3]!;
      const b = recentDirs[recentDirs.length - 2]!;
      const c = recentDirs[recentDirs.length - 1]!;
      if (a.key === c.key) {
        const filtered = options.filter((dir) => dir.key !== b.key);
        if (filtered.length > 0) options = filtered;
      }
    }

    if (options.length === 0) return null;

    let chosen = options[0]!;
    if (goal) {
      let bestDist = Infinity;
      const best: Dir[] = [];
      for (const dir of options) {
        const next = { x: current.x + dir.dx, y: current.y + dir.dy };
        const dist = manhattan(next, goal);
        if (dist < bestDist) {
          bestDist = dist;
          best.length = 0;
          best.push(dir);
        } else if (dist === bestDist) {
          best.push(dir);
        }
      }
      chosen = rng.pick(best);
    } else {
      chosen = rng.pick(options);
    }

    current = { x: current.x + chosen.dx, y: current.y + chosen.dy };
    path.push(current);
    avoidSquaresWith.add(keyOf(current));

    const chosenAxis = axisOf(chosen);
    if (runAxis === chosenAxis) {
      runLen += 1;
    } else {
      runAxis = chosenAxis;
      runLen = 1;
    }
    lastDir = chosen;
    recentDirs.push(chosen);
    if (recentDirs.length > 3) recentDirs.shift();
  }

  return null;
}

/**
 * RIVERS: hierarchy = trunk + tributaries (tree-ish)
 * - target is still "coverage" so density affects how many tributaries we add
 * - NO flood-fill growth (that makes spaghetti)
 */
function generateRiverCells(args: {
  rng: ReturnType<typeof makeRng>;
  width: number;
  height: number;
  density: number;
}): Set<string> {
  const { rng, width, height } = args;

  const density = normalizeDensity(args.density);
  const target = Math.max(0, Math.round(width * height * density));
  if (target === 0) return new Set();

  const river = new Set<string>();

  // 1) Trunk
  const { start, goal } = pickFarEdgePair(rng, width, height, 30);
  const trunk = riverWalk({
    rng,
    width,
    height,
    start,
    goal,
    blocked: new Set(),
    avoidSquaresWith: new Set<string>(),
    minAxisRun: 2,
    turnProb: 0.4,
    maxSteps: width * height,
  });

  if (!trunk || trunk.length < 3) {
    river.add(keyOf(start));
    return river;
  }
  addPath(river, trunk);

  // 2) Tributaries: repeatedly connect "sources" to "join points" on existing river.
  //    We never allow crossing/looping: the path is blocked from touching river except at the join.
  const attemptLimit = width * height * 6;
  let attempts = 0;

  while (river.size < target && attempts < attemptLimit) {
    attempts++;

    const deg = computeDegrees(river, width, height);

    // Prefer join points on straight segments (clean confluences).
    const candidates = Array.from(river).filter((k) => {
      const d = deg.get(k) ?? 0;
      if (d !== 2) return false;
      return isStraightCell(k, river);
    });

    if (candidates.length === 0) break;

    const joinKey = candidates[rng.int(0, candidates.length - 1)]!;
    const join = parseKey(joinKey);

    // Source selection:
    // - mostly from edges (reads like tributaries entering the map)
    // - sometimes from interior at high density
    const useInterior = density > 0.35 && rng.float() < 0.35;
    let source = useInterior ? randomInteriorCell(rng, width, height) : randomEdgeCell(rng, width, height);

    // Ensure source is not too close to join, otherwise it becomes a tiny kink.
    for (let i = 0; i < 10; i++) {
      const cand = useInterior ? randomInteriorCell(rng, width, height) : randomEdgeCell(rng, width, height);
      if (manhattan(cand, join) >= Math.floor((width + height) * 0.25)) {
        source = cand;
        break;
      }
    }

    const sourceKey = keyOf(source);
    if (river.has(sourceKey)) continue;

    const blocked = new Set<string>(river);

    const path = riverWalk({
      rng,
      width,
      height,
      start: source,
      goal: join,
      blocked,
      avoidSquaresWith: new Set<string>(river),
      allowSquareAtGoal: true,
      minAxisRun: 2,
      turnProb: 0.45,
      maxSteps: Math.floor((width + height) * 2.5),
    });

    if (!path || path.length < 4) continue;

    // Reject if it would create too many high-degree junctions (keeps it vein-like).
    if (tooManyNewHighDegree(path, river, width, height, 3, 2)) continue;

    addPath(river, path);
  }

  return river;
}

/**
 * Bridge cells: road may overlap river ONLY on:
 * - straight river segments (deg==2 and straight)
 * - not within 1 tile of a confluence (deg>=3)
 */
function computeBridgeCandidates(river: Set<string>, width: number, height: number) {
  const deg = computeDegrees(river, width, height);

  const junctions = new Set<string>();
  for (const [k, d] of deg.entries()) {
    if (d >= 3) junctions.add(k);
  }

  const badNearJunction = new Set<string>();
  for (const k of junctions) {
    const c = parseKey(k);
    badNearJunction.add(k);
    for (const { cell } of neighbors(c, width, height)) badNearJunction.add(keyOf(cell));
  }

  const candidates: string[] = [];
  for (const k of river) {
    const d = deg.get(k) ?? 0;
    if (d !== 2) continue;
    if (!isStraightCell(k, river)) continue;
    if (badNearJunction.has(k)) continue;
    candidates.push(k);
  }

  return candidates;
}

type RoadMode = "arterial" | "collector" | "local";

function generateRoadCells(args: {
  rng: ReturnType<typeof makeRng>;
  width: number;
  height: number;
  density: number;
  river: Set<string>;
  maxBridges?: number;
}): Set<string> {
  const { rng, width, height, river } = args;

  const density = normalizeDensity(args.density);
  const target = Math.max(0, Math.round(width * height * density));
  if (target === 0) return new Set();

  const road = new Set<string>();
  const riverHardBlocked = new Set<string>(river);
  const riverBuffered = buffered(river, width, height, 1);

  // --- BRIDGES (PARAMETRIZABLE) ---
  // Default behavior (when maxBridges is undefined) remains the same as before:
  // guarantee 1 bridge if possible; sometimes add a 2nd at higher road density.
  // If maxBridges is provided, we place up to that many distinct bridges (0 allowed).
  const bridges = new Set<string>();
  let primaryBridge: string | null = null;

  const want = args.maxBridges;
    if (want !== undefined) {
      const budget = Math.max(0, Math.floor(want));
      if (budget > 0) {
        const attempts = Math.max(8, budget * 12);
        for (let t = 0; t < attempts && bridges.size < budget; t++) {
          const k = pickBridgeThatConnectsComponents({ rng, river, width, height });
          if (k) {
            bridges.add(k);
            primaryBridge = primaryBridge ?? k;
          }
        }
      }
    } else {
      // Legacy behavior
      const bridgeKey = pickBridgeThatConnectsComponents({ rng, river, width, height });
      if (bridgeKey) {
        bridges.add(bridgeKey);
        primaryBridge = bridgeKey;
      }

      // Bridge budget: allow a second one at higher densities
      if (bridgeKey && density > 0.38 && rng.float() < 0.55) {
        const bridgeKey2 = pickBridgeThatConnectsComponents({ rng, river, width, height });
        if (bridgeKey2 && bridgeKey2 !== bridgeKey) bridges.add(bridgeKey2);
      }
    }

  const isRiverPassableForRoad = (k: string) => !riverHardBlocked.has(k) || bridges.has(k);

  const roadAdjPenalty = (to: BoardCell) => {
    let p = 0;
    for (const { cell } of neighbors(to, width, height)) {
      if (road.has(keyOf(cell))) p += 0.25;
    }
    return p;
  };

  const routeRoad = (start: BoardCell, goal: BoardCell, relax = 0) => {
    // Block river EXCEPT bridge cells.
    const blocked = new Set<string>();
    for (const k of riverHardBlocked) if (!bridges.has(k)) blocked.add(k);

    return aStarPath({
      width,
      height,
      start,
      goal,
      blocked,
      allowGoalOnBlocked: true,
      stepCost: ({ to, dir, prevDir }) => {
        const tk = keyOf(to);

        // hard stop for river unless bridge
        if (riverHardBlocked.has(tk) && !bridges.has(tk)) return 999;

        const turnPenalty = prevDir && prevDir.key !== dir.key ? (1.15 - relax) : 0;

        // Keep roads away from rivers, but do NOT make it impossible.
        const nearRiver = riverBuffered.has(tk) ? (1.4 - relax) : 0;

        // Avoid dense ladder/grid.
        const nearRoad = (0.55 - relax * 0.25) * roadAdjPenalty(to);

        // IMPORTANT: encourage using bridges when they exist (otherwise overlap may never happen)
        const bridgeBonus = bridges.has(tk) ? -1.2 : 0;

        // TODO: If checkerboards persist, tweak 2x2 suppression:
        // - Increase squarePenalty above 4.5 to further discourage road lattices
        // - Allow more square formation by lowering it toward 0
        const squarePenalty = wouldCreateSquare(road, to, width, height) ? 4.5 : 0;

        const crossingPenalty =
            wouldCreateDenseCrossing(road, to, width, height) ? 3.5 : 0;

        return 1 + turnPenalty + crossingPenalty + nearRiver + nearRoad + bridgeBonus + squarePenalty;
      },
      maxExpanded: width * height * 260,
    });
  };

  // --- FORCE ONE ARTERIAL THAT USES THE BRIDGE ---
  if (primaryBridge) {
    const blockedRiver = new Set<string>(riverHardBlocked);
    // treat river as blocked for component logic
    const { compId } = floodFillComponents({ width, height, blocked: blockedRiver });

    const b = parseKey(primaryBridge);

    // Find two neighbor land components around the bridge
    const sideCells = neighbors(b, width, height)
        .map((n) => n.cell)
        .filter((c) => !riverHardBlocked.has(keyOf(c)));

    // If weird edge case, just seed around bridge.
    if (sideCells.length >= 2) {
      const comps = sideCells
          .map((c) => ({ c, id: compId.get(keyOf(c)) }))
          .filter((x) => x.id !== undefined) as Array<{ c: BoardCell; id: number }>;

      // pick two different comps if possible
      let aComp = comps[0]!.id;
      let bComp = comps[0]!.id;
      for (let i = 0; i < comps.length; i++) {
        for (let j = i + 1; j < comps.length; j++) {
          if (comps[i]!.id !== comps[j]!.id) {
            aComp = comps[i]!.id;
            bComp = comps[j]!.id;
            i = comps.length;
            break;
          }
        }
      }

      const start = pickLandCellInSameComponent({
        rng,
        width,
        height,
        blocked: new Set<string>(riverHardBlocked),
        compId,
        wantComp: aComp,
        preferEdge: true,
      });

      const goal = pickLandCellInSameComponent({
        rng,
        width,
        height,
        blocked: new Set<string>(riverHardBlocked),
        compId,
        wantComp: bComp,
        preferEdge: true,
      });

      // This should almost always require the bridge if the river truly splits components.
      let arterial = routeRoad(start, goal, 0);
      if (!arterial) arterial = routeRoad(start, goal, 0.8);
      if (!arterial) arterial = routeRoad(start, goal, 1.2);

      if (arterial && arterial.length >= 3) addPath(road, arterial);
    }
  }

  // --- NORMAL HIERARCHY FILL (MULTIPLE PATHS) ---
  // 1) Arterials
  const arterialCount = clamp(Math.floor(density * 6), 2, 7);
  let tries = 0;
  while (road.size < Math.floor(target * 0.55) && tries < arterialCount * 24) {
    tries++;

    const start = randomEdgeCell(rng, width, height);
    const goal = oppositeEdgeTarget(rng, width, height, start);

    if (!isRiverPassableForRoad(keyOf(start)) || !isRiverPassableForRoad(keyOf(goal))) continue;
    if (manhattan(start, goal) < Math.floor((width + height) * 0.35)) continue;

    let path = routeRoad(start, goal, 0);
    if (!path) path = routeRoad(start, goal, 0.8);
    if (!path) continue;

    addPath(road, path);
  }

  // 2) Collectors (connect far road points)
  const collectorCount = clamp(Math.floor(density * 16), 6, 34);
  let ctries = 0;
  while (road.size < Math.floor(target * 0.9) && ctries < collectorCount * 10) {
    ctries++;
    if (road.size === 0) break;

    const keys = Array.from(road);
    const start = parseKey(keys[rng.int(0, keys.length - 1)]!);
    let goal = parseKey(keys[rng.int(0, keys.length - 1)]!);

    // pick a farther goal
    for (let i = 0; i < 8; i++) {
      const cand = parseKey(keys[rng.int(0, keys.length - 1)]!);
      if (manhattan(start, cand) > manhattan(start, goal)) goal = cand;
    }

    if (manhattan(start, goal) < Math.floor((width + height) * 0.18)) continue;

    let path = routeRoad(start, goal, 0.3);
    if (!path) path = routeRoad(start, goal, 1.0);
    if (!path) continue;

    addPath(road, path);
  }

  // 3) Locals (short spurs)
  const localCount = clamp(Math.floor(density * 40), 10, 160);
  let ltries = 0;
  while (road.size < target && ltries < localCount * 2) {
    ltries++;
    if (road.size === 0) break;

    const keys = Array.from(road);
    const start = parseKey(keys[rng.int(0, keys.length - 1)]!);

    const goal = {
      x: clamp(start.x + rng.int(-5, 5), 0, width - 1),
      y: clamp(start.y + rng.int(-5, 5), 0, height - 1),
    };

    if (!isRiverPassableForRoad(keyOf(goal))) continue;
    if (manhattan(start, goal) < 3) continue;

    let path = routeRoad(start, goal, 0.6);
    if (!path) path = routeRoad(start, goal, 1.2);
    if (!path) continue;

    addPath(road, path);
  }

  // Final cleanup: remove illegal overlaps (river but not bridge)
  for (const k of Array.from(road)) {
    if (riverHardBlocked.has(k) && !bridges.has(k)) road.delete(k);
  }

  // HARD guarantee: never return empty roads
  if (road.size === 0) {
    // create a tiny road around the bridge or an edge
    if (primaryBridge) {
      const b = parseKey(primaryBridge);
      road.add(keyOf(b)); // overlap guaranteed
      for (const { cell } of neighbors(b, width, height)) {
        if (!riverHardBlocked.has(keyOf(cell))) {
          road.add(keyOf(cell));
          if (road.size >= 4) break;
        }
      }
    } else {
      // no river => just seed a short edge road
      const s = randomEdgeCell(rng, width, height);
      road.add(keyOf(s));
      const ns = neighbors(s, width, height);
      if (ns[0]) road.add(keyOf(ns[0].cell));
    }
  }
  //return road
  return pruneDeadArmsAtIntersections(road, width, height);
}

function floodFillComponents(args: {
  width: number;
  height: number;
  blocked: Set<string>;
}): { compId: Map<string, number>; compCount: number } {
  const { width, height, blocked } = args;

  const compId = new Map<string, number>();
  let compCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const k = `${x},${y}`;
      if (blocked.has(k) || compId.has(k)) continue;

      const id = compCount++;
      const q: BoardCell[] = [{ x, y }];
      compId.set(k, id);

      while (q.length) {
        const cur = q.pop()!;
        for (const { cell } of neighbors(cur, width, height)) {
          const nk = keyOf(cell);
          if (blocked.has(nk) || compId.has(nk)) continue;
          compId.set(nk, id);
          q.push(cell);
        }
      }
    }
  }

  return { compId, compCount };
}
function wouldCreateDenseCrossing(
    road: Set<string>,
    c: BoardCell,
    width: number,
    height: number
) {
  const degHere = neighborCount(road, c, width, height);
  if (degHere < 3) return false;

  // If any neighbor is already a 4-way, forbid another cross here
  for (const { cell: n } of neighbors(c, width, height)) {
    if (!road.has(keyOf(n))) continue;
    const d = neighborCount(road, n, width, height);
    if (d >= 4) return true;
  }

  return false;
}

function pickBridgeThatConnectsComponents(args: {
  rng: ReturnType<typeof makeRng>;
  river: Set<string>;
  width: number;
  height: number;
}): string | null {
  const { rng, river, width, height } = args;

  if (river.size === 0) return null;

  // Treat river as blocked to compute land components.
  const { compId } = floodFillComponents({
    width,
    height,
    blocked: new Set<string>(river),
  });

  // A good bridge cell is a river cell whose 4-neighbors include >=2 distinct land components.
  const candidates: string[] = [];
  for (const rk of river) {
    const r = parseKey(rk);

    // Prefer non-edge bridges (look better & reduce weird border overlaps)
    if (r.x === 0 || r.y === 0 || r.x === width - 1 || r.y === height - 1) continue;

    const comps = new Set<number>();
    for (const { cell } of neighbors(r, width, height)) {
      const ck = keyOf(cell);
      if (river.has(ck)) continue;
      const id = compId.get(ck);
      if (id !== undefined) comps.add(id);
    }

    if (comps.size >= 2) candidates.push(rk);
  }

  // If we found none (river doesn't actually split land), relax: any straight segment is fine.
  if (candidates.length === 0) {
    const deg = computeDegrees(river, width, height);
    const relaxed: string[] = [];
    for (const rk of river) {
      const d = deg.get(rk) ?? 0;
      if (d === 2 && isStraightCell(rk, river)) relaxed.push(rk);
    }
    if (relaxed.length === 0) return null;
    return relaxed[rng.int(0, relaxed.length - 1)]!;
  }

  return candidates[rng.int(0, candidates.length - 1)]!;
}

function pickLandCellInSameComponent(args: {
  rng: ReturnType<typeof makeRng>;
  width: number;
  height: number;
  blocked: Set<string>;
  compId: Map<string, number>;
  wantComp: number;
  preferEdge: boolean;
}): BoardCell {
  const { rng, width, height, blocked, compId, wantComp, preferEdge } = args;

  // Try a bunch of random picks first.
  for (let i = 0; i < 200; i++) {
    const c = preferEdge ? randomEdgeCell(rng, width, height) : randomInteriorCell(rng, width, height);
    const k = keyOf(c);
    if (blocked.has(k)) continue;
    if (compId.get(k) === wantComp) return c;
  }

  // Fallback: scan
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const k = `${x},${y}`;
      if (blocked.has(k)) continue;
      if (compId.get(k) === wantComp) return { x, y };
    }
  }

  // should never happen unless comp is empty
  return { x: 0, y: 0 };
}

export function generateTerrainNetworks(args: {
  width: number;
  height: number;
  seed: number;
  roadDensity: number;
  riverDensity: number;
  maxBridges?: number;
}): { road: BoardCell[]; river: BoardCell[]; nextSeed: number } {
  const rng = makeRng(args.seed);

  // Rivers first: trunk + tributaries (vein-ish).
  const riverSet = generateRiverCells({
    rng,
    width: args.width,
    height: args.height,
    density: args.riverDensity,
  });

  // Roads second: arterials → collectors → locals, with rare bridges.
  const roadSet = generateRoadCells({
    rng,
    width: args.width,
    height: args.height,
    density: args.roadDensity,
    river: riverSet,
    maxBridges: args.maxBridges,
  });

  const river = Array.from(riverSet).map((k) => parseKey(k));
  const road = Array.from(roadSet).map((k) => parseKey(k));

  return { road, river, nextSeed: rng.seed() };
}

function pruneDeadArmsAtIntersections(
    road: Set<string>,
    width: number,
    height: number
) {
  const deg = computeDegrees(road, width, height);
  const toRemove = new Set<string>();

  for (const [k, d] of deg.entries()) {
    if (d !== 1) continue;
    const c = parseKey(k);
    const neighbor = neighbors(c, width, height).find((n) => road.has(keyOf(n.cell)));
    if (!neighbor) continue;
    const neighborKey = keyOf(neighbor.cell);
    const neighborDeg = deg.get(neighborKey) ?? 0;

    if (neighborDeg >= 3) {
      toRemove.add(k);
      continue;
    }

    if (neighborDeg === 1) {
      toRemove.add(k);
      toRemove.add(neighborKey);
    }
  }

  for (const k of toRemove) road.delete(k);
  return road;
}

function riverZigZagPenalty(
    prevDir: Dir | null,
    dir: Dir,
    runLength: number
) {
  // Encourage direction change after a short run
  if (!prevDir) return 0;

  if (dir.key === prevDir.key) {
    // staying straight too long is bad
    if (runLength >= 2) return 1.6;
    if (runLength >= 4) return 3.0;
  } else {
    // reward a bend
    return -0.6;
  }

  return 0;
}
