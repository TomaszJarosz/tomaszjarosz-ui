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
  <div className="bg-gray-900 rounded-lg p-1.5 text-[11px] font-mono overflow-hidden leading-tight">
    <div className="flex items-center gap-1 mb-1 pb-1 border-b border-gray-700">
      <Code2 className="w-2.5 h-2.5 text-gray-400" />
      <span className="text-gray-400 text-[8px] uppercase tracking-wide">
        Pseudocode
      </span>
    </div>
    <div>
      {code.map((line, idx) => (
        <div
          key={idx}
          className={`px-0.5 rounded transition-all whitespace-pre ${
            idx === activeLine
              ? 'bg-yellow-500/30 text-yellow-200 border-l border-yellow-400'
              : 'text-gray-400 border-l border-transparent'
          }`}
        >
          <span className="text-gray-600 mr-1 select-none text-[9px]">
            {idx + 1}
          </span>
          {line || ' '}
        </div>
      ))}
    </div>
    {variables && Object.keys(variables).length > 0 && (
      <div className="mt-1 pt-1 border-t border-gray-700">
        <div className="text-[8px] text-gray-500 uppercase tracking-wide mb-0.5">
          Vars
        </div>
        <div className="flex flex-wrap gap-0.5">
          {Object.entries(variables).map(([key, value]) => (
            <span
              key={key}
              className="px-0.5 bg-gray-800 rounded text-[9px] text-gray-300"
            >
              <span className="text-blue-400">{key}</span>
              <span className="text-gray-500">=</span>
              <span className="text-green-400">{value}</span>
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default CodePanel;
