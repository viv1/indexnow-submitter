# Makefile for IndexNow Submitter Module

# Variables
PACKAGE_NAME := indexnow-submitter
NODE := node
NPM := npm
TSC := ./node_modules/.bin/tsc
JEST := ./node_modules/.bin/jest

# Phony targets
.PHONY: all clean build test lint coverage publish-patch publish-minor publish-major

# Default target
all: build

# Clean build artifacts
clean:
	rm -rf dist

# Build the project
build: clean
	$(TSC)

# Run tests
test:
	$(JEST)

# Run linter
lint:
	$(NPM) run lint

# Generate test coverage
coverage:
	$(JEST) --coverage

# Publish a patch version
publish-patch: build test
	$(NPM) version patch
	$(NPM) publish
	git push --follow-tags

# Publish a minor version
publish-minor: build test
	$(NPM) version minor
	$(NPM) publish
	git push --follow-tags

# Publish a major version
publish-major: build test
	$(NPM) version major
	$(NPM) publish
	git push --follow-tags

# Install dependencies
install:
	$(NPM) install

# Update dependencies
update:
	$(NPM) update

# Start the development process
dev:
	$(NPM) run dev

# Generate documentation
docs:
	$(NPM) run docs

# Run the CLI tool (usage: make run ARGS="submit https://example.com")
run:
	$(NODE) dist/index.js $(ARGS)

# Help target
help:
	@echo "Available targets:"
	@echo "  all        - Default target (alias for build)"
	@echo "  clean      - Remove build artifacts"
	@echo "  build      - Build the project"
	@echo "  test       - Run tests"
	@echo "  lint       - Run linter"
	@echo "  coverage   - Generate test coverage"
	@echo "  publish-patch - Publish a patch version"
	@echo "  publish-minor - Publish a minor version"
	@echo "  publish-major - Publish a major version"
	@echo "  install    - Install dependencies"
	@echo "  update     - Update dependencies"
	@echo "  dev        - Start development process"
	@echo "  docs       - Generate documentation"
	@echo "  run        - Run the CLI tool (usage: make run ARGS='submit https://example.com')"
	@echo "  help       - Show this help message"