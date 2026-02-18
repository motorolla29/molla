import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { verifyToken } from '@/lib/jwt';
import sharp from 'sharp';

export const runtime = 'nodejs';

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

// Размеры для вариантов
const VARIANT_SIZES: Record<'xs' | 'sm' | 'md', number> = {
  xs: 80,
  sm: 200,
  md: 350,
};

// Функция для генерации и загрузки вариантов в фоне
async function generateAndUploadVariants(
  originalBuffer: Buffer,
  originalKey: string,
  variants: Array<'xs' | 'sm' | 'md'>,
  s3Client: S3Client,
) {
  const dotIndex = originalKey.lastIndexOf('.');
  const nameWithoutExt = dotIndex === -1 ? originalKey : originalKey.slice(0, dotIndex);
  const ext = dotIndex === -1 ? '.jpg' : originalKey.slice(dotIndex);
  
  // Разделяем путь на папку и имя файла
  const lastSlashIndex = nameWithoutExt.lastIndexOf('/');
  const folder = lastSlashIndex === -1 ? '' : nameWithoutExt.slice(0, lastSlashIndex + 1);
  const fileName = lastSlashIndex === -1 ? nameWithoutExt : nameWithoutExt.slice(lastSlashIndex + 1);

  const uploadPromises = variants.map(async (variant) => {
    const width = VARIANT_SIZES[variant];
    // Формируем ключ варианта: папка + префикс + имя файла + расширение
    const variantKey = `${folder}${variant}__${fileName}${ext}`;

    try {
      // Генерируем вариант через sharp
      const variantBuffer = await sharp(originalBuffer)
        .resize(width, undefined, {
          withoutEnlargement: true, // Не увеличиваем маленькие картинки
          fit: 'inside', // Сохраняем пропорции
        })
        .jpeg({ quality: 90, mozjpeg: true }) // Оптимизация
        .toBuffer();

      // Загружаем вариант в S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: cloudBucket!,
          Key: variantKey,
          Body: variantBuffer,
          ContentType: 'image/jpeg',
          ACL: 'public-read',
        }),
      );

      console.log('[cloud-upload-photo] variant uploaded:', { variant, variantKey });
    } catch (err) {
      console.error(`[cloud-upload-photo] failed to generate variant ${variant}:`, err);
      throw err;
    }
  });

  await Promise.all(uploadPromises);
  console.log('[cloud-upload-photo] all variants generated and uploaded');
}

export async function POST(request: NextRequest) {
  try {
    console.log('[cloud-upload-photo] incoming request');

    const token = request.cookies.get('token')?.value;
    if (!token) {
      console.warn('[cloud-upload-photo] no auth token cookie');
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      console.warn('[cloud-upload-photo] invalid token payload', { payload });
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    if (!cloudBucket || !cloudPublicBaseUrl) {
      console.error(
        'Cloud storage bucket or public base URL is not configured',
      );
      return NextResponse.json(
        { error: 'Image upload is not configured' },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    console.log('[cloud-upload-photo] formData received');
    const file = formData.get('file');
    const folder = (formData.get('folder') as string | null) || '/photos';
    const fileName =
      (formData.get('fileName') as string | null) || 'ad-image-' + Date.now();
    
    // Не передали variants — только оригинал; передали "xs" или "xs,sm,md" — оригинал + эти варианты.
    const variantsParam = (formData.get('variants') as string | null) ?? '';
    const requestedVariants = variantsParam
      .split(',')
      .map((v) => v.trim())
      .filter((v) => ['xs', 'sm', 'md'].includes(v)) as Array<'xs' | 'sm' | 'md'>;

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'Файл не найден в запросе' },
        { status: 400 },
      );
    }

    const cleanFolder = folder.replace(/^\/+/, '').replace(/\/+$/, '');
    // Если прилетает путь вида /molla/xxx — убираем префикс molla/
    const folderWithoutMolla = cleanFolder.startsWith('molla/')
      ? cleanFolder.slice('molla/'.length)
      : cleanFolder === 'molla'
        ? ''
        : cleanFolder;
    const objectKey = `${folderWithoutMolla ? `${folderWithoutMolla}/` : ''}${fileName}`;
    console.log('[cloud-upload-photo] prepared object key', {
      folder,
      cleanFolder,
      fileName,
      objectKey,
    });

    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);

    // Определяем формат и оптимизируем оригинал без потери качества
    const fileType = (file as any).type || '';
    let optimizedOriginal: Buffer;
    let contentType: string;

    try {
      if (fileType.includes('png')) {
        // PNG конвертируем в JPEG с высоким качеством
        optimizedOriginal = await sharp(originalBuffer)
          .jpeg({ quality: 95, mozjpeg: true })
          .toBuffer();
        contentType = 'image/jpeg';
      } else if (fileType.includes('jpeg') || fileType.includes('jpg')) {
        // JPEG оптимизируем без изменения формата
        optimizedOriginal = await sharp(originalBuffer)
          .jpeg({ quality: 95, mozjpeg: true })
          .toBuffer();
        contentType = 'image/jpeg';
      } else if (fileType.includes('webp')) {
        // WebP конвертируем в JPEG
        optimizedOriginal = await sharp(originalBuffer)
          .jpeg({ quality: 95, mozjpeg: true })
          .toBuffer();
        contentType = 'image/jpeg';
      } else {
        // Для других форматов пробуем конвертировать в JPEG
        optimizedOriginal = await sharp(originalBuffer)
          .jpeg({ quality: 95, mozjpeg: true })
          .toBuffer();
        contentType = 'image/jpeg';
      }
    } catch (err) {
      // Если sharp не справился - используем оригинал
      console.warn('[cloud-upload-photo] failed to optimize, using original:', err);
      optimizedOriginal = originalBuffer;
      contentType = fileType || 'image/jpeg';
    }

    console.log('[cloud-upload-photo] creating S3 client');
    const client = getS3Client();
    
    // Загружаем оптимизированный оригинал сразу
    console.log('[cloud-upload-photo] uploading optimized original', {
      bucket: cloudBucket,
      key: objectKey,
    });

    await client.send(
      new PutObjectCommand({
        Bucket: cloudBucket,
        Key: objectKey,
        Body: optimizedOriginal,
        ContentType: contentType,
        ACL: 'public-read',
      }),
    );

    console.log('[cloud-upload-photo] original uploaded successfully', { objectKey });

    const publicBase = cloudPublicBaseUrl.replace(/\/+$/, '');
    const url = `${publicBase}/${objectKey}`;

    // Генерируем и загружаем варианты в фоне (не ждём)
    if (requestedVariants.length > 0) {
      generateAndUploadVariants(
        originalBuffer,
        objectKey,
        requestedVariants,
        client,
      ).catch((err) => {
        console.error('[cloud-upload-photo] failed to generate variants:', err);
        // Не критично, оригинал уже загружен
      });
    }

    return NextResponse.json({
      fileId: objectKey,
      name: fileName,
      url,
      variants: requestedVariants,
    });
  } catch (error) {
    const err = error as any;
    console.error(
      'Unexpected cloud-upload-photo error:',
      err?.name || typeof err,
      err?.message || err,
    );
    if (err && typeof err === 'object') {
      console.error('[cloud-upload-photo] error details', {
        name: err.name,
        message: err.message,
        code: err.code,
        $metadata: err.$metadata,
      });
    }
    return NextResponse.json(
      { error: 'Внутренняя ошибка при загрузке изображения' },
      { status: 500 },
    );
  }
}
