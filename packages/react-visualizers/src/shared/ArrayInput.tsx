import React, { useState, useCallback, useId } from 'react';
import { Edit2, Check, X } from 'lucide-react';

export interface ArrayInputProps {
  array: number[];
  onArrayChange: (newArray: number[]) => void;
  disabled?: boolean;
  maxSize?: number;
  minSize?: number;
  maxValue?: number;
  minValue?: number;
  accentColor?: 'indigo' | 'orange' | 'green' | 'purple' | 'blue' | 'cyan' | 'red' | 'lime' | 'teal' | 'violet';
}

const ACCENT_COLORS = {
  indigo: 'focus:ring-indigo-500 focus:border-indigo-500',
  orange: 'focus:ring-orange-500 focus:border-orange-500',
  green: 'focus:ring-green-500 focus:border-green-500',
  purple: 'focus:ring-purple-500 focus:border-purple-500',
  blue: 'focus:ring-blue-500 focus:border-blue-500',
  cyan: 'focus:ring-cyan-500 focus:border-cyan-500',
  red: 'focus:ring-red-500 focus:border-red-500',
  lime: 'focus:ring-lime-500 focus:border-lime-500',
  teal: 'focus:ring-teal-500 focus:border-teal-500',
  violet: 'focus:ring-violet-500 focus:border-violet-500',
};

const ACCENT_BUTTON_COLORS = {
  indigo: 'bg-indigo-600 hover:bg-indigo-700',
  orange: 'bg-orange-600 hover:bg-orange-700',
  green: 'bg-green-600 hover:bg-green-700',
  purple: 'bg-purple-600 hover:bg-purple-700',
  blue: 'bg-blue-600 hover:bg-blue-700',
  cyan: 'bg-cyan-600 hover:bg-cyan-700',
  red: 'bg-red-600 hover:bg-red-700',
  lime: 'bg-lime-600 hover:bg-lime-700',
  teal: 'bg-teal-600 hover:bg-teal-700',
  violet: 'bg-violet-600 hover:bg-violet-700',
};

export const ArrayInput: React.FC<ArrayInputProps> = ({
  array,
  onArrayChange,
  disabled = false,
  maxSize = 20,
  minSize = 3,
  maxValue = 100,
  minValue = 1,
  accentColor = 'indigo',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleStartEdit = useCallback(() => {
    setInputValue(array.join(', '));
    setIsEditing(true);
    setError(null);
  }, [array]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setInputValue('');
    setError(null);
  }, []);

  const handleConfirm = useCallback(() => {
    const parts = inputValue
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const numbers: number[] = [];
    for (const part of parts) {
      const num = parseInt(part, 10);
      if (isNaN(num)) {
        setError(`Invalid number: "${part}"`);
        return;
      }
      if (num < minValue || num > maxValue) {
        setError(`Numbers must be between ${minValue} and ${maxValue}`);
        return;
      }
      numbers.push(num);
    }

    if (numbers.length < minSize) {
      setError(`At least ${minSize} numbers required`);
      return;
    }

    if (numbers.length > maxSize) {
      setError(`Maximum ${maxSize} numbers allowed`);
      return;
    }

    onArrayChange(numbers);
    setIsEditing(false);
    setInputValue('');
    setError(null);
  }, [inputValue, onArrayChange, minSize, maxSize, minValue, maxValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [handleConfirm, handleCancel]
  );

  const errorId = useId();
  const inputId = useId();

  if (disabled) {
    return null;
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <input
              id={inputId}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., 5, 3, 8, 1, 9"
              className={`px-2 py-1 text-xs border border-gray-300 rounded w-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${ACCENT_COLORS[accentColor]}`}
              autoFocus
              aria-label="Enter array values separated by commas"
              aria-describedby={error ? errorId : undefined}
              aria-invalid={!!error}
            />
            <button
              onClick={handleConfirm}
              className={`p-1 text-white rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-500 ${ACCENT_BUTTON_COLORS[accentColor]}`}
              title="Apply (Enter)"
              aria-label="Apply changes"
            >
              <Check className="w-3 h-3" aria-hidden="true" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-500"
              title="Cancel (Esc)"
              aria-label="Cancel editing"
            >
              <X className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>
          {error && (
            <span
              id={errorId}
              className="text-[10px] text-red-500 mt-0.5"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleStartEdit}
      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-500"
      title="Edit array values"
      aria-label="Edit array values"
    >
      <Edit2 className="w-3 h-3" aria-hidden="true" />
      <span>Custom</span>
    </button>
  );
};

export default ArrayInput;
