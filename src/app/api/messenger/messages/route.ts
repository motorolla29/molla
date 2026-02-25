import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { uploadImageToCloud } from '@/lib/cloud/upload-image';

export const runtime = 'nodejs';

function safeExtFromName(name: string) {
  const lower = (name || '').toLowerCase();
  const dot = lower.lastIndexOf('.');
  const ext = dot !== -1 ? lower.slice(dot) : '';
  if (
    ext === '.jpg' ||
    ext === '.jpeg' ||
    ext === '.png' ||
    ext === '.webp' ||
    ext === '.gif' ||
    ext === '.avif'
  ) {
    return ext;
  }
  return '.jpg';
}

export async function POST(request: NextRequest) {
  let createdMessageId: string | null = null;
  let hadAttachments = false;
  let hasTextContent = false;

  try {
    // Получаем токен из cookies
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 },
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
    const attachments = (formData.getAll('attachments') as File[]).slice(0, 6);
    hadAttachments = attachments.length > 0;
    hasTextContent = !!(content && content.trim());

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 },
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
    createdMessageId = message.id;

    // Обрабатываем вложения (до 6 фото)
    if (attachments.length > 0) {
      // Загружаем все вложения в cloud.ru параллельно
      const uploadPromises = attachments.map(async (attachment) => {
        const ext = safeExtFromName(attachment.name);
        const uuid = crypto.randomUUID();
        const fileName = `${uuid}${ext}`;

        const uploaded = await uploadImageToCloud({
          file: attachment,
          folder: '/chat-attachments',
          fileName,
          // Для чата: md для ленты + оригинал для модалки
          variants: ['md'],
        });

        return {
          fileUrl: uploaded.url, // Публичный URL из cloud.ru (оригинал)
          // В БД сохраняем то же имя, что и в хранилище
          fileName,
          fileSize: attachment.size,
          fileType: attachment.type,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Создаем записи в базе данных для всех вложений
      await prisma.messageAttachment.createMany({
        data: uploadedFiles.map((file) => ({
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

    const messageWithAttachments = await prisma.message.findUnique({
      where: { id: message.id },
      include: {
        attachments: true,
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Socket события отправляются через обычный socket в page.tsx

    return NextResponse.json({
      success: true,
      statusMessage: 'Message sent successfully',
      messageId: messageWithAttachments!.id,
      message: messageWithAttachments
        ? {
            id: messageWithAttachments.id,
            chatId: messageWithAttachments.chatId,
            senderId: messageWithAttachments.senderId,
            content: messageWithAttachments.content || '',
            messageType: messageWithAttachments.messageType,
            status: 'delivered',
            createdAt: messageWithAttachments.createdAt,
            attachments: messageWithAttachments.attachments.map(
              (attachment) => ({
                id: attachment.id,
                fileUrl: attachment.fileUrl,
                fileName: attachment.fileName,
                fileType: attachment.fileType,
              }),
            ),
          }
        : null,
    });
  } catch (error) {
    console.error('Error sending message:', error);

    // Если сообщение уже создано и ожидались вложения,
    // но что-то пошло не так при их загрузке, удаляем сообщение,
    // чтобы оно не висело пустым в истории.
    try {
      if (createdMessageId && hadAttachments && !hasTextContent) {
        await prisma.message.delete({ where: { id: createdMessageId } });
      }
    } catch {
      // Игнорируем ошибки удаления, чтобы не перекрывать основную ошибку
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
