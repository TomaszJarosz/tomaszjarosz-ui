import React from 'react';
import { Keyboard } from 'lucide-react';

export interface LegendItem {
  color: string;
  label: string;
  border?: string;
}

export interface LegendProps {
  items: LegendItem[];
  showKeyboardHints?: boolean;
}

export const Legend: React.FC<LegendProps> = ({
  items,
  showKeyboardHints = true,
}) => {
  return (
    <div className="flex items-center justify-between mt-3 text-xs" role="group" aria-label="Visualization legend">
      <dl className="flex items-center gap-4 flex-wrap" aria-label="Color legend">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <dt className="sr-only">{item.label}</dt>
            <dd className="flex items-center gap-1">
              <span
                className={`w-3 h-3 rounded ${item.color}`}
                style={item.border ? { border: `2px solid ${item.border}` } : {}}
                aria-hidden="true"
              />
              <span className="text-gray-500">{item.label}</span>
            </dd>
          </div>
        ))}
      </dl>
      {showKeyboardHints && (
        <div
          className="flex items-center gap-1 text-gray-400"
          role="note"
          aria-label="Keyboard shortcuts: P for play/pause, left bracket for step back, right bracket for step forward, R for reset"
        >
          <Keyboard className="w-3 h-3" aria-hidden="true" />
          <span aria-hidden="true">P &middot; [ ] &middot; R</span>
        </div>
      )}
    </div>
  );
};

export default Legend;
