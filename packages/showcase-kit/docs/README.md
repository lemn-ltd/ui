# @appranks/showcase-kit

`@appranks/showcase-kit` provides the shared browser-only harness for the canonical design-system showcase.

Public API:

- `ComponentPage`, `ExampleBlock`, `Controls`, `ControlRow`, `PropsTable`, and `VariantsGallery`.
- `ShowcaseEntry<TGroup>`, `ShowcaseArea`, `entryFromMeta`, `pathFor`, `groupBy`, and `buildNavGroups`.
- `buildShowcaseRouter` for standalone React Router based showcase apps.
- `@appranks/showcase-kit/styles.css` for harness chrome.

Boundary:

- `apps/showcase` owns pages, fixtures, registries, route mounting, and visual baselines.
- The kit owns generic page-authoring primitives only.
- The only workspace dependency is `@lemn-ltd/ui`.
