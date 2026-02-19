import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';

export type CloudImageVariant = 'xs' | 'sm' | 'md';

const cloudKeyId = process.env.CLOUD_KEY_ID;
const cloudKeySecret = process.env.CLOUD_KEY_SECRET;
const cloudEndpoint = process.env.CLOUD_S3_ENDPOINT;
const cloudRegion = process.env.CLOUD_REGION || 'ru-1';
const cloudBucket = process.env.CLOUD_BUCKET_NAME;
const cloudPublicBaseUrl = process.env.CLOUD_PUBLIC_BASE_URL;
/** Путь к watermark: локальный файл (public/logo/...) или ключ в cloud (icons/...) */
const watermarkPath = process.env.WATERMARK_PATH ?? 'logo/watermark.png';

let s3Client: S3Client | null = null;

function getS3Client() {
  if (!cloudKeyId || !cloudKeySecret || !cloudEndpoint) {
    throw new Error('Cloud storage credentials are not fully configured');
  }
  if (!s3Client) {
    s3Client = new S3Client({
      region: cloudRegion,
      endpoint: cloudEndpoint,
      credentials: {
        accessKeyId: cloudKeyId,
        secretAccessKey: cloudKeySecret,
      },
      forcePathStyle: true,
    });
  }
  return s3Client;
}

function buildPublicUrl(objectKey: string) {
  if (!cloudPublicBaseUrl) {
    throw new Error('CLOUD_PUBLIC_BASE_URL is not configured');
  }
  const base = cloudPublicBaseUrl.replace(/\/+$/, '');
  return `${base}/${objectKey.replace(/^\/+/, '')}`;
}

function normalizeFolder(folder: string) {
  return (folder || '').replace(/^\/+/, '').replace(/\/+$/, '');
}

function splitKey(originalKey: string) {
  const dotIndex = originalKey.lastIndexOf('.');
  const nameWithoutExt =
    dotIndex === -1 ? originalKey : originalKey.slice(0, dotIndex);
  const ext = dotIndex === -1 ? '' : originalKey.slice(dotIndex);

  const lastSlashIndex = nameWithoutExt.lastIndexOf('/');
  const folder =
    lastSlashIndex === -1 ? '' : nameWithoutExt.slice(0, lastSlashIndex + 1);
  const fileName =
    lastSlashIndex === -1
      ? nameWithoutExt
      : nameWithoutExt.slice(lastSlashIndex + 1);

  return { folder, fileName, ext: ext || '.jpg' };
}

function extToFormat(ext: string) {
  const lower = (ext || '').toLowerCase();
  if (lower === '.jpg' || lower === '.jpeg') return 'jpeg' as const;
  if (lower === '.png') return 'png' as const;
  if (lower === '.webp') return 'webp' as const;
  if (lower === '.avif') return 'avif' as const;
  return 'jpeg' as const;
}

function guessContentType(fileType: string | undefined, fileName: string) {
  if (fileType && typeof fileType === 'string' && fileType.trim()) {
    return fileType;
  }
  const lower = (fileName || '').toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.avif')) return 'image/avif';
  return 'application/octet-stream';
}

const VARIANT_WIDTH: Record<CloudImageVariant, number> = {
  xs: 80,
  sm: 200,
  md: 350,
};

/** Макс. сторона оригинала (px). Уменьшает 4000×3000 → ~2560 без потери качества для веба */
const MAX_ORIGINAL_SIDE = 2560;

/** Размер watermark относительно меньшей стороны изображения (0.1 = 10%) */
const WATERMARK_SIZE_RATIO = 0.15;
/** Отступ watermark от края как доля minSide (например, 0.02 = 2%) */
const WATERMARK_PADDING_RATIO = 0.02;
/** Минимальный/максимальный отступ watermark (px) */
const WATERMARK_PADDING_MIN = 6;
const WATERMARK_PADDING_MAX = 32;
/**
 * Watermark будет PNG с alpha (встроенной прозрачностью),
 * поэтому отдельная обработка opacity не нужна.
 */

let watermarkCache: Buffer | null | undefined;

/**
 * Загружает watermark из локального файла или cloud storage
 */
