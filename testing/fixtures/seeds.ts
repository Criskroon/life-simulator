/**
 * Fixed seeds for reproducible test runs. Tests should pin one of these
 * (or accept --seed=N on the CLI) so failures are debuggable.
 */
export const SEEDS = {
  default: 42,
  smoke: 1337,
  playthrough: 42,
  balance: 7,
  regression: 99,
} as const;

export type SeedKey = keyof typeof SEEDS;
