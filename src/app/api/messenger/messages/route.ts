import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

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

    // Обрабатываем вложения
    if (attachments.length > 0) {
      // Создаем директорию для вложений чатов, если она не существует
      const uploadDir = join(
        process.cwd(),
        'public',
        'uploads',
        'chat-attachments'
      );
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (error) {
        // Директория может уже существовать
      }

      // Сохраняем каждое вложение
      for (const attachment of attachments) {
        const fileExtension = attachment.name.split('.').pop() || 'jpg';
        const fileName = `${randomUUID()}.${fileExtension}`;
        const filePath = join(uploadDir, fileName);

        // Сохраняем файл
        const bytes = await attachment.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        // Создаем запись в базе данных
        await prisma.messageAttachment.create({
          data: {
            messageId: message.id,
            fileUrl: fileName,
            fileName: attachment.name,
            fileSize: attachment.size,
            fileType: attachment.type,
          },
        });
      }
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
