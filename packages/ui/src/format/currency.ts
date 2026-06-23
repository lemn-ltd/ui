export type UsdMicrosInput =
  | bigint
  | number
  | string
  | {
      readonly amountMicros?: bigint | number | string | null;
      readonly costMicrosUsd?: bigint | number | string | null;
      readonly costUsdMicro?: bigint | number | string | null;
    };

export function usdMicros(input: UsdMicrosInput | null | undefined): string {
  const value = microsValue(input);
  if (value === null || value === undefined) return '0';
  if (typeof value === 'bigint') return nonNegative(value).toString();
  if (typeof value === 'number') return nonNegative(BigInt(Math.trunc(value))).toString();
  const trimmed = value.trim();
  if (!/^(0|[1-9][0-9]*)$/u.test(trimmed)) return '0';
  return trimmed;
}

export function formatUsdMicros(value: UsdMicrosInput | null | undefined): string {
  const micros = BigInt(usdMicros(value));
  const roundedCents = (micros + 5_000n) / 10_000n;
  const dollars = roundedCents / 100n;
  const cents = roundedCents % 100n;
  return `$${dollars.toString()}.${cents.toString().padStart(2, '0')}`;
}

function microsValue(input: UsdMicrosInput | null | undefined) {
  if (input === null || input === undefined) return null;
  if (typeof input !== 'object') return input;
  return input.amountMicros ?? input.costUsdMicro ?? input.costMicrosUsd ?? null;
}

function nonNegative(value: bigint): bigint {
  return value < 0n ? 0n : value;
}
