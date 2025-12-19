import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию по httpOnly cookie с токеном
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const endpoint =
      process.env.IMAGEKIT_UPLOAD_ENDPOINT ||
      'https://upload.imagekit.io/api/v1/files/upload';

    if (!privateKey || !publicKey) {
      console.error('IMAGEKIT keys are not configured');
      return NextResponse.json(
        { error: 'Image upload is not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const folder =
      (formData.get('folder') as string | null) || '/molla/ads/uploads';
    const fileName =
      (formData.get('fileName') as string | null) || 'ad-image-' + Date.now();

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'Файл не найден в запросе' },
        { status: 400 }
      );
    }

    // Собираем FormData для ImageKit
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    uploadForm.append('fileName', fileName);
    uploadForm.append('folder', folder);
    uploadForm.append('useUniqueFileName', 'true');

    // ImageKit авторизация: Basic <base64(private_key:)>
    const authHeader =
      'Basic ' + Buffer.from(`${privateKey}:`).toString('base64');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
      },
      body: uploadForm,
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('ImageKit upload error:', data);
      return NextResponse.json(
        { error: 'Не удалось загрузить изображение' },
        { status: 500 }
      );
    }

    // Возвращаем только то, что нужно фронту
    return NextResponse.json({
      url: data.url as string,
      fileId: data.fileId as string,
      name: data.name as string,
    });
  } catch (error) {
    console.error('Unexpected upload-image error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка при загрузке изображения' },
      { status: 500 }
    );
  }
}
