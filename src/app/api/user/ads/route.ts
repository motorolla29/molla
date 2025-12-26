import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, AdStatus } from '@prisma/client';
import { verifyToken } from '@/lib/jwt';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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

    // Получаем параметр статуса из query
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // если не указан, будет null

    // Получаем объявления пользователя
    const whereCondition =
      status === 'all'
        ? { sellerId: sellerId }
        : status
        ? {
            sellerId: sellerId,
            status: status as AdStatus,
          }
        : {
            sellerId: sellerId,
            status: AdStatus.active, // по умолчанию только активные
          };

    const ads = await prisma.ad.findMany({
      where: whereCondition,
      orderBy: {
        datePosted: 'desc',
      },
    });

    // Преобразуем данные для клиента
    const formattedAds = ads.map((ad) => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      category: ad.category,
      city: ad.city,
      cityLabel: ad.cityLabel,
      address: ad.address,
      lat: ad.lat,
      lng: ad.lng,
      price: ad.price ? Number(ad.price) : null,
      currency: ad.currency,
      status: ad.status,
      datePosted: ad.datePosted.toISOString(),
      photos: ad.photos,
    }));

    return NextResponse.json({
      success: true,
      ads: formattedAds,
    });
  } catch (error) {
    console.error('Error fetching user ads:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении объявлений' },
      { status: 500 }
    );
  }
}

// API для изменения статуса объявления
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { adId, status } = body;

    if (
      !adId ||
      !status ||
      ![AdStatus.active, AdStatus.archived].includes(status as AdStatus)
    ) {
      return NextResponse.json(
        {
          error:
            'Неверные параметры: adId и status (active/archived) обязательны',
        },
        { status: 400 }
      );
    }

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

    // Подготавливаем данные для обновления
    const updateData: any = {
      status: status as AdStatus,
    };

    // Если объявление публикуется заново (из archived в active), обновляем дату размещения
    if (ad.status === AdStatus.archived && status === AdStatus.active) {
      updateData.datePosted = new Date();
    }

    // Обновляем статус (и возможно дату размещения)
    const updatedAd = await prisma.ad.update({
      where: {
        id: adId,
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      ad: {
        id: updatedAd.id,
        status: updatedAd.status,
      },
    });
  } catch (error) {
    console.error('Error updating ad status:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении статуса объявления' },
      { status: 500 }
    );
  }
}