async function loadWatermark(): Promise<Buffer | null> {
  if (!watermarkPath) {
    console.log('[watermark] WATERMARK_PATH не задан, пропускаем');
    return null;
  }

  if (watermarkCache !== undefined) return watermarkCache;

  console.log('[watermark] загрузка watermark, путь:', watermarkPath);

  try {
    // Cloud storage: ключ вида icons/watermark.png
    if (
      cloudBucket &&
      (watermarkPath.startsWith('icons/') ||
        watermarkPath.startsWith('ad-photos/'))
    ) {
      console.log('[watermark] попытка загрузки из cloud:', watermarkPath);
      const client = getS3Client();
      const response = await client.send(
        new GetObjectCommand({
          Bucket: cloudBucket,
          Key: watermarkPath,
        }),
      );
      if (response.Body) {
        const chunks: Uint8Array[] = [];
        for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
          chunks.push(chunk);
        }
        const buf = Buffer.concat(chunks);
        console.log('[watermark] загружено из cloud, размер:', buf.length);
        watermarkCache = buf;
        return watermarkCache;
      }
      console.warn('[watermark] cloud объект пуст');
      watermarkCache = null;
      return watermarkCache;
    }

    // Локальный файл: public/logo/... или абсолютный путь
    const isAbsolute =
      watermarkPath.startsWith('/') && watermarkPath.length > 1;
    const filePath = isAbsolute
      ? watermarkPath
      : join(process.cwd(), 'public', watermarkPath);

    console.log('[watermark] читаем локальный файл:', filePath);
    const buf = readFileSync(filePath);
    console.log('[watermark] загружено локально, размер:', buf.length);
    watermarkCache = buf;
    return watermarkCache;
  } catch (error) {
    console.warn('[watermark] failed to load watermark:', error);
    watermarkCache = null;
    return watermarkCache;
  }
}

/**
 * Накладывает watermark на изображение через Sharp composite
 */
