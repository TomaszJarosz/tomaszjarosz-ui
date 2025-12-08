import React from 'react';

interface InlineCodeProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

/**
 * Inline code component for short code snippets within text
 */
export const InlineCode: React.FC<InlineCodeProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <code className={className || 'rm-inline-code'} {...props}>
      {children}
    </code>
  );
};
