import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyCodeButtonProps {
  code: string;
  onCopy?: () => void;
  onError?: (error: Error) => void;
}

export const CopyCodeButton: React.FC<CopyCodeButtonProps> = ({
  code,
  onCopy,
  onError,
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
        className="absolute top-1.5 right-1.5 p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors z-10"
        aria-label={copied ? 'Code copied' : 'Copy code to clipboard'}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
      {/* Screen reader announcement */}
      {copied && (
        <span role="status" aria-live="polite" className="sr-only">
          Code copied to clipboard
        </span>
      )}
    </>
  );
};
