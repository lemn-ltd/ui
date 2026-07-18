# Frontend Performance On Cloudflare Workers

This folder defines professional frontend performance patterns for choosing
between:

1. React + Vite SPA + Worker BFF
2. React Router v7 full-stack
3. Astro + Workers

## Professional Area

This discipline is usually called **Web Performance Engineering** or
**Frontend Performance Engineering**.

When it also includes shared packages, architecture rules, CI, budgets,
observability, DX, and cross-project standards, it usually falls under
**Frontend Platform Engineering**.

## Quick Decision

| Need | Option |
| --- | --- |
| Interactive internal app | React + Vite SPA + Worker BFF |
| Authenticated dashboard | React + Vite SPA + Worker BFF |
| Routes with loaders/actions | React Router v7 full-stack |
| Mutations server-aware | React Router v7 full-stack |
| Public docs | Astro + Workers |
| Marketing | Astro + Workers |
| SEO content | Astro + Workers |
| Highly interactive component portal | React + Vite SPA |
| Mostly editorial component catalog | Astro |

## Index

- [Common patterns](./common-patterns.md)
- [React + Vite SPA + Worker BFF](./react-vite-spa-worker-bff.md)
- [React Router v7 full-stack](./react-router-v7-fullstack.md)
- [Astro + Workers](./astro-workers.md)
- [Shared packages](./shared-packages.md)
- [Technical sources](./sources.md)

## General Rule

Use **React + Vite SPA + Worker BFF** when the main question is: "how do we give
authenticated users a fast, rich experience?"

Use **React Router v7 full-stack** when the main question is: "how do we make
routes own their data, mutations, and pending states?"

Use **Astro + Workers** when the main question is: "how do we publish fast,
indexable content with the least JavaScript possible?"