async function applyWatermark(
  imageBuffer: Buffer,
  imageWidth: number,
  imageHeight: number,
): Promise<Buffer> {
  const watermarkBuffer = await loadWatermark();
  if (!watermarkBuffer) {
    console.log('[watermark] watermark не загружен, пропускаем наложение');
    return imageBuffer;
  }

  try {
    // Вычисляем размер watermark (10% от меньшей стороны)
    const minSide = Math.min(imageWidth, imageHeight);
    const targetSize = Math.max(
      Math.floor(minSide * WATERMARK_SIZE_RATIO),
      50, // минимум 50px
    );
    const padding = Math.max(
      WATERMARK_PADDING_MIN,
      Math.min(
        WATERMARK_PADDING_MAX,
        Math.round(minSide * WATERMARK_PADDING_RATIO),
      ),
    );

    const watermarkMeta = await sharp(watermarkBuffer).metadata();
    let wWidth = watermarkMeta.width;
    let wHeight = watermarkMeta.height;
    const isSvg = watermarkBuffer.toString('utf8', 0, 100).includes('<svg');
    if ((!wWidth || !wHeight) && isSvg) {
      // SVG: рендерим и берём размеры
      const rendered = await sharp(watermarkBuffer)
        .resize(targetSize)
        .png()
        .toBuffer();
      const meta = await sharp(rendered).metadata();
      wWidth = meta.width;
      wHeight = meta.height;
    }
    if (!wWidth || !wHeight) {
      console.warn(
        '[watermark] не удалось получить размеры watermark',
        watermarkMeta,
      );
      return imageBuffer;
    }
    console.log(
      '[watermark] наложение на',
      imageWidth,
      'x',
      imageHeight,
      ', watermark',
      wWidth,
      'x',
      wHeight,
    );

    // Масштабируем watermark, сохраняя пропорции
    // Для прозрачности: если watermark PNG с alpha каналом, Sharp автоматически использует его
    // Для непрозрачных форматов добавляем alpha канал
    let watermarkResized = await sharp(watermarkBuffer)
      .resize(targetSize, targetSize, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .ensureAlpha()
      .toBuffer();

    const watermarkMetaResized = await sharp(watermarkResized).metadata();
    if (!watermarkMetaResized.width || !watermarkMetaResized.height) {
      return imageBuffer;
    }

    // Позиция: правый нижний угол с отступом
    const left = imageWidth - watermarkMetaResized.width - padding;
    const top = imageHeight - watermarkMetaResized.height - padding;

    // Накладываем watermark через composite
    const result = await sharp(imageBuffer)
      .composite([
        {
          input: watermarkResized,
          left: Math.max(0, left),
          top: Math.max(0, top),
          blend: 'over',
        },
      ])
      .toBuffer();
    console.log('[watermark] успешно наложен');
    return result;
  } catch (error) {
    console.warn('[watermark] applyWatermark failed:', error);
    return imageBuffer;
  }
}

async function optimizeBuffer(
  input: Buffer,
  ext: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const format = extToFormat(ext);
  try {
    // rotate() без аргументов применяет EXIF Orientation — исправляет "вертикальное стало горизонтальным"
    let pipeline = sharp(input)
      .rotate()
      .resize(MAX_ORIGINAL_SIDE, MAX_ORIGINAL_SIDE, {
        fit: 'inside',
        withoutEnlargement: true,
      });

    // Конвертируем в буфер
    let processedBuffer: Buffer;
    if (format === 'png') {
      processedBuffer = await pipeline.png({ compressionLevel: 9 }).toBuffer();
    } else if (format === 'webp') {
      processedBuffer = await pipeline.webp({ quality: 90 }).toBuffer();
    } else if (format === 'avif') {
      processedBuffer = await pipeline.avif({ quality: 55 }).toBuffer();
    } else {
      processedBuffer = await pipeline
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer();
    }

    // Размеры берём из финального буфера (после resize!), иначе watermark уходит за границы
    const { width, height } = await sharp(processedBuffer).metadata();

    // Накладываем watermark на обработанное изображение
    const withWatermark = await applyWatermark(
      processedBuffer,
      width || 0,
      height || 0,
    );

    // Определяем contentType на основе формата
    let contentType: string;
    if (format === 'png') {
      contentType = 'image/png';
    } else if (format === 'webp') {
      contentType = 'image/webp';
    } else if (format === 'avif') {
      contentType = 'image/avif';
    } else {
      contentType = 'image/jpeg';
    }

    return {
      buffer: withWatermark,
      contentType,
    };
  } catch {
    // Если оптимизация не удалась — возвращаем как есть
    return {
      buffer: input,
      contentType: guessContentType(undefined, `x${ext}`),
    };
  }
}

async function generateAndUploadVariantsInBackground(params: {
  originalBuffer: Buffer;
  originalKey: string;
  contentType: string;
  variants: CloudImageVariant[];
}) {
  if (!cloudBucket) throw new Error('CLOUD_BUCKET_NAME is not configured');

  const client = getS3Client();
  const { folder, fileName, ext } = splitKey(params.originalKey);
  const format = extToFormat(ext);

  // Некоторые форматы не стоит/не получается ресайзить корректно под тем же ext
  if (
    format !== 'jpeg' &&
    format !== 'png' &&
    format !== 'webp' &&
    format !== 'avif'
  ) {
    return;
  }

  await Promise.all(
    params.variants.map(async (variant) => {
      const width = VARIANT_WIDTH[variant];
      const variantKey = `${folder}${variant}__${fileName}${ext}`;

      const resized = sharp(params.originalBuffer)
        .rotate()
        .resize(width, undefined, {
          withoutEnlargement: true,
          fit: 'inside',
        });

      let out: Buffer;
      let outContentType = params.contentType;

      if (format === 'png') {
        out = await resized.png({ compressionLevel: 9 }).toBuffer();
        outContentType = 'image/png';
      } else if (format === 'webp') {
        out = await resized.webp({ quality: 88 }).toBuffer();
        outContentType = 'image/webp';
      } else if (format === 'avif') {
        out = await resized.avif({ quality: 55 }).toBuffer();
        outContentType = 'image/avif';
      } else {
        out = await resized.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
        outContentType = 'image/jpeg';
      }

      // Накладываем watermark на варианты (только для md и sm). Размеры — из финального буфера!
      const outMeta = await sharp(out).metadata();
      const variantWidth = outMeta.width || width;
      const variantHeight = outMeta.height || 0;
      if (variant !== 'xs' && variantHeight > 100) {
        out = await applyWatermark(out, variantWidth, variantHeight);
      }

      await client.send(
        new PutObjectCommand({
          Bucket: cloudBucket,
          Key: variantKey,
          Body: out,
          ContentType: outContentType,
        }),
      );
    }),
  );
}

export async function uploadImageToCloud(params: {
  file: Blob;
  folder?: string;
  fileName: string;
  variants?: CloudImageVariant[];
}) {
  if (!cloudBucket) throw new Error('CLOUD_BUCKET_NAME is not configured');
  if (!cloudPublicBaseUrl)
    throw new Error('CLOUD_PUBLIC_BASE_URL is not configured');

  const folder = normalizeFolder(params.folder || '/photos');
  const objectKey = `${folder ? `${folder}/` : ''}${params.fileName}`;

  console.log(
    '[cloud-upload] загрузка:',
    objectKey,
    '| WATERMARK_PATH:',
    watermarkPath || '(не задан)',
  );

  const arrayBuffer = await params.file.arrayBuffer();
  const originalBuffer = Buffer.from(arrayBuffer);

  const { ext } = splitKey(objectKey);
  const optimized = await optimizeBuffer(originalBuffer, ext);
  const contentType = guessContentType(
    (params.file as any).type,
    params.fileName,
  );

  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: cloudBucket,
      Key: objectKey,
      Body: optimized.buffer,
      ContentType: contentType || optimized.contentType,
    }),
  );

  const variants = (params.variants || []).filter(Boolean);
  if (variants.length > 0) {
    // Фоном, не ждём ответа
    void generateAndUploadVariantsInBackground({
      originalBuffer,
      originalKey: objectKey,
      contentType: contentType || optimized.contentType,
      variants,
    }).catch((err) => {
      console.error('[uploadImageToCloud] failed to generate variants', err);
    });
  }

  return {
    objectKey,
    url: buildPublicUrl(objectKey),
  };
}
