import React from 'react';
import { CopyCodeButton } from './CopyCodeButton';

interface SimpleCodeBlockProps {
  children: React.ReactNode;
  code: string;
  props?: Record<string, unknown>;
  /** Custom class name for wrapper */
  className?: string;
}

/**
 * Simple code block component without syntax highlighting
 * Used when no language is specified
 */
export const SimpleCodeBlock: React.FC<SimpleCodeBlockProps> = ({
  children,
  code,
  props = {},
  className,
}) => {
  return (
    <div className={className || 'rm-simple-code-block'}>
      <CopyCodeButton code={code} />
      <pre className="rm-simple-code-pre">
        <code {...props}>{children}</code>
      </pre>
    </div>
  );
};
