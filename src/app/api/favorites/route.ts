import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/jwt';

const prisma = new PrismaClient();

// GET /api/favorites - получить список избранных объявлений пользователя
export async function GET(request: NextRequest) {
  try {
    // Получаем токен из httpOnly cookies
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    const userId = payload.userId as number;

    // Получаем избранные объявления с полной информацией (только активные)
    const favorites = await prisma.favorite.findMany({
      where: {
        sellerId: userId,
        isActive: true,
      },
      include: {
        ad: {
          include: {
            seller: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Преобразуем данные в формат, совместимый с AdBase
    const ads = favorites.map((favorite) => ({
      id: favorite.ad.id,
      category: favorite.ad.category,
      title: favorite.ad.title,
      description: favorite.ad.description,
      city: favorite.ad.city,
      cityLabel: favorite.ad.cityLabel,
      address: favorite.ad.address,
      location: {
        lat: favorite.ad.lat,
        lng: favorite.ad.lng,
      },
      price: favorite.ad.price ? Number(favorite.ad.price) : undefined,
      currency: favorite.ad.currency || undefined,
      datePosted: favorite.ad.datePosted.toISOString(),
      photos: favorite.ad.photos || [],
      seller: {
        id: favorite.ad.seller.id,
        avatar: favorite.ad.seller.avatar,
        name: favorite.ad.seller.name,
        rating: favorite.ad.seller.rating,
        contact: {
          phone: favorite.ad.seller.phone || undefined,
          email: favorite.ad.seller.email || undefined,
        },
      },
      details: favorite.ad.details,
    }));

    return NextResponse.json({ favorites: ads });
  } catch (error) {
    console.error('Ошибка получения избранного:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST /api/favorites - добавить объявление в избранное
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adId, localUserToken, createdAt } = body;

    // Получаем данные для идентификации пользователя
    let userId: number | null = null;

    // Проверяем авторизацию
    const token = request.cookies.get('token')?.value;
    if (token) {
      const payload = verifyToken(token);
      if (payload && typeof payload === 'object' && 'userId' in payload) {
        userId = payload.userId as number;
      }
    }

    // Если не авторизован, проверяем localUserToken
    if (!userId && !localUserToken) {
      return NextResponse.json(
        { error: 'Требуется авторизация или localUserToken' },
        { status: 401 }
      );
    }

    if (!adId || typeof adId !== 'string') {
      return NextResponse.json(
        { error: 'Не указан ID объявления' },
        { status: 400 }
      );
    }
    // Проверяем, существует ли объявление
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
    });

    if (!ad) {
      return NextResponse.json(
        { error: 'Объявление не найдено' },
        { status: 404 }
      );
    }

    let favorite;

    // всегда работаем с sellerId для авторизованных пользователей
    if (userId) {
      // Находим или создаем запись с sellerId
      favorite = await prisma.favorite.upsert({
        where: {
          sellerId_adId: {
            sellerId: userId,
            adId: adId,
          },
        },
        update: {
          isActive: true,
          ...(createdAt && { createdAt: new Date(createdAt) }),
        },
        create: {
          sellerId: userId,
          adId: adId,
          isActive: true,
          ...(createdAt && { createdAt: new Date(createdAt) }),
        },
      });

      // Если есть localUserToken записи для того же adId, удаляем их полностью
      // чтобы избежать дубликатов в счетчике лайков
      if (localUserToken) {
        await prisma.favorite.deleteMany({
          where: {
            adId: adId,
            localUserToken: localUserToken,
            sellerId: null, // Только те, у которых нет sellerId
          },
        });
      }
    } else {
      // Для неавторизованных пользователей используем localUserToken
      if (!localUserToken) {
        return NextResponse.json(
          { error: 'Не указан localUserToken' },
          { status: 400 }
        );
      }

      favorite = await prisma.favorite.upsert({
        where: {
          localUserToken_adId: {
            localUserToken: localUserToken,
            adId: adId,
          },
        },
        update: {
          isActive: true,
          ...(createdAt && { createdAt: new Date(createdAt) }),
        },
        create: {
          localUserToken: localUserToken,
          adId: adId,
          isActive: true,
          ...(createdAt && { createdAt: new Date(createdAt) }),
        },
      });
    }

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    console.error('Ошибка добавления в избранное:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites - удалить объявление из избранного
export async function DELETE(request: NextRequest) {
  try {
    // Получаем токен из httpOnly cookies
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    const userId = payload.userId as number;

    const { searchParams } = new URL(request.url);
    const adId = searchParams.get('adId');
    const localUserToken = searchParams.get('localUserToken');

    if (!adId) {
      return NextResponse.json(
        { error: 'Не указан ID объявления' },
        { status: 400 }
      );
    }

    // Деактивируем лайк (устанавливаем isActive = false)
    let result;

    if (userId) {
      // Для авторизованного пользователя - деактивируем запись с sellerId
      result = await prisma.favorite.updateMany({
        where: {
          sellerId: userId,
          adId: adId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    } else {
      // Для неавторизованного пользователя - деактивируем запись с localUserToken
      result = await prisma.favorite.updateMany({
        where: {
          localUserToken: localUserToken,
          adId: adId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    }

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Объявление не найдено в избранном' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления из избранного:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
