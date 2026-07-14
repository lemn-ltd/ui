SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c

PNPM ?= pnpm

.PHONY: help install dev dev-docs validate-identity validate-brand-neutrality validate-boundaries validate check test build pack-ui release-preflight clean

help:
	@printf 'Useful targets:\n'
	@printf '  make install                  Install workspace dependencies with the lockfile frozen.\n'
	@printf '  make dev                      Restart the local UI Showcase at http://localhost:6500.\n'
	@printf '  make dev-docs                 Start the local docs site at http://localhost:6600.\n'
	@printf '  make validate-identity        Verify package scopes, docs identity, and legacy-name removal.\n'
	@printf '  make validate-brand-neutrality Scan shared UI and showcase source for product-specific names.\n'
	@printf '  make validate-boundaries      Scan @lemn-ltd/ui runtime imports for boundary violations.\n'
	@printf '  make validate                 Run all repository validation scripts, including release metadata.\n'
	@printf '  make check                    Typecheck all workspace packages.\n'
	@printf '  make test                     Run all workspace test suites.\n'
	@printf '  make build                    Build all workspace packages and the showcase.\n'
	@printf '  make pack-ui                  Dry-run the @lemn-ltd/ui package contents.\n'
	@printf '  make release-preflight        Run validation, check, test, build, and package dry-run.\n'
	@printf '  make clean                    Remove generated local build/test artifacts.\n'

install:
	$(PNPM) install --frozen-lockfile

dev:
	$(PNPM) kill:showcase
	$(PNPM) dev:showcase

dev-docs:
	$(PNPM) dev:docs

validate-identity:
	$(PNPM) validate:identity

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
	@npm pack --dry-run --json ./packages/ui | node -e 'let input = ""; process.stdin.on("data", (chunk) => { input += chunk; }); process.stdin.on("end", () => { const pkg = JSON.parse(input)[0]; const css = pkg.files.filter((file) => file.path.endsWith(".css")).length; const src = pkg.files.filter((file) => file.path.startsWith("src/")).length; console.log(JSON.stringify({ id: pkg.id, entryCount: pkg.entryCount, css, src }, null, 2)); });'

release-preflight: validate check test build pack-ui

clean:
	rm -rf .turbo coverage playwright-report test-results
	rm -rf apps/showcase/dist packages/showcase-kit/dist packages/ui/dist
