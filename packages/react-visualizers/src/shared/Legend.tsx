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
    <div className="flex items-center justify-between mt-3 text-xs">
      <div className="flex items-center gap-4 flex-wrap">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <div
              className={`w-3 h-3 rounded ${item.color}`}
              style={item.border ? { border: `2px solid ${item.border}` } : {}}
            />
            <span className="text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>
      {showKeyboardHints && (
        <div className="flex items-center gap-1 text-gray-400">
          <Keyboard className="w-3 h-3" />
          <span>P &middot; [ ] &middot; R</span>
        </div>
      )}
    </div>
  );
};

export default Legend;
