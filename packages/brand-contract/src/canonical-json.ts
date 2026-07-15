export type CanonicalJson = null | boolean | number | string | CanonicalJson[] | { readonly [key: string]: CanonicalJson };

export function canonicalJson(value: unknown): string {
  return serialize(value);
}

export async function sha256(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto SHA-256 is unavailable in this runtime");
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function serializeBootstrapJson(value: unknown): string {
  return canonicalJson(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function serialize(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Canonical JSON does not support non-finite numbers");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(serialize).join(",")}]`;
  if (typeof value === "object") {
    const object = value as Record<string, unknown>;
    const pairs = Object.keys(object)
      .filter((key) => object[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${serialize(object[key])}`);
    return `{${pairs.join(",")}}`;
  }
  throw new Error(`Canonical JSON does not support ${typeof value}`);
}
