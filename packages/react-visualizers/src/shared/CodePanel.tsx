import React from 'react';
import { Code2 } from 'lucide-react';

interface CodePanelProps {
  code: string[];
  activeLine: number;
  variables?: Record<string, string | number>;
}

export const CodePanel: React.FC<CodePanelProps> = ({
  code,
  activeLine,
  variables,
}) => (
  <div
    className="bg-gray-900 rounded-lg p-1.5 text-[11px] font-mono overflow-hidden leading-tight"
    role="region"
    aria-label="Pseudocode viewer"
  >
    <div className="flex items-center gap-1 mb-1 pb-1 border-b border-gray-700">
      <Code2 className="w-2.5 h-2.5 text-gray-400" aria-hidden="true" />
      <span className="text-gray-400 text-[8px] uppercase tracking-wide">
        Pseudocode
      </span>
    </div>
    <div role="list" aria-label="Code lines">
      {code.map((line, idx) => (
        <div
          key={idx}
          role="listitem"
          aria-current={idx === activeLine ? 'step' : undefined}
          className={`px-0.5 rounded transition-colors whitespace-pre ${
            idx === activeLine
              ? 'bg-yellow-400/40 text-yellow-100 border-l-2 border-yellow-400'
              : 'text-gray-400 border-l-2 border-transparent'
          }`}
        >
          <span className="text-gray-600 mr-1 select-none text-[9px]" aria-hidden="true">
            {idx + 1}
          </span>
          {line || ' '}
        </div>
      ))}
    </div>
    <div
      className="mt-1 pt-1 border-t border-gray-700 min-h-[36px]"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="text-[8px] text-gray-500 uppercase tracking-wide mb-0.5">
        Variables
      </div>
      <dl className="flex flex-wrap gap-0.5" aria-label="Current variable values">
        {variables && Object.keys(variables).length > 0 ? (
          Object.entries(variables).map(([key, value]) => (
            <div
              key={key}
              className="px-0.5 bg-gray-800 rounded text-[9px] text-gray-300 flex"
            >
              <dt className="text-blue-400">{key}</dt>
              <span className="text-gray-500" aria-hidden="true">=</span>
              <dd className="text-green-400">{String(value)}</dd>
            </div>
          ))
        ) : (
          <span className="text-[9px] text-gray-600" aria-label="No variables">—</span>
        )}
      </dl>
    </div>
  </div>
);

export default CodePanel;
