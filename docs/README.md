# Appranks UI Docs

This folder contains architecture notes, frontend decisions, and cross-project
patterns for `@appranks/ui`, the showcase, and applications that consume the
system.

## Documents

- [Frontend Performance On Cloudflare Workers](./frontend-performance/README.md)

## Structure

```text
docs/
  README.md
  frontend-performance/
    README.md
    common-patterns.md
    react-vite-spa-worker-bff.md
    react-router-v7-fullstack.md
    astro-workers.md
    shared-packages.md
    sources.md
```

## General Rule

- Use **React + Vite SPA + Worker BFF** for dashboards, internal tools, and
  authenticated applications with high interaction.
- Use **React Router v7 full-stack** when routes need loaders, actions,
  server-aware mutations, and route-owned data control.
- Use **Astro + Workers** for documentation, marketing, public content, and sites
  where SEO and low JavaScript matter more than continuous interaction.
