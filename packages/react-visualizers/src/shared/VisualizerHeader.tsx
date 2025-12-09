import React from 'react';
import { BadgeGroup, Badge } from './BadgeGroup';
import { ShareButton } from './ShareButton';

export type HeaderGradient =
  | 'orange'
  | 'amber'
  | 'green'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'red'
  | 'gray'
  | 'teal'
  | 'cyan'
  | 'pink';

export interface VisualizerHeaderProps {
  title: string;
  badges?: Badge[];
  gradient?: HeaderGradient;
  onShare?: () => Promise<boolean>;
  showShare?: boolean;
  children?: React.ReactNode;
}

const GRADIENT_STYLES: Record<HeaderGradient, string> = {
  orange: 'from-orange-50 to-amber-50',
  amber: 'from-amber-50 to-yellow-50',
  green: 'from-green-50 to-emerald-50',
  blue: 'from-blue-50 to-sky-50',
  indigo: 'from-indigo-50 to-purple-50',
  purple: 'from-purple-50 to-pink-50',
  red: 'from-red-50 to-rose-50',
  gray: 'from-gray-50 to-slate-50',
  teal: 'from-teal-50 to-cyan-50',
  cyan: 'from-cyan-50 to-sky-50',
  pink: 'from-pink-50 to-rose-50',
};

/**
 * Standard header for visualizers with title, badges, and share button
 */
export const VisualizerHeader: React.FC<VisualizerHeaderProps> = ({
  title,
  badges = [],
  gradient = 'indigo',
  onShare,
  showShare = true,
  children,
}) => {
  return (
    <div
      className={`px-4 py-3 bg-gradient-to-r ${GRADIENT_STYLES[gradient]} border-b border-gray-200`}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <BadgeGroup badges={badges} />
        </div>
        <div className="flex items-center gap-2">
          {children}
          {showShare && onShare && <ShareButton onShare={onShare} />}
        </div>
      </div>
    </div>
  );
};

export default VisualizerHeader;
