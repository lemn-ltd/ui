import uiPackageManifest from "../../../../../../packages/ui/package.json" with {
	type: "json",
};

const EXACT_PACKAGE_VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u;

if (!EXACT_PACKAGE_VERSION_PATTERN.test(uiPackageManifest.version)) {
	throw new Error(
		`@lemn-ltd/ui must expose an exact package version, received ${uiPackageManifest.version}.`,
	);
}

/** Release-aware install command. Changesets updates the source manifest before Portal builds. */
export const UI_PACKAGE_INSTALL_COMMAND = `pnpm add @lemn-ltd/ui@${uiPackageManifest.version}`;
