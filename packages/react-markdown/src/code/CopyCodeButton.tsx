import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyCodeButtonProps {
  code: string;
  onCopy?: () => void;
  onError?: (error: Error) => void;
  /** Custom class name */
  className?: string;
}

export const CopyCodeButton: React.FC<CopyCodeButtonProps> = ({
  code,
  onCopy,
  onError,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  // Reset copied state after 2 seconds with proper cleanup
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopy?.();
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error('Failed to copy'));
    }
  };

  return (
    <>
      <button
        onClick={handleCopy}
        className={className || `rm-copy-button${copied ? ' rm-copy-button-success' : ''}`}
        aria-label={copied ? 'Code copied' : 'Copy code to clipboard'}
      >
        {copied ? <Check /> : <Copy />}
      </button>
      {/* Screen reader announcement */}
      {copied && (
        <span role="status" aria-live="polite" className="rm-sr-only">
          Code copied to clipboard
        </span>
      )}
    </>
  );
};
