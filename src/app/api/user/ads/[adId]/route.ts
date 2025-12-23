import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/jwt';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    const sellerId = Number((payload as any).userId);
    const { adId } = await params;

    // Проверяем, что объявление принадлежит пользователю
    const ad = await prisma.ad.findFirst({
      where: {
        id: adId,
        sellerId: sellerId,
      },
    });

    if (!ad) {
      return NextResponse.json(
        { error: 'Объявление не найдено или не принадлежит пользователю' },
        { status: 404 }
      );
    }

    // Удаляем объявление
    await prisma.ad.delete({
      where: {
        id: adId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Объявление успешно удалено',
    });
  } catch (error) {
    console.error('Error deleting ad:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении объявления' },
      { status: 500 }
    );
  }
}
