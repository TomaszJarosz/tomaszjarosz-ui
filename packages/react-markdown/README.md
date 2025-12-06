# @tomaszjarosz/react-markdown

Enhanced markdown components for React - code blocks with syntax highlighting, callouts, and Mermaid diagrams.

## Installation

```bash
npm install @tomaszjarosz/react-markdown
```

## Requirements

- React 17+ or 18+
- Tailwind CSS

## Components

### Code Blocks

```tsx
import { 
  CodeBlockWithLanguage, 
  SimpleCodeBlock, 
  InlineCode,
  CopyCodeButton 
} from '@tomaszjarosz/react-markdown';

// Full-featured code block with syntax highlighting
<CodeBlockWithLanguage
  language="typescript"
  code={`function hello() {
  return "world";
}`}
  highlightLines={[2]}
  codeStyle={{}}
/>

// Simple code block without highlighting
<SimpleCodeBlock code="npm install">
  npm install
</SimpleCodeBlock>

// Inline code
<InlineCode>const x = 1</InlineCode>
```

### Callouts

```tsx
import { Callout } from '@tomaszjarosz/react-markdown';

<Callout type="info" title="Information">
  This is an info callout.
</Callout>

<Callout type="warning" title="Warning">
  Be careful with this operation.
</Callout>

<Callout type="success">
  Operation completed successfully!
</Callout>

<Callout type="error" title="Error">
  Something went wrong.
</Callout>

<Callout type="tip">
  Here's a helpful tip.
</Callout>
```

**Available types:** `info`, `warning`, `success`, `error`, `note`, `tip`, `example`, `problem`, `solution`

### Mermaid Diagrams

```tsx
import { MermaidDiagram } from '@tomaszjarosz/react-markdown';

<MermaidDiagram
  chart={`
    flowchart LR
      A[Start] --> B{Decision}
      B -->|Yes| C[OK]
      B -->|No| D[Cancel]
  `}
/>
```

Features:
- Lazy loading (Mermaid library loaded on demand)
- XSS protection with DOMPurify
- Responsive SVG output
- Error handling with source preview

## Exports

```tsx
import {
  // Code components
  CodeBlockWithLanguage,
  CodeBlockHeader,
  SimpleCodeBlock,
  InlineCode,
  CopyCodeButton,
  LazyCodeHighlighter,
  LazyCodeHighlighterWrapper,
  
  // Callouts
  Callout,
  
  // Diagrams
  MermaidDiagram,
} from '@tomaszjarosz/react-markdown';
```

## License

MIT
