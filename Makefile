SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c

PNPM ?= pnpm

.PHONY: help install dev dev-docs validate validate-quick validate-quick-fix validate-standard validate-full pipeline-local pipeline-visual-local hooks-install check test test-e2e-ui-portal test-e2e-ui-portal-shard build pack-packages release-preflight clean

help:
	@printf 'Useful targets:\n'
	@printf '  make install                  Install workspace dependencies with the lockfile frozen.\n'
	@printf '  make dev                      Restart the local UI Portal at http://localhost:6500.\n'
	@printf '  make dev-docs                 Start the local docs site at http://localhost:6600.\n'
	@printf '  make validate-quick           Validate only the uncommitted delta (pre-commit).\n'
	@printf '  make validate-standard        Run the deterministic local CI profile.\n'
	@printf '  make validate-full            Add complete browser and Worker dry-run coverage.\n'
	@printf '  make pipeline-local           Simulate every non-mutating GitHub release gate locally.\n'
	@printf '  make pipeline-visual-local    Regenerate governed Linux visual baselines explicitly.\n'
	@printf '  make hooks-install            Install the tracked pre-commit and pre-push hooks.\n'
	@printf '  make check                    Typecheck all workspace packages.\n'
	@printf '  make test                     Run all workspace test suites.\n'
	@printf '  make test-e2e-ui-portal      Run the complete isolated Playwright Portal suite.\n'
	@printf '  make build                    Build all workspace packages and the portal.\n'
	@printf '  make pack-packages            Pack and smoke-test the exact release package set with a clean npm consumer.\n'
	@printf '  make release-preflight        Run validation, check, test, build, and package smoke.\n'
	@printf '  make clean                    Remove generated local build/test artifacts.\n'

install:
	$(PNPM) install --frozen-lockfile

dev:
	$(PNPM) kill:portal
	$(PNPM) dev:portal

dev-docs:
	$(PNPM) dev:docs

validate:
	$(PNPM) validate:standard

validate-quick:
	$(PNPM) validate:quick

validate-quick-fix:
	$(PNPM) validate:quick:fix

validate-standard:
	$(PNPM) validate:standard

validate-full:
	$(PNPM) validate:full

pipeline-local:
	$(PNPM) pipeline:local

pipeline-visual-local:
	$(PNPM) pipeline:visual:local

hooks-install:
	$(PNPM) hooks:install

check:
	$(PNPM) check

test:
	$(PNPM) test

test-e2e-ui-portal:
	$(PNPM) --filter @lemn-ltd/ui-portal run test:e2e

test-e2e-ui-portal-shard:
	@test -n "$(SHARD)" || { printf 'SHARD is required (for example, 1/3).\n' >&2; exit 2; }
	$(PNPM) --filter @lemn-ltd/ui-portal exec playwright test --shard=$(SHARD)

build:
	$(PNPM) build

pack-packages:
	$(PNPM) pack:packages

release-preflight: validate-release-preconditions check test build pack-packages

clean:
	rm -rf .turbo coverage playwright-report test-results
	rm -rf apps/ui-portal/dist packages/brand-contract/dist packages/ui/dist packages/brand-studio/dist
