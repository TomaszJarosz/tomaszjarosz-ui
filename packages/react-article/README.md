# @tomaszjarosz/react-article

Article reading components for React - TOC, bookmarks, keyboard navigation, search.

## Installation

```bash
pnpm add @tomaszjarosz/react-article
# or
npm install @tomaszjarosz/react-article
```

## Features

- **Table of Contents**: Sticky sidebar, active section tracking, mobile drawer
- **Bookmarks**: Per-section bookmarks with localStorage persistence
- **Keyboard Navigation**: j/k navigation, shortcuts for common actions
- **Command Palette**: Cmd+K search modal with keyboard navigation

## Usage

### Table of Contents

```tsx
import { TableOfContents, useActiveSection } from '@tomaszjarosz/react-article';

function ArticlePage() {
  const headings = [
    { id: 'intro', text: 'Introduction', level: 2 },
    { id: 'setup', text: 'Setup', level: 2 },
    { id: 'usage', text: 'Usage', level: 2 },
  ];

  const activeId = useActiveSection(headings);

  return (
    <div className="flex">
      <aside className="w-64">
        <TableOfContents
          headings={headings}
          activeId={activeId}
        />
      </aside>
      <main>
        {/* Article content */}
      </main>
    </div>
  );
}
```

### Bookmarks

```tsx
import { useArticleBookmarks } from '@tomaszjarosz/react-article';

function ArticlePage({ articleSlug }) {
  const { bookmarks, toggleBookmark, isBookmarked } = useArticleBookmarks(articleSlug);

  return (
    <button onClick={() => toggleBookmark('section-1')}>
      {isBookmarked('section-1') ? 'Remove bookmark' : 'Add bookmark'}
    </button>
  );
}
```

### Keyboard Navigation

```tsx
import { useKeyboardNavigation } from '@tomaszjarosz/react-article';

function ArticlePage({ onNext, onPrevious }) {
  useKeyboardNavigation({
    onNext,     // Called on 'j' or '→'
    onPrevious, // Called on 'k' or '←'
    onTop,      // Called on 't'
  });

  return <article>{/* content */}</article>;
}
```

### Command Palette

```tsx
import { CommandPalette } from '@tomaszjarosz/react-article';

function App() {
  const [open, setOpen] = useState(false);

  const handleSearch = async (query: string) => {
    // Your search implementation
    return results;
  };

  return (
    <CommandPalette
      open={open}
      onOpenChange={setOpen}
      onSearch={handleSearch}
      placeholder="Search articles..."
    />
  );
}
```

## Available Components

| Component | Description |
|-----------|-------------|
| `TableOfContents` | Sidebar table of contents |
| `FloatingTableOfContents` | Mobile floating TOC button |
| `CommandPalette` | Cmd+K search modal |
| `SearchResultCard` | Search result display |

## Hooks

| Hook | Description |
|------|-------------|
| `useActiveSection` | Track current section on scroll |
| `useTableOfContents` | Parse headings from content |
| `useArticleBookmarks` | Bookmark management |
| `useKeyboardNavigation` | Keyboard shortcuts |
| `useReadingProgress` | Reading progress percentage |

## License

MIT
