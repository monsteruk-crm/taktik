import type { Cell, Edge, NetworkConnectors } from "@/types/networks";

export type { Cell, Edge, NetworkConnectors } from "@/types/networks";

const ORDER: Edge[] = ["N", "E", "S", "W"];

export function edgeKey(edges?: Edge[]): string | null {
  if (!edges || edges.length === 0) return null;
  const set = new Set(edges);
  return ORDER.filter((e) => set.has(e)).join("");
}

function keyOf(x: number, y: number) {
  return `${x},${y}`;
}

export function deriveEdges(cells: Cell[]): Map<string, Edge[]> {
  const set = new Set(cells.map((c) => keyOf(c.x, c.y)));
  const out = new Map<string, Edge[]>();

  for (const c of cells) {
    const edges: Edge[] = [];
    if (set.has(keyOf(c.x, c.y - 1))) edges.push("N");
    if (set.has(keyOf(c.x + 1, c.y))) edges.push("E");
    if (set.has(keyOf(c.x, c.y + 1))) edges.push("S");
    if (set.has(keyOf(c.x - 1, c.y))) edges.push("W");
    out.set(keyOf(c.x, c.y), edges);
  }
  return out;
}

export function mergeNetworks(args: {
  road?: Cell[];
  river?: Cell[];
}): Map<string, NetworkConnectors> {
  const roadEdges = args.road ? deriveEdges(args.road) : null;
  const riverEdges = args.river ? deriveEdges(args.river) : null;

  const allKeys = new Set<string>();
  roadEdges?.forEach((_, k) => allKeys.add(k));
  riverEdges?.forEach((_, k) => allKeys.add(k));

  const out = new Map<string, NetworkConnectors>();
  for (const k of allKeys) {
    const road = roadEdges?.get(k);
    const river = riverEdges?.get(k);
    out.set(k, {
      ...(road && road.length ? { road } : {}),
      ...(river && river.length ? { river } : {}),
    });
  }
  return out;
}

export const DEMO_NETWORKS = {
  road: [
    // Main east-west artery
    { x: 2, y: 6 },
    { x: 3, y: 6 },
    { x: 4, y: 6 },
    { x: 5, y: 6 },
    { x: 6, y: 6 },
    { x: 7, y: 6 },
    { x: 8, y: 6 },
    { x: 9, y: 6 },
    { x: 10, y: 6 },
    { x: 11, y: 6 },
    // North-south spine (creates cross at x=6,y=6)
    { x: 6, y: 3 },
    { x: 6, y: 4 },
    { x: 6, y: 5 },
    { x: 6, y: 7 },
    { x: 6, y: 8 },
    { x: 6, y: 9 },
    { x: 6, y: 10 },
    // T-junction branch to the southeast
    { x: 8, y: 7 },
    { x: 9, y: 7 },
    { x: 10, y: 7 },
    { x: 11, y: 7 },
    // Short northern spur
    { x: 4, y: 4 },
    { x: 4, y: 5 },
  ],
  river: [
    // Upper reach
    { x: 12, y: 2 },
    { x: 12, y: 3 },
    { x: 12, y: 4 },
    // Bend westward
    { x: 11, y: 4 },
    { x: 10, y: 4 },
    { x: 9, y: 4 },
    { x: 8, y: 4 },
    // Bend southward
    { x: 8, y: 5 },
    { x: 8, y: 6 },
    { x: 8, y: 7 },
    // Split to form a T junction
    { x: 7, y: 7 },
    { x: 9, y: 7 },
    // Southern reach
    { x: 8, y: 8 },
    { x: 8, y: 9 },
  ],
};
