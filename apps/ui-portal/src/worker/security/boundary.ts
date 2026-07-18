const PERCENT_ENCODED_BYTE = /%([0-9a-f]{2})/giu;
const MAX_SECURITY_PATH_DECODINGS = 4;

function canonicalAdminBoundary(pathname: string): boolean {
	return (
		pathname === "/admin" ||
		pathname.startsWith("/admin/") ||
		pathname === "/api/admin" ||
		pathname.startsWith("/api/admin/") ||
		pathname === "/admin-assets" ||
		pathname.startsWith("/admin-assets/")
	);
}

function decodeSecurityPathOnce(pathname: string): string {
	return pathname
		.replace(PERCENT_ENCODED_BYTE, (_match, byte: string) =>
			String.fromCharCode(Number.parseInt(byte, 16)),
		)
		.replaceAll("\\", "/");
}

export function isAdminBoundary(pathname: string): boolean {
	let candidate = pathname.replaceAll("\\", "/");
	for (let pass = 0; pass <= MAX_SECURITY_PATH_DECODINGS; pass += 1) {
		if (canonicalAdminBoundary(candidate)) return true;
		const decoded = decodeSecurityPathOnce(candidate);
		if (decoded === candidate) return false;
		candidate = decoded;
	}
	// Deeply nested encodings are never a valid public asset path. Route them
	// through the protected boundary rather than risk a downstream decode gap.
	return true;
}
