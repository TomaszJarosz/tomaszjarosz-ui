import React from 'react';

interface CodeBlockHeaderProps {
  language: string;
  isDiff?: boolean;
  lineCount?: number;
}

/**
 * Header component for code blocks showing language, type and line count
 */
export const CodeBlockHeader: React.FC<CodeBlockHeaderProps> = ({
  language,
  isDiff = false,
  lineCount,
}) => {
  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-gray-200 px-2.5 py-1.5 text-xs font-medium border-b border-gray-700 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="text-blue-400 text-xs">
          {/* Icon placeholder - can be extended with language-specific icons */}
        </span>
        <span className="font-semibold text-xs">{language.toUpperCase()}</span>
        {lineCount && lineCount > 1 && (
          <span className="text-[10px] text-gray-500">
            ({lineCount} lines)
          </span>
        )}
      </div>
      <span className="text-[10px] text-gray-400 bg-gray-700/50 px-1.5 py-0.5 rounded">
        {isDiff ? 'Diff' : 'Code'}
      </span>
    </div>
  );
};
