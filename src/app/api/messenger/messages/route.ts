import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Получаем токен из cookies
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    const userId = Number((decoded as any).userId);

    const formData = await request.formData();
    const chatId = formData.get('chatId') as string;
    const content = formData.get('content') as string;
    const attachments = formData.getAll('attachments') as File[];

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      );
    }

    // Проверяем, что пользователь имеет доступ к этому чату
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Определяем тип сообщения
    const messageType = attachments.length > 0 ? 'image' : 'text';

    // Создаем сообщение
    const message = await prisma.message.create({
      data: {
        chatId: chatId,
        senderId: userId,
        content: content || null,
        messageType: messageType,
        status: 'sent',
      },
    });

    // Обрабатываем вложение (только одно фото)
    if (attachments.length > 0) {
      const attachment = attachments[0]; // Берем только первое фото

      // Получаем ключи ImageKit
      const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
      const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
      const endpoint = process.env.IMAGEKIT_UPLOAD_ENDPOINT || 'https://upload.imagekit.io/api/v1/files/upload';

      if (!privateKey || !publicKey) {
        console.error('IMAGEKIT keys are not configured');
        return NextResponse.json(
          { error: 'Image upload is not configured' },
          { status: 500 }
        );
      }

      // Загружаем в ImageKit
      const uploadForm = new FormData();
      uploadForm.append('file', attachment);
      uploadForm.append('fileName', attachment.name);
      uploadForm.append('folder', '/molla/chat-attachments');
      uploadForm.append('useUniqueFileName', 'true');

      // ImageKit авторизация
      const authHeader = 'Basic ' + Buffer.from(`${privateKey}:`).toString('base64');

      const imageKitRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
        },
        body: uploadForm,
      });

      const imageKitData = await imageKitRes.json();

      if (!imageKitRes.ok) {
        console.error('ImageKit upload error:', imageKitData);
        return NextResponse.json(
          { error: 'Не удалось загрузить изображение' },
          { status: 500 }
        );
      }

      // Создаем запись в базе данных с полным URL
      await prisma.messageAttachment.create({
        data: {
          messageId: message.id,
          fileUrl: imageKitData.url, // Полный URL из ImageKit
          fileName: attachment.name,
          fileSize: attachment.size,
          fileType: attachment.type,
        },
      });
    }

    // Обновляем время последнего обновления чата
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      messageId: message.id,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
