import React from 'react';

interface InlineCodeProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

/**
 * Inline code component for short code snippets within text
 */
export const InlineCode: React.FC<InlineCodeProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <code
      className={`bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono border whitespace-nowrap ${className}`}
      {...props}
    >
      {children}
    </code>
  );
};
