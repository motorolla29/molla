import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

export type CloudImageVariant = 'xs' | 'sm' | 'md';

const cloudKeyId = process.env.CLOUD_KEY_ID;
const cloudKeySecret = process.env.CLOUD_KEY_SECRET;
const cloudEndpoint = process.env.CLOUD_S3_ENDPOINT;
const cloudRegion = process.env.CLOUD_REGION || 'ru-1';
const cloudBucket = process.env.CLOUD_BUCKET_NAME;
const cloudPublicBaseUrl = process.env.CLOUD_PUBLIC_BASE_URL;

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

async function optimizeBuffer(
  input: Buffer,
  ext: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const format = extToFormat(ext);
  try {
    const pipeline = sharp(input);
    if (format === 'png') {
      return {
        buffer: await pipeline.png({ compressionLevel: 9 }).toBuffer(),
        contentType: 'image/png',
      };
    }
    if (format === 'webp') {
      return {
        buffer: await pipeline.webp({ quality: 90 }).toBuffer(),
        contentType: 'image/webp',
      };
    }
    if (format === 'avif') {
      return {
        buffer: await pipeline.avif({ quality: 55 }).toBuffer(),
        contentType: 'image/avif',
      };
    }
    return {
      buffer: await pipeline.jpeg({ quality: 92, mozjpeg: true }).toBuffer(),
      contentType: 'image/jpeg',
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

      const resized = sharp(params.originalBuffer).resize(width, undefined, {
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
