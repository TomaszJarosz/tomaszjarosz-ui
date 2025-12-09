import React from 'react';

export type BadgeVariant = 'orange' | 'amber' | 'green' | 'blue' | 'indigo' | 'purple' | 'red' | 'gray' | 'teal' | 'cyan' | 'pink';

export interface Badge {
  label: string;
  variant: BadgeVariant;
}

export interface BadgeGroupProps {
  badges: Badge[];
  className?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  orange: 'bg-orange-100 text-orange-700',
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  purple: 'bg-purple-100 text-purple-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-700',
  teal: 'bg-teal-100 text-teal-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  pink: 'bg-pink-100 text-pink-700',
};

/**
 * Displays a group of colored badges for algorithm complexity or features
 */
export const BadgeGroup: React.FC<BadgeGroupProps> = ({ badges, className = '' }) => {
  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`} role="list" aria-label="Algorithm properties">
      {badges.map((badge, index) => (
        <span
          key={`${badge.label}-${index}`}
          className={`px-2 py-0.5 text-xs font-medium rounded ${VARIANT_STYLES[badge.variant]}`}
          role="listitem"
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
};

export default BadgeGroup;
