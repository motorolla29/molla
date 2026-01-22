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
        status: 'sent', // Will be updated to delivered after sending
      },
    });

    // Обрабатываем вложения (до 6 фото)
    if (attachments.length > 0) {
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

      // Загружаем все вложения в ImageKit параллельно
      const uploadPromises = attachments.map(async (attachment) => {
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
          console.error('ImageKit upload error for', attachment.name, ':', imageKitData);
          throw new Error(`Failed to upload ${attachment.name}`);
        }

        return {
          fileUrl: imageKitData.url, // Полный URL из ImageKit
          fileName: attachment.name,
          fileSize: attachment.size,
          fileType: attachment.type,
        };
      });

      // Ждем завершения всех загрузок
      const uploadedFiles = await Promise.all(uploadPromises);

      // Создаем записи в базе данных для всех вложений
      await prisma.messageAttachment.createMany({
        data: uploadedFiles.map(file => ({
          messageId: message.id,
          fileUrl: file.fileUrl,
          fileName: file.fileName,
          fileSize: file.fileSize,
          fileType: file.fileType,
        })),
      });
    }

    // Обновляем статус сообщения на delivered
    await prisma.message.update({
      where: { id: message.id },
      data: { status: 'delivered' },
    });

    // Обновляем время последнего обновления чата
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    // Отправляем WebSocket событие для доставки сообщения в реальном времени
    try {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4001';
      const response = await fetch(`${socketUrl}/emit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'message_delivered',
          data: {
            messageIds: [message.id],
            userId: userId,
          },
        }),
      });

      if (!response.ok) {
        console.error('Error sending socket event via HTTP:', response.status, await response.text());
      }
    } catch (socketError) {
      console.error('Error sending socket event:', socketError);
    }

    const messageWithAttachments = await prisma.message.findUnique({
      where: { id: message.id },
      include: {
        attachments: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      messageId: message.id,
      message: messageWithAttachments
        ? {
            id: messageWithAttachments.id,
            chatId: messageWithAttachments.chatId,
            senderId: messageWithAttachments.senderId,
            content: messageWithAttachments.content || '',
            messageType: messageWithAttachments.messageType,
            status: 'delivered',
            createdAt: messageWithAttachments.createdAt,
            attachments: messageWithAttachments.attachments.map((attachment) => ({
              id: attachment.id,
              fileUrl: attachment.fileUrl,
              fileName: attachment.fileName,
              fileType: attachment.fileType,
            })),
          }
        : null,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
