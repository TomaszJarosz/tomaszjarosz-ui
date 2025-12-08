import React from 'react';

interface CodeBlockHeaderProps {
  language: string;
  isDiff?: boolean;
  lineCount?: number;
  /** Custom class name */
  className?: string;
}

/**
 * Header component for code blocks showing language, type and line count
 */
export const CodeBlockHeader: React.FC<CodeBlockHeaderProps> = ({
  language,
  isDiff = false,
  lineCount,
  className,
}) => {
  return (
    <div className={className || 'rm-code-header'}>
      <div className="rm-code-header-left">
        <span className="rm-code-header-lang">{language.toUpperCase()}</span>
        {lineCount && lineCount > 1 && (
          <span className="rm-code-header-lines">({lineCount} lines)</span>
        )}
      </div>
      <span className="rm-code-header-badge">{isDiff ? 'Diff' : 'Code'}</span>
    </div>
  );
};
