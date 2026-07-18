# Pattern System

This file defines how agents apply the pattern catalog in `patterns/patterns.md`.

## Concepts

### Pattern

A `PAT-*` rule in `patterns/patterns.md`.

### Domain

A broad area of responsibility such as `ARCH`, `CODE`, `DATA`, `API`, `UI`, `ASYNC`, `SEC`, `AUTH`, `TEST`, or `OBS`.

### Category

A narrower classification inside a domain, such as `POSTGRES`, `MIGRATIONS`, `OPENAPI`, `DESIGN_SYSTEM`, or `TRACE_CONTEXT`.

### Precedence Level

`precedence_level` indicates the position of a pattern inside the prerequisite chain of its domain.

Lower-level patterns must be evaluated first because they establish the decisions, boundaries, or guarantees required for higher-level patterns to be valid.

A higher-level pattern cannot be considered complete if a lower-level dependency has an unresolved gap, blocker, or exception.

Levels:

1. Authority: source of truth, ownership, base decisions, strict prohibitions.
2. Structure: boundaries, placement, runtime access, contracts, module or resource shape.
3. Behavioral Guarantees: validation, transactions, permissions, errors, idempotency, tests.
4. Operations: deploy, lifecycle, observability, audit, smoke evidence, compatibility.
5. Specialized Capabilities: analytics, durable workflows, sandbox, AI, artifacts, advanced primitives.

### Dependencies

`depends_on` declares required predecessor patterns.

A pattern can be marked complete only when every dependency is:

- complete
- not applicable
- exceptioned with reason and owner
- blocked with reason and owner

### Applicability

`applies_when` defines when a pattern is in scope.

A pattern is applicable when:

- its domain appears in `pattern_profile`
- its `precedence_level` is less than or equal to the domain `target_level`
- at least one `applies_when` condition matches the project inventory
- all dependency rules have been evaluated

### Pattern Profile

`pattern_profile` lives in `patterns/pattern-profile.md` and declares which domains the project must satisfy and up to what `target_level`.

If a domain is absent from `pattern_profile`, it is out of scope unless pulled in by an applicable dependency.

### Target Level

`target_level` is the maximum required precedence level for a domain in this project.

### Current Level

`current_level` is never manually declared. It is calculated by audit.

A domain `current_level` is the highest continuous level where all applicable patterns are complete, not applicable, exceptioned, or blocked with owner.

If level 1 has an unresolved gap, the domain `current_level` is 0.

### Gap

A missing or incomplete requirement for an applicable pattern.

### Blocker

A gap that prevents safe progress and requires a decision, credential, dependency, external access, or product clarification.

### Exception

An intentional non-compliance with owner, reason, risk, and deletion or review condition.

## Physical Order

The physical order of `patterns/patterns.md` must be:

1. domain
2. `precedence_level`
3. dependencies inside the same domain

When adding or editing a pattern, keep it in the domain group first, then place it at the correct `precedence_level`, then ensure any same-domain dependencies appear before the pattern that depends on them. Do not append new patterns to the end of the file unless that is the correct position by this order.

## Precedence Chain

The precedence chain is formed by domain, then `precedence_level`, then `depends_on`.

`category` is not an ordering primitive. Use `category` to group audit assignments and evidence, especially when splitting a domain audit across multiple agents.

When a project requires a domain at a `target_level`, agents must evaluate every applicable pattern in that domain with `precedence_level <= target_level`. If one of those patterns depends on a pattern from another domain, evaluate that dependency before marking the dependent pattern complete.

## Audit Rules

Agents must use:

- `patterns/pattern-profile.md` for required domains and target levels.
- `patterns/pattern-audit.md` for current audit state, statuses, gaps, blockers, exceptions, and audit run index.

When auditing a project:

1. Build or refresh the project inventory.
2. Confirm which domains appear in `patterns/pattern-profile.md`.
3. Evaluate patterns up to each domain `target_level`.
4. Use `applies_when` to filter irrelevant patterns.
5. Evaluate every `depends_on` relationship before marking a pattern complete.
6. Calculate each domain `current_level` from evidence.
7. Record gaps, blockers, and exceptions in `patterns/pattern-audit.md`.

## Audit Waves

For full-codebase pattern audits, apply `PAT-DOCS-PATTERN-AUDIT-001`.

Audit one domain at a time. Inside that domain, split work by `category`. When subagents are available, assign one subagent per category and cap each wave at 6 category agents by default. A domain with 11 categories therefore runs as 2 waves. Merge results back in precedence order before moving to the next domain.

If subagents are unavailable, run the same domain/category wave model sequentially in the main session.

## Agent Rule

Do not apply higher-level patterns before evaluating applicable lower-level patterns and dependencies.
