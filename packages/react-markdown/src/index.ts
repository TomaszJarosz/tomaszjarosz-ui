/**
 * @tomaszjarosz/react-markdown
 *
 * Enhanced markdown components for React - code blocks, callouts, diagrams,
 * typography, and complete markdown rendering utilities.
 */

// =============================================================================
// CODE BLOCKS
// =============================================================================

export {
  CodeBlockWithLanguage,
  CodeBlockHeader,
  SimpleCodeBlock,
  InlineCode,
  CopyCodeButton,
  LazyCodeHighlighter,
  LazyCodeHighlighterWrapper,
} from './code';

// =============================================================================
// CALLOUTS
// =============================================================================

export { Callout } from './callout';

// =============================================================================
// DIAGRAMS
// =============================================================================

export { MermaidDiagram } from './diagram';

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export {
  // Headings
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  type HeadingProps,
  // Lists
  UnorderedList,
  OrderedList,
  ListItem,
  type ListProps,
  // Tables
  Table,
  TableHeader,
  TableCell,
  TableRow,
  TableHead,
  TableBody,
  type TableProps,
  type CellProps,
  // Blockquote
  BlockquoteComponent,
  type BlockquoteProps,
  // Inline elements
  Strong,
  Emphasis,
  HorizontalRule,
  Strikethrough,
  type InlineProps,
} from './typography';

// =============================================================================
// PARAGRAPH
// =============================================================================

export {
  ParagraphComponent,
  type ParagraphProps,
  // Text helpers
  extractText,
  getParagraphType,
  defaultDetectCallout,
  type ParagraphTypeInfo,
  type CalloutType,
  type CalloutResult,
  type DetectCallout,
} from './paragraph';

// =============================================================================
// MEDIA (Links & Images)
// =============================================================================

export {
  LinkComponent,
  type LinkProps,
  ImageComponent,
  type ImageProps,
} from './media';

// =============================================================================
// RENDERER UTILITIES
// =============================================================================

export {
  // Factory function
  createMarkdownComponents,
  type CreateMarkdownComponentsOptions,
  // Heading ID generation
  createHeadingIdGenerator,
  generateHeadingId,
  // Types
  type MarkdownComponentProps,
  type MarkdownComponentPropsWithExtras,
  type GenerateHeadingId,
  type GetContentOptimizedStyle,
  type MarkdownComponents,
  type CreateMarkdownComponentsParams,
  type CodeComponentProps,
  type MarkdownPlugin,
  type MarkdownPlugins,
} from './renderer';
