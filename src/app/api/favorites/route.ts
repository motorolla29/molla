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
    const { adId, localUserToken } = body;

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

    // Проверяем, есть ли уже запись с такими идентификаторами
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        adId: adId,
        OR: [
          userId ? { sellerId: userId } : {},
          localUserToken ? { localUserToken: localUserToken } : {},
        ].filter((condition) => Object.keys(condition).length > 0),
      },
    });

    let favorite;

    if (existingFavorite) {
      // Если запись существует, активируем её (восстанавливаем лайк)
      const updateData: any = {
        isActive: true,
      };

      // Если пользователь авторизован и у записи нет sellerId, присваиваем его
      if (userId && !existingFavorite.sellerId) {
        updateData.sellerId = userId;
      }

      favorite = await prisma.favorite.update({
        where: { id: existingFavorite.id },
        data: updateData,
      });
    } else {
      // Создаем новую запись
      const favoriteData: any = {
        adId: adId,
        isActive: true,
      };

      // Добавляем оба поля, если они присутствуют
      if (userId) {
        favoriteData.sellerId = userId;
      }
      if (localUserToken) {
        favoriteData.localUserToken = localUserToken;
      }

      favorite = await prisma.favorite.create({
        data: favoriteData,
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
    // Ищем по userId ИЛИ localUserToken (на случай если запись была создана до авторизации)
    const result = await prisma.favorite.updateMany({
      where: {
        adId: adId,
        isActive: true, // Только активные лайки
        OR: [{ sellerId: userId }, { localUserToken: localUserToken }].filter(
          (condition) => Object.keys(condition).length > 0
        ),
      },
      data: {
        isActive: false,
      },
    });

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
