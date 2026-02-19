'use client';

import { useState, useCallback, useEffect } from 'react';
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
  const [forceKey, setForceKey] = useState(0);

  // Сбрасываем состояние при изменении src или variant
  useEffect(() => {
    setUseOriginal(false);
    setForceKey((prev) => prev + 1);
  }, [src, variant]);

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (variant === 'orig' || useOriginal) {
        onError?.(e);
        return;
      }
      // Переключаемся на оригинал
      setUseOriginal(true);
      setForceKey((prev) => prev + 1);
    },
    [src, variant, useOriginal, onError]
  );

  const displaySrc = getCloudImageVariantUrl(src, useOriginal ? 'orig' : variant);
  // Используем key для принудительного перерендера при изменении src/variant или переключении на оригинал
  const imgKey = `${src}-${variant}-${useOriginal}-${forceKey}`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      key={imgKey}
      src={displaySrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
}
