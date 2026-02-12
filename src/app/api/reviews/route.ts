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
          { status: 401 },
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
          { status: 400 },
        );
      }

      const sellerIdNum = parseInt(sellerId);
      if (isNaN(sellerIdNum)) {
        return NextResponse.json(
          { error: 'Неверный ID продавца' },
          { status: 400 },
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
      // Получаем отзывы о продавце (для страницы пользователя и рейтинга)
      const sellerIdNum = parseInt(sellerId!);
      whereClause = { sellerId: sellerIdNum, targetRole: 'seller' };
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

    const hasMore = page * limit < totalCount;

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
      { status: 500 },
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
        { status: 401 },
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    const userId = Number((decoded as any).userId);

    const body = await request.json();
    const { sellerId, adId, rating, content, photos, purchased, targetRole } =
      body;

    // Кому адресован отзыв: продавцу (по умолчанию) или покупателю
    const normalizedTargetRole: 'seller' | 'buyer' =
      targetRole === 'buyer' ? 'buyer' : 'seller';

    // Валидация входных данных
    if (!sellerId || !adId || !rating || !content) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 },
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Рейтинг должен быть от 1 до 5' },
        { status: 400 },
      );
    }

    if (content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Текст отзыва должен содержать минимум 10 символов' },
        { status: 400 },
      );
    }

    const sellerIdNum = parseInt(sellerId);
    if (isNaN(sellerIdNum)) {
      return NextResponse.json(
        { error: 'Неверный ID продавца' },
        { status: 400 },
      );
    }

    // Проверяем, что пользователь не оставляет отзыв самому себе
    if (userId === sellerIdNum) {
      return NextResponse.json(
        { error: 'Нельзя оставить отзыв самому себе' },
        { status: 400 },
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
        { status: 404 },
      );
    }

    if (normalizedTargetRole === 'seller') {
      // Отзыв о продавце: проверяем, что объявление принадлежит указанному продавцу
      if (ad.sellerId !== sellerIdNum) {
        return NextResponse.json(
          { error: 'Объявление не принадлежит указанному продавцу' },
          { status: 400 },
        );
      }
    } else {
      // Отзыв о покупателе: проверяем, что текущий пользователь является продавцом этого объявления
      if (ad.sellerId !== userId) {
        return NextResponse.json(
          {
            error:
              'Только владелец объявления может оставить отзыв о покупателе',
          },
          { status: 400 },
        );
      }
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
        { status: 400 },
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
        targetRole: normalizedTargetRole,
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

    // Обновляем общий рейтинг пользователя (учитываем отзывы во всех ролях)
    const sellerReviews = await prisma.review.findMany({
      where: { sellerId: sellerIdNum },
      select: { rating: true },
    });

    const averageRating =
      sellerReviews.length > 0
        ? sellerReviews.reduce((sum, r) => sum + r.rating, 0) /
          sellerReviews.length
        : 0;

    await prisma.seller.update({
      where: { id: sellerIdNum },
      data: { rating: Math.round(averageRating * 10) / 10 }, // Округляем до 1 знака после запятой
    });

    // Отправляем in-app, socket и push-уведомление пользователю, о котором оставили отзыв
    (async () => {
      try {
        const actorRoleLabel =
          normalizedTargetRole === 'seller' ? 'Покупатель' : 'Продавец';
        const actorRoleGenitive =
          normalizedTargetRole === 'seller' ? 'покупателя' : 'продавца';
        const actorName = review.user.name || actorRoleLabel;

        const fullAdTitle = review.ad.title || '';
        const MAX_PUSH_TITLE_LEN = 40;
        const shortAdTitle =
          fullAdTitle.length > MAX_PUSH_TITLE_LEN
            ? fullAdTitle.slice(0, MAX_PUSH_TITLE_LEN - 1).trimEnd() + '…'
            : fullAdTitle;

        // Создаем запись уведомления для получателя отзыва
        const notification = await prisma.inAppNotification.create({
          data: {
            userId: sellerIdNum,
            type: 'review_created',
            title: `Новый отзыв от ${actorRoleGenitive}`,
            message: `${actorName} оставил(а) отзыв с оценкой ${rating} ★ по объявлению "${fullAdTitle}"`,
            data: {
              reviewId: review.id,
              adId,
              sellerId: sellerIdNum,
              targetRole: normalizedTargetRole,
              path: '/personal/rating',
            },
          },
        });

        // Отправляем событие в сокет-сервер, чтобы обновить счетчик непрочитанных
        try {
          await fetch(
            `${
              process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4001'
            }/emit`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                event: 'user-notification',
                data: {
                  userId: sellerIdNum,
                  notification: {
                    id: notification.id,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    createdAt: notification.createdAt.toISOString(),
                  },
                },
              }),
            },
          );
        } catch (err) {
          console.error(
            'Failed to send notification via Socket.IO for review:',
            err,
          );
        }

        // Пытаемся отправить push-уведомление через отдельный endpoint
        await fetch(
          `${
            process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
          }/api/push/send`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: sellerIdNum,
              title: `📣 Новый отзыв от ${actorRoleGenitive}`,
              body: `Вам написали отзыв с оценкой ${rating} ★.`,
              data: {
                reviewId: review.id,
                adId,
                sellerId: sellerIdNum,
                notificationId: notification.id,
                type: 'review_created',
                targetRole: normalizedTargetRole,
                // путь, куда вести при клике по push
                path: '/personal/rating',
                shortTitle: shortAdTitle,
              },
            }),
          },
        ).catch((error) => {
          console.error('Failed to send push for review:', error);
        });
      } catch (error) {
        console.error(
          'Failed to create in-app/push notification for review:',
          error,
        );
      }
    })();

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 },
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
        { status: 401 },
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
        { status: 400 },
      );
    }

    // Находим отзыв и проверяем, что он принадлежит текущему пользователю
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true, sellerId: true },
    });

    if (!review) {
      return NextResponse.json({ error: 'Отзыв не найден' }, { status: 404 });
    }

    if (review.userId !== userId) {
      return NextResponse.json(
        { error: 'У вас нет прав на удаление этого отзыва' },
        { status: 403 },
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
      const averageRating =
        remainingReviews.reduce((sum, r) => sum + r.rating, 0) /
        remainingReviews.length;
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
      { status: 500 },
    );
  }
}

