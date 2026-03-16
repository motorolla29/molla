import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// DELETE /api/reviews/reply - удалить ответ на отзыв (только автор ответа)
export async function DELETE(request: NextRequest) {
  try {
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

    const body = await request.json().catch(() => null);
    const reviewId = body?.reviewId;

    if (!reviewId || typeof reviewId !== 'string') {
      return NextResponse.json(
        { error: 'Не указан ID отзыва' },
        { status: 400 },
      );
    }

    const review = (await prisma.review.findUnique({
      where: { id: reviewId },
    })) as any;

    if (!review) {
      return NextResponse.json({ error: 'Отзыв не найден' }, { status: 404 });
    }

    // Удалять ответ может только пользователь, на которого оставлен отзыв (автор ответа)
    if (review.sellerId !== userId) {
      return NextResponse.json(
        { error: 'У вас нет прав удалять этот ответ' },
        { status: 403 },
      );
    }

    const updatedReview = (await prisma.review.update({
      where: { id: reviewId },
      data: {
        replyContent: null,
        replyCreatedAt: null,
        replyPhotos: [],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        ad: {
          select: {
            id: true,
            title: true,
            photos: true,
          },
        },
      },
    })) as any;

    return NextResponse.json({ review: updatedReview }, { status: 200 });
  } catch (error) {
    console.error('Delete reply error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}

