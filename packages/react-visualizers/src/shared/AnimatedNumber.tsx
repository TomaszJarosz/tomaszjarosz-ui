import React from 'react';
import { useAnimatedValue } from './useAnimatedValue';

export interface AnimatedNumberProps {
  /** The target value to animate to */
  value: number;
  /** Duration of animation in milliseconds */
  duration?: number;
  /** Number of decimal places to show */
  decimals?: number;
  /** Prefix to display before the number */
  prefix?: string;
  /** Suffix to display after the number */
  suffix?: string;
  /** CSS class for the container */
  className?: string;
  /** Format function for custom number formatting */
  format?: (value: number) => string;
}

/**
 * Component that animates number changes with smooth transitions
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 300,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  format,
}) => {
  const animatedValue = useAnimatedValue(value, { duration, easing: 'ease-out' });

  const displayValue = format
    ? format(animatedValue)
    : animatedValue.toFixed(decimals);

  return (
    <span className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};

export default AnimatedNumber;
