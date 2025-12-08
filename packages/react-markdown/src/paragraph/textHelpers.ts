/**
 * Text helper utilities for paragraph processing
 */

export interface ParagraphTypeInfo {
  isCallout: boolean;
  hasMultipleCheckmarks: boolean;
  isListHeader: boolean;
  isSummaryItem: boolean;
  isCheckmarkItem: boolean;
}

/**
 * Extract text content from React children recursively
 */
export const extractText = (child: unknown): string => {
  if (typeof child === 'string') return child;
  if (Array.isArray(child)) return child.map(extractText).join('');

  // Type guard for React element with props
  if (
    child &&
    typeof child === 'object' &&
    'props' in child &&
    child.props &&
    typeof child.props === 'object' &&
    'children' in child.props
  ) {
    return extractText(child.props.children);
  }

  return '';
};

/**
 * Paragraph type detection based on content
 */
export const getParagraphType = (content: string): ParagraphTypeInfo => {
  const trimmed = content.trim();

  return {
    isCallout: false, // Handled by detectCallout from props
    hasMultipleCheckmarks: (content.match(/[✅❌]/gu) || []).length > 1,
    isListHeader:
      trimmed.endsWith(':') &&
      ['✅', '❌', '⚠️', '🎯', '💡', '📝', '🔍'].some((emoji) =>
        trimmed.includes(emoji)
      ),
    isSummaryItem: /^\*\*[^*]+\*\*\s*-\s*.+/.test(trimmed),
    isCheckmarkItem: trimmed.startsWith('✅') || trimmed.startsWith('❌'),
  };
};

/**
 * Callout types supported in markdown
 */
export type CalloutType =
  | 'info'
  | 'warning'
  | 'tip'
  | 'error'
  | 'success'
  | 'note'
  | 'problem'
  | 'solution'
  | 'solutions'
  | 'example';

/**
 * Result of callout detection
 */
export interface CalloutResult {
  type: CalloutType;
  title: string;
  content: string;
}

/**
 * Function type for callout detection
 */
export type DetectCallout = (text: string) => CalloutResult | null;

/**
 * Default callout detection function
 * Detects callouts in format: > [!TYPE] or > [!TYPE] Title
 */
export const defaultDetectCallout: DetectCallout = (text: string): CalloutResult | null => {
  // Match patterns like [!INFO], [!WARNING], etc.
  const calloutPattern = /^\[!(\w+)\](?:\s+(.+))?$/i;
  const lines = text.split('\n');

  if (lines.length === 0) return null;

  const firstLine = lines[0].trim();
  const match = calloutPattern.exec(firstLine);

  if (!match) return null;

  const typeStr = match[1].toLowerCase();
  const validTypes: CalloutType[] = [
    'info', 'warning', 'tip', 'error', 'success',
    'note', 'problem', 'solution', 'solutions', 'example'
  ];

  if (!validTypes.includes(typeStr as CalloutType)) return null;

  const type = typeStr as CalloutType;
  const title = match[2] || type.charAt(0).toUpperCase() + type.slice(1);
  const content = lines.slice(1).join('\n').trim();

  return { type, title, content };
};
