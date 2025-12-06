import React, { useState, useCallback } from 'react';
import { Share2, Check, Copy, X } from 'lucide-react';

export interface ShareButtonProps {
  onShare: () => Promise<boolean>;
  className?: string;
  accentColor?: 'indigo' | 'orange' | 'green' | 'purple' | 'blue' | 'cyan' | 'red' | 'lime' | 'teal' | 'violet';
}

const ACCENT_COLORS = {
  indigo: 'hover:bg-indigo-100 text-indigo-600',
  orange: 'hover:bg-orange-100 text-orange-600',
  green: 'hover:bg-green-100 text-green-600',
  purple: 'hover:bg-purple-100 text-purple-600',
  blue: 'hover:bg-blue-100 text-blue-600',
  cyan: 'hover:bg-cyan-100 text-cyan-600',
  red: 'hover:bg-red-100 text-red-600',
  lime: 'hover:bg-lime-100 text-lime-600',
  teal: 'hover:bg-teal-100 text-teal-600',
  violet: 'hover:bg-violet-100 text-violet-600',
};

type ShareState = 'idle' | 'copying' | 'success' | 'error';

export const ShareButton: React.FC<ShareButtonProps> = ({
  onShare,
  className = '',
  accentColor = 'indigo',
}) => {
  const [state, setState] = useState<ShareState>('idle');

  const handleClick = useCallback(async () => {
    if (state !== 'idle') return;

    setState('copying');
    try {
      const success = await onShare();
      setState(success ? 'success' : 'error');
    } catch {
      setState('error');
    }

    setTimeout(() => setState('idle'), 2000);
  }, [onShare, state]);

  const getIcon = () => {
    switch (state) {
      case 'copying':
        return <Copy className="w-4 h-4 animate-pulse" />;
      case 'success':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Share2 className="w-4 h-4" />;
    }
  };

  const getTitle = () => {
    switch (state) {
      case 'copying':
        return 'Copying...';
      case 'success':
        return 'URL copied!';
      case 'error':
        return 'Copy failed';
      default:
        return 'Share URL';
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={state !== 'idle'}
      className={`p-1.5 rounded transition-colors ${ACCENT_COLORS[accentColor]} disabled:opacity-50 ${className}`}
      title={getTitle()}
    >
      {getIcon()}
    </button>
  );
};

export default ShareButton;
