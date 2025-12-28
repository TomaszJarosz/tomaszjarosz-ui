# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Purpose

**@tomaszjarosz/ui** is a React component library for the blog platform. Published as npm packages.

## Monorepo Structure

```
tomaszjarosz-ui/
├── packages/
│   ├── react-ui/           # UI components, hooks, animations
│   ├── react-visualizers/  # Algorithm & data structure visualizers
│   ├── react-markdown/     # Code blocks, callouts, diagrams
│   └── react-article/      # Reading progress, TOC, bookmarks
└── apps/                   # Test/demo apps
```

## Essential Commands

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Build specific package
bun run build --filter=@tomaszjarosz/react-visualizers

# Run Storybook (visualizers)
cd packages/react-visualizers && npm run storybook

# Typecheck
bun run typecheck

# Publish (from package directory)
npm publish --access public
```

## Tech Stack

- React 17+/18+/19
- TypeScript
- Tailwind CSS (peer dependency)
- Turborepo (monorepo management)
- Storybook (component development)

## Package Details

| Package | Purpose |
|---------|---------|
| `react-ui` | Base UI components, useVisualizerPlayback hook |
| `react-visualizers` | Interactive algorithm visualizers for blog articles |
| `react-markdown` | Syntax highlighting, callouts, mermaid diagrams |
| `react-article` | Reading progress bar, table of contents |

## Development Notes

1. **Peer dependencies** - React and Tailwind are peer deps, not bundled
2. **Visualizers** - Use Storybook at localhost:6006 for development
3. **Publishing** - Each package is published independently to npm
4. **Blog integration** - Blog imports these packages via npm
