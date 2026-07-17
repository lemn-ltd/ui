# LEMN UI Showcase Admin

Access-protected administrative sandbox for provider provenance, conformance,
proposal generation, and ephemeral Brand Studio experiments. The active
provider manifest remains Git-owned; this Worker can only generate a proposal
bundle. Brand Studio is controlled and persistence-free; AgentOps owns durable
Workspace branding, publication, activation, previews, and audit.

The production Worker fails closed unless Cloudflare Access provides both
`Cf-Access-Authenticated-User-Email` and `Cf-Access-Jwt-Assertion`.
