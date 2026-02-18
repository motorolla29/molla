/** При загрузке: formData.append('variants', 'xs') или 'xs,sm,md'. Не передавать — только оригинал. */
export const CLOUD_UPLOAD_VARIANTS_ALL = 'xs,sm,md';

export type CloudImageVariant = 'xs' | 'sm' | 'md' | 'orig';

const BASE_URL =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CLOUD_PUBLIC_BASE_URL
    ? process.env.NEXT_PUBLIC_CLOUD_PUBLIC_BASE_URL.replace(/\/+$/, '')
    : '';

/**
 * Строит URL картинки для заданного варианта.
 * @param src — полный URL оригинала (https://.../path/file.jpg) или ключ (path/file.jpg)
 * @param variant — 'orig' | 'xs' | 'sm' | 'md'
 */
export function getCloudImageVariantUrl(
  src: string,
  variant: CloudImageVariant
): string {
  if (variant === 'orig') {
    if (src.startsWith('http')) return src;
    return BASE_URL ? `${BASE_URL}/${src.replace(/^\/+/, '')}` : src;
  }

  const base = BASE_URL || '';
  let path: string;

  if (src.startsWith('http')) {
    try {
      const u = new URL(src);
      path = u.pathname.replace(/^\/+/, '');
    } catch {
      return src;
    }
  } else {
    path = src.replace(/^\/+/, '');
  }

  const dotIndex = path.lastIndexOf('.');
  const ext = dotIndex === -1 ? '.jpg' : path.slice(dotIndex);
  const pathWithoutExt = dotIndex === -1 ? path : path.slice(0, dotIndex);
  const lastSlash = pathWithoutExt.lastIndexOf('/');
  const folder = lastSlash === -1 ? '' : pathWithoutExt.slice(0, lastSlash + 1);
  const fileName = lastSlash === -1 ? pathWithoutExt : pathWithoutExt.slice(lastSlash + 1);
  const variantPath = `${folder}${variant}__${fileName}${ext}`;

  return base ? `${base}/${variantPath}` : variantPath;
}
