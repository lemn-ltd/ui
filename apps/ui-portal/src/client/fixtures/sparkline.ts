import { faker, resetSeed } from './faker-seed.js';

resetSeed();

const HOURLY_POINT_COUNT = 24;

/** 24 hourly data points for the sparkline demo. */
export const sparklinePoints: readonly number[] = Array.from({ length: HOURLY_POINT_COUNT }, () =>
  faker.number.int({ min: 4, max: 96 }),
);
