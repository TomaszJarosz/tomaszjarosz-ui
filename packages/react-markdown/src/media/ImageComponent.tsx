import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

export interface ImageProps {
  src?: string;
  alt?: string;
  /** Custom class name for the image wrapper */
  className?: string;
  /** Custom class name for the image element */
  imageClassName?: string;
  /** Whether to show caption (alt text) below image */
  showCaption?: boolean;
  /** Custom loading placeholder */
  loadingPlaceholder?: React.ReactNode;
  /** Custom error component */
  errorComponent?: React.ReactNode;
}

export const ImageComponent: React.FC<ImageProps> = ({
  src,
  alt,
  className,
  imageClassName,
  showCaption = true,
  loadingPlaceholder,
  errorComponent,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }

    return (
      <div className={className || "my-8"}>
        <div
          className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg border border-gray-200"
          role="img"
          aria-label={alt || 'Image failed to load'}
        >
          <ImageOff className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Failed to load image</p>
          {alt && <p className="text-xs text-gray-400 mt-1 italic">{alt}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={className || "my-8"}>
      {isLoading && (
        loadingPlaceholder || (
          <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full" />
        )
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        className={imageClassName || `max-w-full h-auto rounded-lg shadow-lg mx-auto border border-gray-200 ${
          isLoading ? 'hidden' : ''
        }`}
      />
      {showCaption && alt && !isLoading && (
        <p className="text-center text-sm text-gray-500 mt-3 italic px-4 sm:px-0">
          {alt}
        </p>
      )}
    </div>
  );
};
