export function rollDie(seed: number): { result: number; nextSeed: number } {
  const nextSeed = (seed * 1664525 + 1013904223) >>> 0;
  const result = (nextSeed % 6) + 1;
  return { result, nextSeed };
}
