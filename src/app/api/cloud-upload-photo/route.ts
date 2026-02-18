import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import {
  uploadImageToCloud,
  type CloudImageVariant,
} from '@/lib/cloud/upload-image';

export const runtime = 'nodejs';

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
      .filter((v) => ['xs', 'sm', 'md'].includes(v)) as CloudImageVariant[];

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'Файл не найден в запросе' },
        { status: 400 },
      );
    }

    const uploaded = await uploadImageToCloud({
      file,
      folder,
      fileName,
      variants: requestedVariants,
    });

    return NextResponse.json({
      fileId: uploaded.objectKey,
      name: fileName,
      url: uploaded.url,
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
