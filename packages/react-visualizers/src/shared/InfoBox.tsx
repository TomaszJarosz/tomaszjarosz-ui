import React from 'react';

export type InfoBoxVariant = 'indigo' | 'purple' | 'orange' | 'green' | 'blue' | 'amber' | 'teal';

export interface InfoBoxProps {
  title: string;
  items: string[];
  variant?: InfoBoxVariant;
  className?: string;
  icon?: React.ReactNode;
}

const VARIANT_STYLES: Record<InfoBoxVariant, { bg: string; border: string; title: string; text: string }> = {
  indigo: {
    bg: 'from-indigo-50 to-purple-50',
    border: 'border-indigo-200',
    title: 'text-indigo-800',
    text: 'text-indigo-700',
  },
  purple: {
    bg: 'from-purple-50 to-pink-50',
    border: 'border-purple-200',
    title: 'text-purple-800',
    text: 'text-purple-700',
  },
  orange: {
    bg: 'from-orange-50 to-amber-50',
    border: 'border-orange-200',
    title: 'text-orange-800',
    text: 'text-orange-700',
  },
  green: {
    bg: 'from-green-50 to-emerald-50',
    border: 'border-green-200',
    title: 'text-green-800',
    text: 'text-green-700',
  },
  blue: {
    bg: 'from-blue-50 to-sky-50',
    border: 'border-blue-200',
    title: 'text-blue-800',
    text: 'text-blue-700',
  },
  amber: {
    bg: 'from-amber-50 to-orange-50',
    border: 'border-amber-200',
    title: 'text-amber-800',
    text: 'text-amber-700',
  },
  teal: {
    bg: 'from-teal-50 to-cyan-50',
    border: 'border-teal-200',
    title: 'text-teal-800',
    text: 'text-teal-700',
  },
};

/**
 * Information box displayed at the top of visualizations
 * Contains algorithm description with bullet points
 */
export const InfoBox: React.FC<InfoBoxProps> = ({
  title,
  items,
  variant = 'indigo',
  className = '',
  icon,
}) => {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className={`mb-4 p-3 bg-gradient-to-r ${styles.bg} rounded-lg border ${styles.border} ${className}`}
      role="note"
      aria-label={`${title} information`}
    >
      <div className={`text-sm font-semibold ${styles.title} mb-2 flex items-center gap-2`}>
        {icon}
        {title}
      </div>
      <ul className={`text-xs ${styles.text} space-y-1`}>
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-1">
            <span aria-hidden="true">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InfoBox;
