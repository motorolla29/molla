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

    // Получаем избранные объявления с полной информацией
    const favorites = await prisma.favorite.findMany({
      where: { sellerId: userId },
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
      price: favorite.ad.price || undefined,
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

    const body = await request.json();
    const { adId } = body;

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

    // Проверяем, не добавлено ли уже в избранное
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        sellerId_adId: {
          sellerId: userId,
          adId: adId,
        },
      },
    });

    if (existingFavorite) {
      return NextResponse.json(
        { error: 'Объявление уже в избранном' },
        { status: 409 }
      );
    }

    // Добавляем в избранное
    const favorite = await prisma.favorite.create({
      data: {
        sellerId: userId,
        adId: adId,
      },
    });

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

    if (!adId) {
      return NextResponse.json(
        { error: 'Не указан ID объявления' },
        { status: 400 }
      );
    }

    // Удаляем из избранного
    const result = await prisma.favorite.deleteMany({
      where: {
        sellerId: userId,
        adId: adId,
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
