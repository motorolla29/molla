import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// GET /api/reviews - получить отзывы продавца с фильтрацией и пагинацией
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');
    const myReviews = searchParams.get('my-reviews'); // Флаг для получения отзывов пользователя
    const sort = searchParams.get('sort') || 'newest'; // newest, oldest, positive, negative
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');

    // Получаем токен для получения отзывов пользователя
    let userId: number | null = null;
    if (myReviews) {
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

      userId = Number((decoded as any).userId);
    } else {
      // Для отзывов продавца проверяем sellerId
      if (!sellerId) {
        return NextResponse.json(
          { error: 'Не указан ID продавца' },
          { status: 400 }
        );
      }

      const sellerIdNum = parseInt(sellerId);
      if (isNaN(sellerIdNum)) {
        return NextResponse.json(
          { error: 'Неверный ID продавца' },
          { status: 400 }
        );
      }
    }

    // Определяем порядок сортировки
    let orderBy: any = { createdAt: 'desc' };
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'positive':
        orderBy = { rating: 'desc' };
        break;
      case 'negative':
        orderBy = { rating: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    let whereClause: any;
    let includeClause: any;

    if (myReviews && userId) {
      // Получаем отзывы, оставленные пользователем
      whereClause = { userId };
      includeClause = {
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
          },
        },
        ad: {
          select: {
            id: true,
            title: true,
          },
        },
      };
    } else {
      // Получаем отзывы о продавце
      const sellerIdNum = parseInt(sellerId!);
      whereClause = { sellerId: sellerIdNum };
      includeClause = {
        user: {
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
      };
    }

    // Получаем отзывы с пагинацией
    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
        include: includeClause,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({
        where: whereClause,
      }),
    ]);

    const hasMore = (page * limit) < totalCount;

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        totalCount,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - создать новый отзыв
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

    const body = await request.json();
    const { sellerId, adId, rating, content, photos, purchased } = body;

    // Валидация входных данных
    if (!sellerId || !adId || !rating || !content) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Рейтинг должен быть от 1 до 5' },
        { status: 400 }
      );
    }

    if (content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Текст отзыва должен содержать минимум 10 символов' },
        { status: 400 }
      );
    }

    const sellerIdNum = parseInt(sellerId);
    if (isNaN(sellerIdNum)) {
      return NextResponse.json(
        { error: 'Неверный ID продавца' },
        { status: 400 }
      );
    }

    // Проверяем, что пользователь не оставляет отзыв самому себе
    if (userId === sellerIdNum) {
      return NextResponse.json(
        { error: 'Нельзя оставить отзыв самому себе' },
        { status: 400 }
      );
    }

    // Проверяем, существует ли объявление
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      select: { id: true, sellerId: true },
    });

    if (!ad) {
      return NextResponse.json(
        { error: 'Объявление не найдено' },
        { status: 404 }
      );
    }

    // Проверяем, что объявление принадлежит указанному продавцу
    if (ad.sellerId !== sellerIdNum) {
      return NextResponse.json(
        { error: 'Объявление не принадлежит указанному продавцу' },
        { status: 400 }
      );
    }

    // Проверяем, что пользователь еще не оставлял отзыв на это объявление
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        adId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'Вы уже оставили отзыв на это объявление' },
        { status: 400 }
      );
    }

    // Создаем отзыв
    const review = await prisma.review.create({
      data: {
        userId,
        sellerId: sellerIdNum,
        adId,
        rating,
        content: content.trim(),
        photos: Array.isArray(photos) ? photos : [],
        purchased: purchased === true,
      },
      include: {
        user: {
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
    });

    // Обновляем рейтинг продавца
    const allReviews = await prisma.review.findMany({
      where: { sellerId: sellerIdNum },
      select: { rating: true },
    });

    const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.seller.update({
      where: { id: sellerIdNum },
      data: { rating: Math.round(averageRating * 10) / 10 }, // Округляем до 1 знака после запятой
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews - удалить отзыв
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('id');

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Не указан ID отзыва' },
        { status: 400 }
      );
    }

    // Находим отзыв и проверяем, что он принадлежит текущему пользователю
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true, sellerId: true },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Отзыв не найден' },
        { status: 404 }
      );
    }

    if (review.userId !== userId) {
      return NextResponse.json(
        { error: 'У вас нет прав на удаление этого отзыва' },
        { status: 403 }
      );
    }

    // Удаляем отзыв
    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Пересчитываем рейтинг продавца
    const remainingReviews = await prisma.review.findMany({
      where: { sellerId: review.sellerId },
      select: { rating: true },
    });

    let newRating = 0;
    if (remainingReviews.length > 0) {
      const averageRating = remainingReviews.reduce((sum, r) => sum + r.rating, 0) / remainingReviews.length;
      newRating = Math.round(averageRating * 10) / 10;
    }

    await prisma.seller.update({
      where: { id: review.sellerId },
      data: { rating: newRating },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}