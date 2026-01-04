# ============================================================================
# tomaszjarosz-ui - Makefile
# ============================================================================
# React UI components monorepo (bun + turbo)

# Colors
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
RED := \033[0;31m
NC := \033[0m

# Helpers
define print_header
	@echo ""
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(BLUE)  $(1)$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
endef

define print_success
	@echo "$(GREEN)✓ $(1)$(NC)"
endef

define print_info
	@echo "$(YELLOW)→ $(1)$(NC)"
endef

# ============================================================================
# Help
# ============================================================================

.PHONY: help
help:
	@echo ""
	@echo "$(BLUE)tomaszjarosz-ui$(NC) - React UI Components Monorepo"
	@echo ""
	@echo "$(YELLOW)Development:$(NC)"
	@echo "  make dev              - Start development (all packages)"
	@echo "  make build            - Build all packages"
	@echo "  make test             - Run tests"
	@echo "  make typecheck        - Type check all packages"
	@echo ""
	@echo "$(YELLOW)Code Quality:$(NC)"
	@echo "  make lint             - Run linter"
	@echo "  make format           - Format code with prettier"
	@echo "  make check            - Run lint + typecheck + test"
	@echo ""
	@echo "$(YELLOW)Publishing:$(NC)"
	@echo "  make changeset        - Create changeset"
	@echo "  make version          - Version packages"
	@echo "  make release          - Build and publish to npm"
	@echo ""
	@echo "$(YELLOW)Utilities:$(NC)"
	@echo "  make install          - Install dependencies"
	@echo "  make clean            - Clean build artifacts"
	@echo "  make status           - Show packages status"
	@echo ""

.DEFAULT_GOAL := help

# ============================================================================
# Development
# ============================================================================

.PHONY: dev
dev:
	$(call print_header,Starting Development)
	bun run dev

.PHONY: build
build:
	$(call print_header,Building All Packages)
	bun run build
	$(call print_success,Build complete)

.PHONY: test
test:
	$(call print_header,Running Tests)
	bun run test

.PHONY: typecheck
typecheck:
	$(call print_header,Type Checking)
	bun run typecheck

.PHONY: install
install:
	$(call print_header,Installing Dependencies)
	bun install
	$(call print_success,Dependencies installed)

# ============================================================================
# Code Quality
# ============================================================================

.PHONY: lint
lint:
	$(call print_header,Running Linter)
	bun run lint

.PHONY: format
format:
	$(call print_header,Formatting Code)
	bun run format
	$(call print_success,Code formatted)

.PHONY: check
check: lint typecheck test
	$(call print_success,All checks passed)

# ============================================================================
# Publishing
# ============================================================================

.PHONY: changeset
changeset:
	$(call print_header,Creating Changeset)
	bun run changeset

.PHONY: version
version:
	$(call print_header,Versioning Packages)
	bun run version-packages

.PHONY: release
release:
	$(call print_header,Publishing to npm)
	bun run release
	$(call print_success,Published to npm)

# ============================================================================
# Utilities
# ============================================================================

.PHONY: clean
clean:
	$(call print_header,Cleaning Build Artifacts)
	bun run clean
	$(call print_success,Clean complete)

.PHONY: status
status:
	$(call print_header,Packages Status)
	@echo "$(YELLOW)Packages:$(NC)"
	@ls -1 packages/
	@echo ""
	@echo "$(YELLOW)Turbo cache:$(NC)"
	@du -sh .turbo 2>/dev/null || echo "No cache"
