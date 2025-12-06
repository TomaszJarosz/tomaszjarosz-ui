import React, { useRef, useEffect } from 'react';
import { History, ChevronRight, ChevronDown } from 'lucide-react';

export interface Step {
  description: string;
  comparisons?: number;
  swaps?: number;
}

export interface StepHistoryProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
  maxHeight?: string;
  showStats?: boolean;
  accentColor?: 'indigo' | 'orange' | 'green' | 'purple' | 'blue' | 'cyan' | 'red' | 'lime' | 'teal' | 'violet';
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ACCENT_COLORS = {
  indigo: {
    active: 'bg-indigo-100 border-indigo-500 text-indigo-900',
    hover: 'hover:bg-indigo-50',
    dot: 'bg-indigo-500',
  },
  orange: {
    active: 'bg-orange-100 border-orange-500 text-orange-900',
    hover: 'hover:bg-orange-50',
    dot: 'bg-orange-500',
  },
  green: {
    active: 'bg-green-100 border-green-500 text-green-900',
    hover: 'hover:bg-green-50',
    dot: 'bg-green-500',
  },
  purple: {
    active: 'bg-purple-100 border-purple-500 text-purple-900',
    hover: 'hover:bg-purple-50',
    dot: 'bg-purple-500',
  },
  blue: {
    active: 'bg-blue-100 border-blue-500 text-blue-900',
    hover: 'hover:bg-blue-50',
    dot: 'bg-blue-500',
  },
  cyan: {
    active: 'bg-cyan-100 border-cyan-500 text-cyan-900',
    hover: 'hover:bg-cyan-50',
    dot: 'bg-cyan-500',
  },
  red: {
    active: 'bg-red-100 border-red-500 text-red-900',
    hover: 'hover:bg-red-50',
    dot: 'bg-red-500',
  },
  lime: {
    active: 'bg-lime-100 border-lime-500 text-lime-900',
    hover: 'hover:bg-lime-50',
    dot: 'bg-lime-500',
  },
  teal: {
    active: 'bg-teal-100 border-teal-500 text-teal-900',
    hover: 'hover:bg-teal-50',
    dot: 'bg-teal-500',
  },
  violet: {
    active: 'bg-violet-100 border-violet-500 text-violet-900',
    hover: 'hover:bg-violet-50',
    dot: 'bg-violet-500',
  },
};

export const StepHistory: React.FC<StepHistoryProps> = ({
  steps,
  currentStep,
  onStepClick,
  maxHeight = '300px',
  showStats = false,
  accentColor = 'indigo',
  collapsed = false,
  onToggleCollapse,
}) => {
  const colors = ACCENT_COLORS[accentColor];
  const listRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to current step
  useEffect(() => {
    if (activeItemRef.current && listRef.current) {
      const container = listRef.current;
      const item = activeItemRef.current;
      const containerRect = container.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();

      if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep]);

  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        title="Show step history"
      >
        <History className="w-4 h-4" />
        <span>History ({steps.length})</span>
        <ChevronRight className="w-3 h-3" />
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">
            Step History
          </span>
          <span className="px-1.5 py-0.5 text-[10px] bg-gray-200 text-gray-600 rounded">
            {currentStep + 1}/{steps.length}
          </span>
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Collapse history"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Step List */}
      <div
        ref={listRef}
        className="overflow-y-auto"
        style={{ maxHeight }}
      >
        <div className="divide-y divide-gray-100">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isPast = index < currentStep;

            return (
              <button
                key={index}
                ref={isActive ? activeItemRef : null}
                onClick={() => onStepClick(index)}
                className={`w-full flex items-start gap-2 px-3 py-2 text-left transition-colors border-l-2 ${
                  isActive
                    ? `${colors.active} border-l-2`
                    : isPast
                      ? `text-gray-500 border-transparent ${colors.hover}`
                      : `text-gray-700 border-transparent ${colors.hover}`
                }`}
              >
                {/* Step Number */}
                <div className="flex-shrink-0 mt-0.5">
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 text-[10px] font-medium rounded-full ${
                      isActive
                        ? `${colors.dot} text-white`
                        : isPast
                          ? 'bg-gray-300 text-gray-600'
                          : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[11px] leading-tight truncate ${
                      isActive ? 'font-medium' : ''
                    }`}
                    title={step.description}
                  >
                    {step.description}
                  </p>
                  {showStats && step.comparisons !== undefined && (
                    <div className="flex gap-2 mt-0.5 text-[9px] text-gray-400">
                      <span>C: {step.comparisons}</span>
                      <span>S: {step.swaps ?? 0}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StepHistory;
