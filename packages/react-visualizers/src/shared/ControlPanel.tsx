import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Shuffle,
} from 'lucide-react';

export interface ControlPanelProps {
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  speed: number;
  onPlayPause: () => void;
  onStep: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onShuffle?: () => void;
  accentColor?:
    | 'indigo'
    | 'orange'
    | 'green'
    | 'purple'
    | 'blue'
    | 'cyan'
    | 'red'
    | 'lime'
    | 'teal'
    | 'violet';
  showShuffle?: boolean;
  shuffleLabel?: string;
  extraControls?: React.ReactNode;
}

const ACCENT_COLORS = {
  indigo: {
    playing: 'text-indigo-600',
    playingDot: 'bg-indigo-500',
    button: 'bg-indigo-600 hover:bg-indigo-700',
    buttonActive: 'bg-indigo-500 hover:bg-indigo-600',
  },
  orange: {
    playing: 'text-orange-600',
    playingDot: 'bg-orange-500',
    button: 'bg-orange-600 hover:bg-orange-700',
    buttonActive: 'bg-orange-500 hover:bg-orange-600',
  },
  green: {
    playing: 'text-green-600',
    playingDot: 'bg-green-500',
    button: 'bg-green-600 hover:bg-green-700',
    buttonActive: 'bg-green-500 hover:bg-green-600',
  },
  purple: {
    playing: 'text-purple-600',
    playingDot: 'bg-purple-500',
    button: 'bg-purple-600 hover:bg-purple-700',
    buttonActive: 'bg-purple-500 hover:bg-purple-600',
  },
  blue: {
    playing: 'text-blue-600',
    playingDot: 'bg-blue-500',
    button: 'bg-blue-600 hover:bg-blue-700',
    buttonActive: 'bg-blue-500 hover:bg-blue-600',
  },
  cyan: {
    playing: 'text-cyan-600',
    playingDot: 'bg-cyan-500',
    button: 'bg-cyan-600 hover:bg-cyan-700',
    buttonActive: 'bg-cyan-500 hover:bg-cyan-600',
  },
  red: {
    playing: 'text-red-600',
    playingDot: 'bg-red-500',
    button: 'bg-red-600 hover:bg-red-700',
    buttonActive: 'bg-red-500 hover:bg-red-600',
  },
  lime: {
    playing: 'text-lime-600',
    playingDot: 'bg-lime-500',
    button: 'bg-lime-600 hover:bg-lime-700',
    buttonActive: 'bg-lime-500 hover:bg-lime-600',
  },
  teal: {
    playing: 'text-teal-600',
    playingDot: 'bg-teal-500',
    button: 'bg-teal-600 hover:bg-teal-700',
    buttonActive: 'bg-teal-500 hover:bg-teal-600',
  },
  violet: {
    playing: 'text-violet-600',
    playingDot: 'bg-violet-500',
    button: 'bg-violet-600 hover:bg-violet-700',
    buttonActive: 'bg-violet-500 hover:bg-violet-600',
  },
};

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isPlaying,
  currentStep,
  totalSteps,
  speed,
  onPlayPause,
  onStep,
  onStepBack,
  onReset,
  onSpeedChange,
  onShuffle,
  accentColor = 'indigo',
  showShuffle = false,
  shuffleLabel,
  extraControls,
}) => {
  const colors = ACCENT_COLORS[accentColor];

  const speedLabelId = React.useId();

  return (
    <div className="flex items-center justify-between flex-wrap gap-3" role="toolbar" aria-label="Playback controls">
      {/* Playback Controls */}
      <div className="flex items-center gap-2" role="group" aria-label="Navigation">
        {isPlaying && (
          <span
            className={`flex items-center gap-1 text-xs ${colors.playing} font-medium`}
            aria-live="polite"
          >
            <span
              className={`w-2 h-2 ${colors.playingDot} rounded-full animate-pulse`}
              aria-hidden="true"
            />
            Playing
          </span>
        )}
        <button
          onClick={onPlayPause}
          className={`p-2 text-white rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 ${
            isPlaying ? colors.buttonActive : colors.button
          }`}
          title="Play/Pause (P)"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          aria-pressed={isPlaying}
          aria-keyshortcuts="p"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Play className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
        <button
          onClick={onStepBack}
          disabled={isPlaying || currentStep <= 0}
          aria-disabled={isPlaying || currentStep <= 0}
          className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
          title="Step Back ([)"
          aria-label="Step back"
          aria-keyshortcuts="["
        >
          <SkipBack className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={onStep}
          disabled={isPlaying || currentStep >= totalSteps - 1}
          aria-disabled={isPlaying || currentStep >= totalSteps - 1}
          className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
          title="Step Forward (])"
          aria-label="Step forward"
          aria-keyshortcuts="]"
        >
          <SkipForward className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={onReset}
          className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
          title="Reset (R)"
          aria-label="Reset"
          aria-keyshortcuts="r"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
        </button>
        {showShuffle && onShuffle && (
          <button
            onClick={onShuffle}
            disabled={isPlaying}
            aria-disabled={isPlaying}
            className={`bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 ${shuffleLabel ? 'px-3 py-2 text-sm' : 'p-2'}`}
            title={shuffleLabel || 'Shuffle'}
            aria-label={shuffleLabel || 'Shuffle'}
          >
            {shuffleLabel || <Shuffle className="w-4 h-4" aria-hidden="true" />}
          </button>
        )}
      </div>

      {/* Speed & Extra Controls */}
      <div className="flex items-center gap-4" role="group" aria-label="Speed control">
        <div className="flex items-center gap-2">
          <label id={speedLabelId} className="text-xs text-gray-500">Speed</label>
          <input
            type="range"
            min="1"
            max="100"
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-24 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            aria-labelledby={speedLabelId}
            aria-valuemin={1}
            aria-valuemax={100}
            aria-valuenow={speed}
          />
        </div>
        {extraControls}
      </div>
    </div>
  );
};

export default ControlPanel;
