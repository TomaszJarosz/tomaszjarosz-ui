# @tomaszjarosz/react-markdown

Complete markdown rendering components for React - typography, code blocks with syntax highlighting, callouts, Mermaid diagrams, and renderer utilities.

## Installation

```bash
npm install @tomaszjarosz/react-markdown
```

## Requirements

- React 17+ or 18+
- Tailwind CSS (for default styling)

## Quick Start

### Using with react-markdown

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  createMarkdownComponents,
  createHeadingIdGenerator,
  defaultDetectCallout,
} from '@tomaszjarosz/react-markdown';

function ArticleContent({ content }: { content: string }) {
  const components = createMarkdownComponents({
    generateHeadingId: createHeadingIdGenerator(),
    detectCallout: defaultDetectCallout,
  });

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
```

## Components

### Typography

#### Headings (H1-H6)

```tsx
import { H1, H2, H3, H4, H5, H6 } from '@tomaszjarosz/react-markdown';

<H1 id="introduction">Introduction</H1>
<H2 id="getting-started">Getting Started</H2>
```

Features:
- Anchor links on hover (click to copy URL)
- Customizable styling
- Proper scroll margins for navigation

#### Lists

```tsx
import { UnorderedList, OrderedList, ListItem } from '@tomaszjarosz/react-markdown';

<UnorderedList>
  <ListItem>First item</ListItem>
  <ListItem>Second item</ListItem>
</UnorderedList>
```

#### Tables

```tsx
import { Table, TableHeader, TableCell, TableRow, TableHead, TableBody } from '@tomaszjarosz/react-markdown';

<Table>
  <TableHead>
    <TableRow>
      <TableHeader>Name</TableHeader>
      <TableHeader>Value</TableHeader>
    </TableRow>
  </TableHead>
  <TableBody>
    <TableRow>
      <TableCell>Item 1</TableCell>
      <TableCell>100</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

#### Inline Elements

```tsx
import { Strong, Emphasis, Strikethrough, HorizontalRule } from '@tomaszjarosz/react-markdown';

<Strong>Bold text</Strong>
<Emphasis>Italic text</Emphasis>
<Strikethrough>Deleted text</Strikethrough>
<HorizontalRule />
```

#### Blockquote

```tsx
import { BlockquoteComponent } from '@tomaszjarosz/react-markdown';

<BlockquoteComponent>
  "The best way to predict the future is to invent it."
</BlockquoteComponent>
```

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

Features:
- Syntax highlighting (Prism-based)
- Line highlighting
- Smart collapsing for long code (39+ lines)
- Copy to clipboard button
- Diff mode support
- Language badge with icons

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

### Media

#### Links

```tsx
import { LinkComponent } from '@tomaszjarosz/react-markdown';

<LinkComponent href="https://example.com">External Link</LinkComponent>
<LinkComponent href="/blog/article">Internal Link</LinkComponent>
```

Features:
- Automatic external link detection (opens in new tab)
- Customizable internal link patterns

#### Images

```tsx
import { ImageComponent } from '@tomaszjarosz/react-markdown';

<ImageComponent
  src="/images/photo.jpg"
  alt="A beautiful sunset"
  showCaption={true}
/>
```

Features:
- Lazy loading
- Loading skeleton
- Error state with fallback
- Optional caption from alt text

### Paragraph

```tsx
import { ParagraphComponent, defaultDetectCallout } from '@tomaszjarosz/react-markdown';

<ParagraphComponent detectCallout={defaultDetectCallout}>
  Regular paragraph text.
</ParagraphComponent>
```

Features:
- Automatic callout detection
- Block-level element handling
- Special formatting for checkmark items

## Renderer Utilities

### createMarkdownComponents

Factory function to create component mappings for react-markdown:

```tsx
import {
  createMarkdownComponents,
  createHeadingIdGenerator,
  defaultDetectCallout,
} from '@tomaszjarosz/react-markdown';

const components = createMarkdownComponents({
  // Required: generates unique IDs for headings
  generateHeadingId: createHeadingIdGenerator(),

  // Required: detects callout blocks
  detectCallout: defaultDetectCallout,

  // Optional: custom styles for code blocks
  contentOptimizedStyle: (type) => ({}),

  // Optional: custom code component for visualizers
  codeComponent: MyCustomCodeComponent,

  // Optional: patterns for internal links
  internalLinkPatterns: ['/blog/', '/docs/', '#'],
});
```

### Heading ID Generation

```tsx
import { createHeadingIdGenerator, generateHeadingId } from '@tomaszjarosz/react-markdown';

// For documents with potentially duplicate headings (tracks seen IDs)
const generator = createHeadingIdGenerator();
generator('Introduction'); // 'introduction'
generator('Introduction'); // 'introduction-1'

// Simple one-off generation
generateHeadingId('Getting Started'); // 'getting-started'
```

## All Exports

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

  // Typography - Headings
  H1, H2, H3, H4, H5, H6,

  // Typography - Lists
  UnorderedList, OrderedList, ListItem,

  // Typography - Tables
  Table, TableHeader, TableCell, TableRow, TableHead, TableBody,

  // Typography - Other
  BlockquoteComponent,
  Strong, Emphasis, HorizontalRule, Strikethrough,

  // Paragraph
  ParagraphComponent,
  extractText,
  getParagraphType,
  defaultDetectCallout,

  // Media
  LinkComponent,
  ImageComponent,

  // Renderer utilities
  createMarkdownComponents,
  createHeadingIdGenerator,
  generateHeadingId,

  // Types
  type HeadingProps,
  type ListProps,
  type TableProps,
  type CellProps,
  type BlockquoteProps,
  type InlineProps,
  type ParagraphProps,
  type LinkProps,
  type ImageProps,
  type CalloutType,
  type CalloutResult,
  type DetectCallout,
  type MarkdownComponentProps,
  type MarkdownComponents,
  type CreateMarkdownComponentsOptions,
} from '@tomaszjarosz/react-markdown';
```

## Customization

All components accept a `className` prop for custom styling:

```tsx
<H1 id="title" className="text-4xl font-extrabold text-indigo-900">
  Custom Styled Heading
</H1>

<Table className="shadow-lg border-2 border-gray-300">
  {/* ... */}
</Table>
```

## License

MIT
