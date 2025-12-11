# @tomaszjarosz/react-ui

React UI components library - Badge, Button, Card, Alert, LoadingSpinner, and EmptyState.

## Installation

```bash
npm install @tomaszjarosz/react-ui
# or
bun add @tomaszjarosz/react-ui
```

## Usage

```tsx
import { Button, Badge, Card, Alert, LoadingSpinner, EmptyState } from '@tomaszjarosz/react-ui';
import '@tomaszjarosz/react-ui/styles.css';

function App() {
  return (
    <Card padding="lg" shadow="md">
      <Badge variant="primary">New</Badge>
      <Button variant="gradient" size="lg">
        Get Started
      </Button>
    </Card>
  );
}
```

## Components

### Button

```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>

<Button variant="danger" icon={Trash} loading={isLoading}>
  Delete
</Button>

<Button variant="ghost" icon={Edit} iconOnly aria-label="Edit" />
```

**Variants:** `primary`, `secondary`, `danger`, `success`, `ghost`, `outline`, `gradient`

**Sizes:** `xs`, `sm`, `md`, `lg`

### Badge

```tsx
<Badge variant="success">Published</Badge>
<Badge variant="featured" pill leftIcon={Star}>Featured</Badge>
<Badge variant="primary" onRemove={() => removeTag(id)}>JavaScript</Badge>
```

**Variants:** `primary`, `success`, `warning`, `danger`, `info`, `purple`, `gray`, `featured`, `new`, `series`, `premium`

### Card

```tsx
<Card padding="lg" shadow="md" hover onClick={handleClick}>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <p>Card content</p>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Alert

```tsx
<Alert variant="success" title="Success!">
  Your changes have been saved.
</Alert>

<Alert variant="error" onClose={() => setShowAlert(false)}>
  Something went wrong.
</Alert>
```

**Variants:** `info`, `success`, `warning`, `error`

### LoadingSpinner

```tsx
<LoadingSpinner size="lg" variant="primary" />
<LoadingSpinner centered={false} message="Loading data..." />
```

### EmptyState

```tsx
<EmptyState
  icon={FileText}
  title="No articles yet"
  description="Start writing your first article"
  action={<Button>Create Article</Button>}
/>
```

## Requirements

- React 17+ or 18+

## License

MIT
