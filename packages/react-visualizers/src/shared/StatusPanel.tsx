import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export interface StatusPanelProps {
  description: string;
  currentStep: number;
  totalSteps: number;
  variant?: 'default' | 'success' | 'error' | 'warning';
}

const VARIANT_STYLES = {
  default: 'text-gray-700',
  success: 'text-green-700',
  error: 'text-red-700',
  warning: 'text-orange-700',
};

const VARIANT_ICONS = {
  default: null,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
};

const VARIANT_SR_PREFIX = {
  default: '',
  success: 'Success: ',
  error: 'Error: ',
  warning: 'Warning: ',
};

export const StatusPanel: React.FC<StatusPanelProps> = ({
  description,
  currentStep,
  totalSteps,
  variant = 'default',
}) => {
  const Icon = VARIANT_ICONS[variant];
  const srPrefix = VARIANT_SR_PREFIX[variant];

  // Animation state for description changes
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayedDescription, setDisplayedDescription] = useState(description);

  useEffect(() => {
    if (description !== displayedDescription) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayedDescription(description);
        setIsAnimating(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [description, displayedDescription]);

  // Progress percentage for visual indicator
  const progressPercent = totalSteps > 1 ? ((currentStep + 1) / totalSteps) * 100 : 100;

  return (
    <div
      className="p-3 bg-gray-50 rounded-lg overflow-hidden"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`text-sm font-medium ${VARIANT_STYLES[variant]} flex items-center gap-1.5 transition-all duration-150 ${
          isAnimating ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
        }`}
      >
        {Icon && (
          <Icon className="w-4 h-4 flex-shrink-0 animate-in fade-in duration-300" aria-hidden="true" />
        )}
        <span className="sr-only">{srPrefix}</span>
        {displayedDescription}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div
          className="text-xs text-gray-400 tabular-nums min-w-[60px] text-right"
          aria-label={`Step ${currentStep + 1} of ${totalSteps}`}
        >
          {currentStep + 1} / {totalSteps}
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
