import React from 'react';
import { CopyCodeButton } from './CopyCodeButton';

interface SimpleCodeBlockProps {
  children: React.ReactNode;
  code: string;
  props?: Record<string, unknown>;
}

/**
 * Simple code block component without syntax highlighting
 * Used when no language is specified
 */
export const SimpleCodeBlock: React.FC<SimpleCodeBlockProps> = ({
  children,
  code,
  props = {},
}) => {
  return (
    <div className="my-1.5 rounded-md border border-gray-200 relative overflow-x-auto">
      <CopyCodeButton code={code} />
      <pre
        className="bg-gray-900 text-gray-100 p-1.5 pr-10 overflow-x-auto text-xs leading-snug"
        style={{
          fontFamily:
            "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          whiteSpace: 'pre',
        }}
      >
        <code {...props}>{children}</code>
      </pre>
    </div>
  );
};
