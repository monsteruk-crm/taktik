const PHASE_MAP: Array<[RegExp, string]> = [
  [/TURN/, "TURN"],
  [/DRAW/, "DRAW"],
  [/MOVE/, "MOVE"],
  [/ATTACK/, "ATK"],
  [/DICE/, "DICE"],
  [/END/, "END"],
  [/VICT/, "END"],
];

const KEY_MAP: Record<string, string> = {
  "DRAW CARD": "DRAW",
  "NEXT PHASE": "NEXT",
  "ROLL DICE": "DICE",
  "RESOLVE ATTACK": "RESOLVE",
  "CLEAR SELECTION": "CLEAR",
  "TURN START": "START",
  "END TURN": "END",
};

export function shortPhase(phase: string): string {
  const normalized = phase.toUpperCase();
  for (const [pattern, label] of PHASE_MAP) {
    if (pattern.test(normalized)) {
      return label;
    }
  }
  if (normalized.length <= 6) {
    return normalized;
  }
  return normalized.slice(0, 6);
}

export function shortKey(label: string): string {
  const normalized = label.toUpperCase();
  return KEY_MAP[normalized] ?? (normalized.length <= 6 ? normalized : normalized.slice(0, 6));
}

export function shortUnit(value: string): string {
  const normalized = value.toUpperCase();
  if (normalized === "NONE") {
    return normalized;
  }
  if (value.length <= 10) {
    return value;
  }
  return `${value.slice(0, 6)}...`;
}
