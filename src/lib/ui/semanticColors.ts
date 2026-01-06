export const semanticColors = {

  // Core UI neutrals
  ink: "#1B1B1B",
  ink2: "#2A2A2A",
  surface: "#E6E6E2",
  surface2: "#EFEFEA",
  panel: "#DEDED8",
  panel2: "#D2D2CB",
  // Factions / phases

  playerA: "#1F4E79",
  playerB: "#C1121F",
  move: "#1F4E79",
  attack: "#C1121F",
  dice: "#F2B705",
  // UI semantics

  confirm: "#1B1B1B",
  cancel: "#D2D2CB",
  focus: "#EFE5C7",
  danger: "#E9D0D0",
  info: "#D9E4EF",
  success: "#D7E7D4",

  // Utility / pattern
  neutralStripe: "#8A8F94",

  // ─────────────────────────────────────────────────────────────
  // Taktik 3D / tokens + terrain (NEW)
  // Use these for flat materials in OBJ/GLTF and for consistent look
  // ─────────────────────────────────────────────────────────────

  // Units (3D tokens)
  unitBase: "#D2D2CB",       // usually the slab
  unitBody: "#DEDED8",       // main mass
  unitBody2: "#EFEFEA",      // optional secondary mass / highlight block
  unitMark: "#1B1B1B",       // optional tiny “ink” block (rare, if needed)

  // Terrain (3D tiles / props)
  terrainBase: "#D2D2CB",    // footprint slab / ground plate
  terrainMass: "#DEDED8",    // primary building mass
  terrainMass2: "#E6E6E2",   // secondary mass / stepped plate
  terrainEdge: "#8A8F94",    // thin accent/trim plate (neutral, not faction)

  // Optional: networks if you later do roads/rivers as terrain props
  road: "#8A8F94",
  river: "#D9E4EF",

};

// Terrain debug palette (used for dev-only biome visualization).
// Intentionally stored in semantic colors so it stays consistent across UI surfaces.
export const terrainDebugColors = {
  PLAIN: "#D6D3C9",
  ROUGH: "#A19D90",
  FOREST: "#5E7B55",
  URBAN: "#7E7A7A",
  INDUSTRIAL: "#6A6161",
  HILL: "#B0A184",
  WATER: "#8DA9C4",
} as const;

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return { r, g, b };
}

export function textOn(background: string) {
  if (background.toLowerCase() === semanticColors.dice.toLowerCase()) {
    return semanticColors.ink;
  }
  const { r, g, b } = hexToRgb(background);
  const srgb = [r, g, b].map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  return luminance > 0.45 ? semanticColors.ink : semanticColors.surface;
}
