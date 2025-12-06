# @tomaszjarosz/react-article

Article reading utilities for React - progress bar, table of contents, and bookmarks.

## Installation

```bash
npm install @tomaszjarosz/react-article
```

## Requirements

- React 17+ or 18+
- Tailwind CSS

## Components

### Reading Progress Bar

```tsx
import { ReadingProgressBar } from '@tomaszjarosz/react-article';

// Fixed progress bar at top of page
<ReadingProgressBar showPercentage />

// Customized colors
<ReadingProgressBar
  showPercentage={false}
  progressColor="bg-gradient-to-r from-purple-500 to-pink-500"
  completedColor="bg-green-500"
/>
```

### Table of Contents

```tsx
import { TableOfContents } from '@tomaszjarosz/react-article';

const tocItems = [
  { id: 'intro', text: 'Introduction', level: 2, originalText: 'Introduction' },
  { id: 'setup', text: 'Setup', level: 2, originalText: 'Setup' },
  { id: 'config', text: 'Configuration', level: 3, originalText: 'Configuration' },
  { id: 'advanced', text: 'Advanced', level: 2, originalText: 'Advanced Usage' },
];

<TableOfContents
  items={tocItems}
  title="Contents"
  showProgress
  scrollOffset={80}
/>
```

Features:
- Active section highlighting
- Smooth scroll navigation
- Reading progress indicator
- Hierarchical display (H2, H3, etc.)

## Hooks

### useReadingProgress

```tsx
import { useReadingProgress } from '@tomaszjarosz/react-article';

function CustomProgressBar() {
  const progress = useReadingProgress(); // 0-100
  
  return <div style={{ width: `${progress}%` }} />;
}
```

### useActiveSection

```tsx
import { useActiveSection, type TableOfContentsItem } from '@tomaszjarosz/react-article';

function TOC({ items }: { items: TableOfContentsItem[] }) {
  const activeSection = useActiveSection(items);
  
  return (
    <ul>
      {items.map(item => (
        <li key={item.id} className={activeSection === item.id ? 'active' : ''}>
          {item.text}
        </li>
      ))}
    </ul>
  );
}
```

### useScrollToSection

```tsx
import { useScrollToSection } from '@tomaszjarosz/react-article';

function TOC() {
  const scrollToSection = useScrollToSection(80); // offset in px
  
  return (
    <button onClick={() => scrollToSection('intro')}>
      Go to Introduction
    </button>
  );
}
```

### useBookmarks

```tsx
import { useBookmarks } from '@tomaszjarosz/react-article';

function ArticleWithBookmarks({ slug }: { slug: string }) {
  const { 
    bookmarks,
    toggleBookmark,
    isBookmarked,
    clearAllBookmarks,
    bookmarkCount
  } = useBookmarks(slug);
  
  return (
    <div>
      <p>Bookmarks: {bookmarkCount}</p>
      <button onClick={() => toggleBookmark('section-1')}>
        {isBookmarked('section-1') ? 'Remove' : 'Add'} Bookmark
      </button>
    </div>
  );
}
```

## Exports

```tsx
import {
  // Components
  ReadingProgressBar,
  TableOfContents,
  
  // Hooks
  useReadingProgress,
  useActiveSection,
  useScrollToSection,
  useBookmarks,
  
  // Types
  type TableOfContentsItem,
} from '@tomaszjarosz/react-article';
```

## License

MIT
