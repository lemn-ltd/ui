# Astro + Workers

## When To Use It

- Documentation.
- Marketing.
- Public portals.
- Indexable content.
- Mostly editorial catalogs.
- Sites where most content can be static HTML.

## Specific Patterns

- Render static HTML by default.
- Send minimal JavaScript to the client.
- Use islands only for specific interactive components.
- Hydrate islands as needed:
  - visible
  - idle
  - interaction-driven
- Avoid global React providers when there is only isolated interaction.
- Aggressively cache public content.
- Optimize above-the-fold images because they often dominate `LCP`.
- Use server islands or targeted SSR for dynamic content that should not block
  the whole page.
- Control external scripts:
  - analytics
  - embeds
  - widgets
  - chat
  - tracking
- Do not turn the whole site into an SPA inside Astro.

## Why It Improves Performance

- Astro removes client JavaScript by default.
- Islands hydrate only the interactive parts.
- Static HTML improves first load, cacheability, and SEO.
- The cost of interactivity stays localized.

## Risks

- If the app needs complex global state, Astro stops being the best option.
- Too many immediately hydrated islands can approach the cost of an SPA.
- Complex playgrounds or dashboards usually fit better in React + Vite.
