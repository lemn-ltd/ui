import { describe, expect, it } from 'vitest';
import { formatUsdMicros, usdMicros } from '../currency.js';

describe('USD micros formatting', () => {
  it('normalizes every current runtime cost encoding to integer micros', () => {
    expect(usdMicros({ amountMicros: '100' })).toBe('100');
    expect(usdMicros({ costUsdMicro: 25 })).toBe('25');
    expect(usdMicros({ costMicrosUsd: '40' })).toBe('40');
  });

  it('formats micros as cents with exact integer rounding', () => {
    expect(formatUsdMicros({ amountMicros: '1250000' })).toBe('$1.25');
    expect(formatUsdMicros({ costUsdMicro: 25 })).toBe('$0.00');
    expect(formatUsdMicros({ costUsdMicro: 4_999 })).toBe('$0.00');
    expect(formatUsdMicros({ costUsdMicro: 5_000 })).toBe('$0.01');
    expect(formatUsdMicros({ costUsdMicro: 12_500 })).toBe('$0.01');
    expect(formatUsdMicros({ costUsdMicro: 15_000 })).toBe('$0.02');
    expect(formatUsdMicros({ costUsdMicro: 1_255_000 })).toBe('$1.26');
    expect(formatUsdMicros({ costMicrosUsd: '2000000' })).toBe('$2.00');
  });

  it('returns zero for absent, negative, or non-integer costs', () => {
    expect(usdMicros(undefined)).toBe('0');
    expect(usdMicros(-1)).toBe('0');
    expect(usdMicros({ costMicrosUsd: '1.5' })).toBe('0');
    expect(formatUsdMicros({ amountMicros: '-1' })).toBe('$0.00');
  });
});
