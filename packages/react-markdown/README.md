# @tomaszjarosz/react-markdown

Enhanced markdown components for React - code blocks, callouts, diagrams.

## Installation

```bash
pnpm add @tomaszjarosz/react-markdown
# or
npm install @tomaszjarosz/react-markdown
```

## Features

- **Code Blocks**: Syntax highlighting, line numbers, copy button, collapsible
- **Callouts**: Info, warning, error, success, tip callouts
- **Diagrams**: Mermaid diagram support

## Usage

### Code Block

```tsx
import { CodeBlock } from '@tomaszjarosz/react-markdown';

function Example() {
  return (
    <CodeBlock
      language="typescript"
      code={`function greet(name: string) {
  return \`Hello, \${name}!\`;
}`}
      showLineNumbers
      highlightLines={[2]}
    />
  );
}
```

### Callout

```tsx
import { Callout } from '@tomaszjarosz/react-markdown';

function Example() {
  return (
    <>
      <Callout type="info">
        This is informational content.
      </Callout>

      <Callout type="warning">
        Be careful with this operation!
      </Callout>

      <Callout type="error">
        Something went wrong.
      </Callout>
    </>
  );
}
```

### Mermaid Diagram

```tsx
import { MermaidDiagram } from '@tomaszjarosz/react-markdown';

function Example() {
  return (
    <MermaidDiagram
      chart={`
        flowchart TD
          A[Start] --> B{Decision}
          B -->|Yes| C[Process]
          B -->|No| D[End]
      `}
    />
  );
}
```

## Available Components

| Component | Description |
|-----------|-------------|
| `CodeBlock` | Syntax-highlighted code block with copy button |
| `InlineCode` | Inline code styling |
| `Callout` | Info/warning/error/success callouts |
| `MermaidDiagram` | Mermaid diagram renderer |

## Props

### CodeBlock

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `code` | `string` | required | The code to display |
| `language` | `string` | `'text'` | Language for syntax highlighting |
| `showLineNumbers` | `boolean` | `false` | Show line numbers |
| `highlightLines` | `number[]` | `[]` | Lines to highlight |
| `collapsible` | `boolean` | `false` | Enable collapse for long code |
| `maxHeight` | `number` | `300` | Max height before collapse |

### Callout

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'info' \| 'warning' \| 'error' \| 'success' \| 'tip'` | `'info'` | Callout type |
| `title` | `string` | - | Optional title |
| `children` | `ReactNode` | required | Callout content |

## License

MIT
