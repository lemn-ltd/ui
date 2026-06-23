import { faker } from '@faker-js/faker';

/**
 * The single fixed clock every fixture anchors to. Relative-time and timestamp
 * fixtures derive from this constant, never from `Date.now()`/`new Date()`, so
 * Lane B visual baselines stay byte-identical across runs.
 */
export const NOW = new Date('2026-06-01T12:00:00.000Z');

/**
 * Re-seeds the shared faker instance and pins its reference date. Every
 * generator module calls this at the top of its module body before generating,
 * so output is identical regardless of import order.
 */
export function resetSeed(): void {
  faker.seed(1);
  faker.setDefaultRefDate('2026-06-01T12:00:00.000Z');
}

resetSeed();

export { faker };
