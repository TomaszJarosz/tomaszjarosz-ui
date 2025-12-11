# @tomaszjarosz/react-ui

React UI components library - Badge, Button, Card, Alert, LoadingSpinner, EmptyState, Breadcrumbs, CollapsibleSection, and utility hooks.

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

### Breadcrumbs

Router-agnostic breadcrumbs component.

```tsx
// With plain anchors (default)
<Breadcrumbs
  items={[
    { label: 'Blog', href: '/blog' },
    { label: 'Article', isCurrent: true }
  ]}
/>

// With React Router
import { Link } from 'react-router-dom';
<Breadcrumbs
  linkComponent={Link}
  items={[{ label: 'Blog', href: '/blog' }]}
/>

// With Next.js
import Link from 'next/link';
<Breadcrumbs linkComponent={Link} items={items} />
```

### CollapsibleSection

Collapsible on mobile, always expanded on desktop.

```tsx
import { TrendingUp } from 'lucide-react';

<CollapsibleSection
  title="Popular Tags"
  icon={TrendingUp}
  defaultExpanded={false}
  actionButton={<button>View all</button>}
>
  <TagsList />
</CollapsibleSection>
```

## Hooks

### useInView

Intersection Observer hook for visibility detection.

```tsx
const [ref, isInView] = useInView({ threshold: 0.5, triggerOnce: true });

return (
  <div ref={ref} className={isInView ? 'animate-fadeIn' : 'opacity-0'}>
    Content
  </div>
);
```

### useLocalStorage

Type-safe localStorage with cross-tab sync.

```tsx
const { value, setValue, removeValue, error } = useLocalStorage('user-prefs', { theme: 'dark' });

// Update
setValue({ theme: 'light' });

// Functional update
setValue(prev => ({ ...prev, theme: 'light' }));

// Remove
removeValue();
```

### useDebounce

Debounce values for search inputs or API calls.

```tsx
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 500);

useEffect(() => {
  searchAPI(debouncedSearchTerm);
}, [debouncedSearchTerm]);
```

### useEventListener

Type-safe event listeners with automatic cleanup.

```tsx
// Window scroll event
useEventListener('scroll', handleScroll);

// Keyboard event on document
useEventListener('keydown', handleKeyDown, document);

// Conditionally enabled
useEventListener('mousemove', handleMove, window, { enabled: isTracking });
```

### useKeyboardNavigation

Arrow key navigation for lists, dropdowns, search results.

```tsx
const containerRef = useRef<HTMLDivElement>(null);
const { selectedIndex, resetSelection } = useKeyboardNavigation({
  itemCount: items.length,
  onSelect: (index) => handleSelect(items[index]),
  isEnabled: isOpen,
  containerRef,
});

return (
  <div ref={containerRef}>
    {items.map((item, i) => (
      <div key={item.id} data-item className={i === selectedIndex ? 'selected' : ''}>
        {item.label}
      </div>
    ))}
  </div>
);
```

## Animation Components

### FadeIn

Scroll-triggered fade-in animation wrapper.

```tsx
<FadeIn delay={0.2} triggerOnce>
  <h1>Animated Content</h1>
</FadeIn>

// Staggered animation
{items.map((item, i) => (
  <FadeIn key={item.id} delay={i * 0.1}>
    <Card>{item.title}</Card>
  </FadeIn>
))}
```

### BackToTop

Floating button to scroll back to top.

```tsx
<BackToTop />
<BackToTop threshold={500} />
```

### SkipLink

Accessibility skip link for keyboard users.

```tsx
<SkipLink href="#main-content">Skip to main content</SkipLink>
<Header />
<main id="main-content">...</main>
```

## Date Utilities

Zero-dependency date formatting using native Intl API.

```tsx
import {
  formatDate,
  formatDateShort,
  getRelativeTime,
  isToday,
  DATE_FORMATS,
  LOCALES,
} from '@tomaszjarosz/react-ui';

// Basic formatting
formatDate('2025-12-11') // "December 11, 2025"
formatDateShort('2025-12-11') // "Dec 11, 2025"

// With locale
formatDate('2025-12-11', DATE_FORMATS.DEFAULT, LOCALES.PL) // "11 grudnia 2025"

// Relative time
getRelativeTime(new Date(Date.now() - 3600000)) // "1 hour ago"

// Date checks
isToday(new Date()) // true
isYesterday(new Date(Date.now() - 86400000)) // true
isPast('2020-01-01') // true
isFuture('2030-01-01') // true

// Difference
diffInDays('2025-12-11', '2025-12-01') // 10
```

## Requirements

- React 17+ or 18+

## License

MIT
