SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c

PNPM ?= pnpm

.PHONY: help install dev dev-docs validate-agentops validate-identity validate-package-identity validate-brand-neutrality validate-boundaries validate-release-preconditions validate check test test-e2e-ui-showcase test-e2e-ui-showcase-shard build pack-ui release-preflight clean

help:
	@printf 'Useful targets:\n'
	@printf '  make install                  Install workspace dependencies with the lockfile frozen.\n'
	@printf '  make dev                      Restart the local UI Showcase at http://localhost:6500.\n'
	@printf '  make dev-docs                 Start the local docs site at http://localhost:6600.\n'
	@printf '  make validate-agentops        Verify the managed-file lock and local checksums.\n'
	@printf '  make validate-identity        Verify workspace scopes, docs identity, and legacy-name removal.\n'
	@printf '  make validate-package-identity Verify the canonical package and registry contract.\n'
	@printf '  make validate-brand-neutrality Scan shared UI and showcase source for product-specific names.\n'
	@printf '  make validate-boundaries      Scan @lemn-ltd/ui runtime imports for boundary violations.\n'
	@printf '  make validate-release-preconditions Validate static release contracts and production DNS.\n'
	@printf '  make validate                 Run all repository validation scripts, including release metadata.\n'
	@printf '  make check                    Typecheck all workspace packages.\n'
	@printf '  make test                     Run all workspace test suites.\n'
	@printf '  make test-e2e-ui-showcase     Run the complete isolated Playwright showcase suite.\n'
	@printf '  make build                    Build all workspace packages and the showcase.\n'
	@printf '  make pack-ui                  Pack and smoke-test @lemn-ltd/ui with a clean npm consumer.\n'
	@printf '  make release-preflight        Run validation, check, test, build, and package smoke.\n'
	@printf '  make clean                    Remove generated local build/test artifacts.\n'

install:
	$(PNPM) install --frozen-lockfile

dev:
	$(PNPM) kill:showcase
	$(PNPM) dev:showcase

dev-docs:
	$(PNPM) dev:docs

validate-agentops:
	$(PNPM) validate:agentops

validate-identity:
	$(PNPM) validate:identity

validate-package-identity:
	$(PNPM) validate:package-identity

validate-brand-neutrality:
	$(PNPM) validate:brand-neutrality

validate-boundaries:
	$(PNPM) validate:boundaries

validate-release-preconditions:
	$(PNPM) validate:release-preconditions

validate:
	$(PNPM) validate

check:
	$(PNPM) check

test:
	$(PNPM) test

test-e2e-ui-showcase:
	$(PNPM) --filter @lemn-ltd/ui-showcase run test:e2e

test-e2e-ui-showcase-shard:
	@test -n "$(SHARD)" || { printf 'SHARD is required (for example, 1/3).\n' >&2; exit 2; }
	$(PNPM) --filter @lemn-ltd/ui-showcase exec playwright test --shard=$(SHARD)

build:
	$(PNPM) build

pack-ui:
	$(PNPM) pack:ui

release-preflight: validate-release-preconditions check test build pack-ui

clean:
	rm -rf .turbo coverage playwright-report test-results
	rm -rf apps/showcase/dist packages/showcase-kit/dist packages/ui/dist
