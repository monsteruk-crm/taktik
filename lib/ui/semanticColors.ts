export const semanticColors = {
  ink: "#1B1B1B",
  ink2: "#2A2A2A",
  surface: "#E6E6E2",
  surface2: "#EFEFEA",
  panel: "#DEDED8",
  panel2: "#D2D2CB",
  playerA: "#1F4E79",
  playerB: "#C1121F",
  move: "#1F4E79",
  attack: "#C1121F",
  dice: "#F2B705",
  confirm: "#1B1B1B",
  cancel: "#D2D2CB",
  focus: "#EFE5C7",
  danger: "#E9D0D0",
  info: "#D9E4EF",
  success: "#D7E7D4",
  neutralStripe: "#8A8F94",
};

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
