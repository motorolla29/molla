'use client';

import { useState, useCallback } from 'react';
import {
  getCloudImageVariantUrl,
  type CloudImageVariant,
} from '@/utils/cloud-image';

export interface CloudImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** Полный URL оригинала или ключ объекта (path/file.jpg) */
  src: string;
  /** Какой вариант показывать. При ошибке загрузки подставится оригинал */
  variant?: CloudImageVariant;
}

export function CloudImage({
  src,
  variant = 'orig',
  alt = '',
  className,
  onError,
  ...rest
}: CloudImageProps) {
  const [useOriginal, setUseOriginal] = useState(false);

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (variant === 'orig' || useOriginal) {
        onError?.(e);
        return;
      }
      setUseOriginal(true);
      onError?.(e);
    },
    [variant, useOriginal, onError]
  );

  const displaySrc = getCloudImageVariantUrl(src, useOriginal ? 'orig' : variant);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={displaySrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
}
