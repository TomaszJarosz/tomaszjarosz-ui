# Tomasz Jarosz UI

A collection of React UI components for building modern web applications.

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [@tomaszjarosz/react-visualizers](./packages/react-visualizers) | Interactive algorithm and data structure visualizers | [![npm](https://img.shields.io/npm/v/@tomaszjarosz/react-visualizers)](https://www.npmjs.com/package/@tomaszjarosz/react-visualizers) |
| [@tomaszjarosz/react-markdown](./packages/react-markdown) | Enhanced markdown components - code blocks, callouts, diagrams | [![npm](https://img.shields.io/npm/v/@tomaszjarosz/react-markdown)](https://www.npmjs.com/package/@tomaszjarosz/react-markdown) |
| [@tomaszjarosz/react-article](./packages/react-article) | Article reading components - TOC, bookmarks, keyboard navigation | [![npm](https://img.shields.io/npm/v/@tomaszjarosz/react-article)](https://www.npmjs.com/package/@tomaszjarosz/react-article) |

## Installation

```bash
# Choose the package you need
bun add @tomaszjarosz/react-visualizers
bun add @tomaszjarosz/react-markdown
bun add @tomaszjarosz/react-article

# Or with npm/pnpm
npm install @tomaszjarosz/react-visualizers
```

## Quick Start

### Visualizers

```tsx
import { SortingVisualizer } from '@tomaszjarosz/react-visualizers';

function App() {
  return <SortingVisualizer algorithm="quicksort" data={[5, 2, 8, 1, 9]} />;
}
```

### Markdown Components

```tsx
import { CodeBlock, Callout } from '@tomaszjarosz/react-markdown';

function Article() {
  return (
    <>
      <Callout type="warning">Important notice!</Callout>
      <CodeBlock language="typescript" code="const x = 1;" />
    </>
  );
}
```

### Article Components

```tsx
import { TableOfContents, useActiveSection } from '@tomaszjarosz/react-article';

function ArticlePage({ headings }) {
  const activeId = useActiveSection(headings);

  return (
    <aside>
      <TableOfContents headings={headings} activeId={activeId} />
    </aside>
  );
}
```

## Development

### Prerequisites

- Node.js >= 18
- [Bun](https://bun.sh) >= 1.0

### Setup

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Run in dev mode (watch)
bun run dev

# Type check
bun run typecheck

# Lint
bun run lint
```

### Project Structure

```
tomaszjarosz-ui/
├── packages/
│   ├── react-visualizers/    # Algorithm visualizers
│   ├── react-markdown/       # Markdown components
│   └── react-article/        # Article reading components
├── turbo.json                # Turborepo config
├── pnpm-workspace.yaml       # pnpm workspaces
└── package.json              # Root package.json
```

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a PR.

## License

MIT - see [LICENSE](./LICENSE) for details.

## Author

**Tomasz Jarosz**
- Website: [tomaszjarosz.dev](https://tomaszjarosz.dev)
- GitHub: [@tomaszjarosz](https://github.com/tomaszjarosz)
