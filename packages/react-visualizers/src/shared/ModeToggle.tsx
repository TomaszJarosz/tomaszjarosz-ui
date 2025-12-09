import React from 'react';

export type VisualizerMode = 'visualize' | 'interview';

export interface ModeToggleProps {
  mode: VisualizerMode;
  onModeChange: (mode: VisualizerMode) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Toggle between Visualize and Interview modes
 * Used in all Interview-enabled visualizers
 */
export const ModeToggle: React.FC<ModeToggleProps> = ({
  mode,
  onModeChange,
  className = '',
  disabled = false,
}) => {
  return (
    <div
      className={`flex gap-1 bg-gray-200 rounded-lg p-0.5 ${className}`}
      role="tablist"
      aria-label="Visualization mode"
    >
      <button
        role="tab"
        aria-selected={mode === 'visualize'}
        aria-controls="visualize-panel"
        onClick={() => onModeChange('visualize')}
        disabled={disabled}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-500 ${
          mode === 'visualize'
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span aria-hidden="true">📊</span>
        <span className="ml-1">Visualize</span>
      </button>
      <button
        role="tab"
        aria-selected={mode === 'interview'}
        aria-controls="interview-panel"
        onClick={() => onModeChange('interview')}
        disabled={disabled}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-500 ${
          mode === 'interview'
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span aria-hidden="true">🎤</span>
        <span className="ml-1">Interview</span>
      </button>
    </div>
  );
};

export default ModeToggle;