// PATCH /api/reviews - добавить ответ на отзыв
export async function PATCH(request: NextRequest) {
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
    const body = await request.json();
    const { reviewId, replyContent } = body ?? {};

    if (!reviewId || typeof reviewId !== 'string') {
      return NextResponse.json(
        { error: 'Не указан ID отзыва' },
        { status: 400 },
      );
    }

    if (!replyContent || typeof replyContent !== 'string') {
      return NextResponse.json(
        { error: 'Текст ответа обязателен' },
        { status: 400 },
      );
    }

    const trimmedReply = replyContent.trim();
    if (trimmedReply.length < 3) {
      return NextResponse.json(
        { error: 'Ответ должен содержать минимум 3 символа' },
        { status: 400 },
      );
    }

    // Находим отзыв и проверяем право на ответ
    const review = (await prisma.review.findUnique({
      where: { id: reviewId },
    })) as any;

    if (!review) {
      return NextResponse.json({ error: 'Отзыв не найден' }, { status: 404 });
    }

    // Ответ может написать только пользователь, на которого оставлен отзыв
    if (review.sellerId !== userId) {
      return NextResponse.json(
        { error: 'У вас нет прав отвечать на этот отзыв' },
        { status: 403 },
      );
    }

    // Разрешаем только один ответ на отзыв
    if (review.replyContent && review.replyContent.trim().length > 0) {
      return NextResponse.json(
        { error: 'На этот отзыв уже оставлен ответ' },
        { status: 400 },
      );
    }

    const updateData: any = {
      replyContent: trimmedReply,
      replyCreatedAt: new Date(),
    };

    const updatedReview = (await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
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
    })) as any;

    return NextResponse.json({ review: updatedReview }, { status: 200 });
  } catch (error) {
    console.error('Reply to review error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
