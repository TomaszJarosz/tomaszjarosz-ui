import React from 'react';

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

export const StatusPanel: React.FC<StatusPanelProps> = ({
  description,
  currentStep,
  totalSteps,
  variant = 'default',
}) => {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className={`text-sm font-medium ${VARIANT_STYLES[variant]}`}>
        {description}
      </div>
      <div className="mt-1 text-xs text-gray-400">
        Step {currentStep + 1} / {totalSteps}
      </div>
    </div>
  );
};

export default StatusPanel;
