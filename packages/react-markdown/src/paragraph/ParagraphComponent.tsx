import React from 'react';
import { extractText, getParagraphType, type DetectCallout, defaultDetectCallout } from './textHelpers';
import { Callout } from '../callout';

export interface ParagraphProps {
  children: React.ReactNode;
  /** Function to detect callouts in text */
  detectCallout?: DetectCallout;
  /** Custom class name for regular paragraphs */
  className?: string;
}

export const ParagraphComponent: React.FC<ParagraphProps> = ({
  children,
  detectCallout = defaultDetectCallout,
  className,
}) => {
  const content = Array.isArray(children)
    ? children.map(extractText).join('')
    : extractText(children);

  const callout = detectCallout(content);
  if (callout) {
    return (
      <Callout type={callout.type} title={callout.title}>
        {callout.content}
      </Callout>
    );
  }

  // Check if children contains block-level elements (pre, div, etc.)
  // If so, use div instead of p to avoid nesting warnings
  const hasBlockLevelChildren = React.Children.toArray(children).some(
    (child) => {
      if (React.isValidElement(child)) {
        const type = child.type;
        // Check for block-level elements
        if (typeof type === 'string') {
          return ['pre', 'div', 'blockquote', 'ul', 'ol', 'table'].includes(
            type
          );
        }
        // Check for code blocks (our SimpleCodeBlock component)
        if (typeof type === 'function' || typeof type === 'object') {
          return true; // Assume custom components might be block-level
        }
      }
      return false;
    }
  );

  const type = getParagraphType(content);

  // If contains block-level elements, use div to avoid nesting warnings
  if (hasBlockLevelChildren) {
    return (
      <div className={className || "text-sm text-gray-700 leading-snug mb-1"}>{children}</div>
    );
  }

  // Multiple checkmarks - render each on new line
  if (type.hasMultipleCheckmarks) {
    return (
      <div className={className || "mb-1 text-sm text-gray-700 leading-snug"}>
        {React.Children.map(children, (child) => {
          if (typeof child === 'string') {
            const lines = child.split('\n').filter((line) => line.trim());
            return lines.map((line, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <br />}
                {line}
              </React.Fragment>
            ));
          }
          return child;
        })}
      </div>
    );
  }

  // Summary items (e.g., **Title** - description)
  if (type.isSummaryItem) {
    return (
      <p className={className || "mb-0.5 text-sm text-gray-700 leading-snug"}>{children}</p>
    );
  }

  // Single checkmark items
  if (type.isCheckmarkItem) {
    return (
      <p className={className || "mb-1 text-sm text-gray-700 leading-snug"}>{children}</p>
    );
  }

  // List headers
  if (type.isListHeader) {
    return (
      <p className={className || "text-sm text-gray-700 leading-tight mb-0"}>{children}</p>
    );
  }

  // Regular paragraphs
  return <p className={className || "text-sm text-gray-700 leading-snug mb-1"}>{children}</p>;
};
