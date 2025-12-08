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
      <div className={className || 'rm-image-wrapper'}>
        <div className="rm-image-error" role="img" aria-label={alt || 'Image failed to load'}>
          <ImageOff className="rm-image-error-icon" />
          <p className="rm-image-error-text">Failed to load image</p>
          {alt && <p className="rm-image-error-alt">{alt}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={className || 'rm-image-wrapper'}>
      {isLoading && (loadingPlaceholder || <div className="rm-image-loading" />)}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        className={imageClassName || `rm-image${isLoading ? ' rm-image-hidden' : ''}`}
      />
      {showCaption && alt && !isLoading && (
        <p className="rm-image-caption">{alt}</p>
      )}
    </div>
  );
};
