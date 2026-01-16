import React from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fallback?: boolean;
  onClick?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = React.memo(({
  src,
  alt,
  width = 100,
  height = 100,
  className = '',
  priority = false,
  fallback = false,
  onClick
}) => {
  // Use fallback img tag if specified or if src is not a valid URL
  if (fallback || !src.startsWith('http') && !src.startsWith('/')) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      />
    );
  }

  // Use Next.js Image for optimization
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';
