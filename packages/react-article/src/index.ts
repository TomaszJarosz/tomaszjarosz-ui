/**
 * @tomaszjarosz/react-article
 *
 * Article reading components for React - progress bar, table of contents, bookmarks.
 */

// Components
export { ReadingProgressBar } from './progress';
export { TableOfContents } from './toc';

// Hooks
export {
  useReadingProgress,
  useActiveSection,
  useScrollToSection,
  useBookmarks,
  type TableOfContentsItem,
} from './hooks';
