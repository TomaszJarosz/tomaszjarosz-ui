# @tomaszjarosz/ui

React UI component library - visualizers, markdown components, and article reading utilities.

## Packages

| Package | Description | Size |
|---------|-------------|------|
| [@tomaszjarosz/react-ui](./packages/react-ui) | Button, Badge, Card, Alert, Spinner, EmptyState | 3 kB gzip |
| [@tomaszjarosz/react-visualizers](./packages/react-visualizers) | Algorithm & data structure visualizers | 55 kB gzip |
| [@tomaszjarosz/react-markdown](./packages/react-markdown) | Code blocks, callouts, diagrams | 374 kB gzip |
| [@tomaszjarosz/react-article](./packages/react-article) | Reading progress, TOC, bookmarks | 4 kB gzip |

## Installation

```bash
# UI Components
npm install @tomaszjarosz/react-ui

# Visualizers
npm install @tomaszjarosz/react-visualizers

# Markdown components
npm install @tomaszjarosz/react-markdown

# Article reading utilities
npm install @tomaszjarosz/react-article
```

## Requirements

- React 17+ or 18+
- Tailwind CSS (peer dependency for styling)

## Quick Start

### Visualizers

```tsx
import { BubbleSortVisualizer } from '@tomaszjarosz/react-visualizers';

function App() {
  return <BubbleSortVisualizer />;
}
```

### Markdown Components

```tsx
import { CodeBlockWithLanguage, Callout } from '@tomaszjarosz/react-markdown';

function Article() {
  return (
    <>
      <Callout type="info" title="Note">
        This is an info callout.
      </Callout>
      <CodeBlockWithLanguage
        language="typescript"
        code={`const hello = "world";`}
        highlightLines={[]}
        codeStyle={{}}
      />
    </>
  );
}
```

### Article Reading

```tsx
import { ReadingProgressBar, TableOfContents } from '@tomaszjarosz/react-article';

function ArticlePage() {
  const tocItems = [
    { id: 'intro', text: 'Introduction', level: 2, originalText: 'Introduction' },
    { id: 'setup', text: 'Setup', level: 2, originalText: 'Setup' },
  ];

  return (
    <>
      <ReadingProgressBar showPercentage />
      <TableOfContents items={tocItems} />
    </>
  );
}
```

## Development

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Build specific package
bun run build --filter=@tomaszjarosz/react-visualizers
```

## License

MIT
