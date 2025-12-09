import React from 'react';
import { VisualizerHeader, HeaderGradient } from './VisualizerHeader';
import { Badge } from './BadgeGroup';
import { ControlPanel, ControlPanelProps } from './ControlPanel';
import { Legend, LegendItem } from './Legend';
import { StatusPanel, StatusPanelProps } from './StatusPanel';
import { VisualizationArea } from './VisualizationArea';
import { CodePanel } from './CodePanel';
import { HelpPanel } from './HelpPanel';

export interface BaseVisualizerLayoutProps {
  /** Unique ID for accessibility */
  id: string;
  /** Title displayed in header */
  title: string;
  /** Complexity/feature badges */
  badges?: Badge[];
  /** Header gradient color scheme */
  gradient?: HeaderGradient;
  /** Share URL generator */
  onShare?: () => Promise<boolean>;

  /** Main visualization content */
  children: React.ReactNode;
  /** Minimum height for visualization area */
  minHeight?: number;
  /** If true, visualization area has fixed height (prevents layout shifts) */
  fixedHeight?: boolean;

  /** Side panel content (e.g., CodePanel, InterviewPanel) */
  sidePanel?: React.ReactNode;

  /** Status panel props */
  status?: StatusPanelProps;

  /** Playback control props */
  controls?: Omit<ControlPanelProps, 'className'>;
  /** Whether to show controls */
  showControls?: boolean;

  /** Legend items */
  legendItems?: LegendItem[];
  /** Whether to show keyboard hints in legend */
  showKeyboardHints?: boolean;

  /** Code panel content */
  code?: string[];
  /** Current highlighted line in code */
  currentCodeLine?: number;
  /** Variables to display in code panel */
  codeVariables?: Record<string, string | number>;
  /** Whether to show code panel */
  showCode?: boolean;

  /** Info box content (displayed above visualization) */
  infoBox?: React.ReactNode;

  /** Additional header content (between badges and share button) */
  headerExtra?: React.ReactNode;

  /** Additional content below controls */
  footer?: React.ReactNode;

  /** Custom className for outer container */
  className?: string;
}

/**
 * Base layout component for all visualizers.
 * Provides consistent structure: header, visualization area, controls, legend.
 */
export const BaseVisualizerLayout: React.FC<BaseVisualizerLayoutProps> = ({
  id,
  title,
  badges = [],
  gradient = 'indigo',
  onShare,
  children,
  minHeight = 400,
  fixedHeight = false,
  sidePanel,
  status,
  controls,
  showControls = true,
  legendItems = [],
  showKeyboardHints = true,
  code,
  currentCodeLine,
  codeVariables,
  showCode = true,
  infoBox,
  headerExtra,
  footer,
  className = '',
}) => {
  const hasCodePanel = showCode && code && code.length > 0;
  const hasSidePanel = sidePanel || hasCodePanel;

  return (
    <div
      id={id}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
      role="region"
      aria-label={title}
    >
      {/* Header */}
      <VisualizerHeader
        title={title}
        badges={badges}
        gradient={gradient}
        onShare={onShare}
        showShare={!!onShare}
      >
        {headerExtra}
      </VisualizerHeader>

      {/* Main Content */}
      <div className="p-4">
        {/* Info Box */}
        {infoBox}

        {/* Visualization + Side Panel */}
        <div className={`flex gap-4 ${hasSidePanel ? 'flex-col lg:flex-row lg:items-start' : ''}`}>
          {/* Main Visualization Area */}
          <VisualizationArea minHeight={minHeight} fixedHeight={fixedHeight} className="flex-1">
            {children}

            {/* Status Panel */}
            {status && (
              <div className="mt-4">
                <StatusPanel {...status} />
              </div>
            )}
          </VisualizationArea>

          {/* Side Panel (Code or Custom) - sticky on desktop */}
          {hasSidePanel && (
            <div className="lg:w-80 flex-shrink-0 flex flex-col gap-4 lg:sticky lg:top-4">
              {hasCodePanel && (
                <CodePanel
                  code={code}
                  activeLine={currentCodeLine ?? 0}
                  variables={codeVariables}
                />
              )}
              {sidePanel}
              <HelpPanel />
            </div>
          )}
        </div>
      </div>

      {/* Controls & Legend */}
      {showControls && (controls || legendItems.length > 0) && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          {controls && <ControlPanel {...controls} />}
          {legendItems.length > 0 && (
            <Legend items={legendItems} showKeyboardHints={showKeyboardHints} />
          )}
        </div>
      )}

      {/* Footer */}
      {footer}
    </div>
  );
};

export default BaseVisualizerLayout;
