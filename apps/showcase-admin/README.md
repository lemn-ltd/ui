# LEMN UI Showcase Admin

Access-protected administrative sandbox for provider provenance, conformance,
proposal generation, and ephemeral Brand Studio experiments. The active
provider manifest remains Git-owned; this Worker can only generate a proposal
bundle. Persistent BrandProject actions are delegated to the AgentOps branding
simulator through a configured Service Binding.

The production Worker fails closed unless Cloudflare Access provides both
`Cf-Access-Authenticated-User-Email` and `Cf-Access-Jwt-Assertion`.
