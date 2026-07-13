SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c

PNPM ?= pnpm

.PHONY: help install dev dev-docs validate-package-identity validate-brand-neutrality validate-boundaries validate check test build pack-ui release-preflight clean

help:
	@printf 'Useful targets:\n'
	@printf '  make install                  Install workspace dependencies with the lockfile frozen.\n'
	@printf '  make dev                      Restart the local UI Showcase at http://localhost:6500.\n'
	@printf '  make dev-docs                 Start the local docs site at http://localhost:6600.\n'
	@printf '  make validate-package-identity Verify the canonical package and registry contract.\n'
	@printf '  make validate-brand-neutrality Scan shared UI and showcase source for product-specific names.\n'
	@printf '  make validate-boundaries      Scan @lemn-ltd/ui runtime imports for boundary violations.\n'
	@printf '  make validate                 Run all repository validation scripts, including release metadata.\n'
	@printf '  make check                    Typecheck all workspace packages.\n'
	@printf '  make test                     Run all workspace test suites.\n'
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

validate-package-identity:
	$(PNPM) validate:package-identity

validate-brand-neutrality:
	$(PNPM) validate:brand-neutrality

validate-boundaries:
	$(PNPM) validate:boundaries

validate:
	$(PNPM) validate

check:
	$(PNPM) check

test:
	$(PNPM) test

build:
	$(PNPM) build

pack-ui:
	$(PNPM) pack:ui

release-preflight: validate check test build pack-ui

clean:
	rm -rf .turbo coverage playwright-report test-results
	rm -rf apps/showcase/dist packages/showcase-kit/dist packages/ui/dist
