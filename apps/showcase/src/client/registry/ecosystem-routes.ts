export const ECOSYSTEM_ROUTES = [
	{
		path: "/catalog",
		label: "Stable catalog",
		summary: "Supported LEMN capabilities and their interactive routes.",
	},
	{
		path: "/providers",
		label: "Providers",
		summary: "Provider-of-record provenance and exact upstream references.",
	},
	{
		path: "/blocks",
		label: "Blocks",
		summary: "Three curated, purpose-built compositions.",
	},
	{
		path: "/brand-studio",
		label: "Brand Studio",
		summary: "Ephemeral BrandProject authoring and compiled preview.",
	},
] as const;
