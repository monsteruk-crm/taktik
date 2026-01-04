export const initialTerrainParams = {
  roadDensity: 0.3,
  riverDensity: 0.2,
};

export function getInitialRngSeed(): number {
  const envSeed = process.env.NEXT_PUBLIC_RNG_SEED;
  if (envSeed) {
    const parsed = Number.parseInt(envSeed, 10);
    if (Number.isFinite(parsed)) {
      return parsed >>> 0;
    }
  }
  return 1;
}
