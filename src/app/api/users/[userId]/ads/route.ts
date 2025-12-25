import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Получить объявления пользователя по его ID (публичный доступ)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const sellerId = parseInt(userId);

    if (isNaN(sellerId)) {
      return NextResponse.json(
        { error: 'Неверный ID пользователя' },
        { status: 400 }
      );
    }

    // Получаем параметры запроса
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active', 'archived', или null для всех
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    // Формируем условие фильтрации
    const whereCondition: any = {
      sellerId: sellerId,
      status: 'active', // по умолчанию только активные для публичного просмотра
    };

    if (status === 'archived') {
      whereCondition.status = 'archived';
    } else if (status === 'all') {
      // Для 'all' показываем все статусы
      delete whereCondition.status;
    }

    // Получаем общее количество объявлений
    const totalCount = await prisma.ad.count({
      where: whereCondition,
    });

    // Получаем объявления с пагинацией
    const ads = await prisma.ad.findMany({
      where: whereCondition,
      orderBy: {
        datePosted: 'desc',
      },
      skip: offset,
      take: limit,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            rating: true,
          },
        },
      },
    });

    // Преобразуем данные для клиента
    const formattedAds = ads.map((ad) => ({
      id: ad.id,
      category: ad.category.toLowerCase(),
      title: ad.title,
      description: ad.description,
      city: ad.city,
      cityLabel: ad.cityLabel,
      address: ad.address,
      location: {
        lat: ad.lat,
        lng: ad.lng,
      },
      price: ad.price ? Number(ad.price) : undefined,
      currency: ad.currency || 'RUB',
      datePosted: ad.datePosted.toISOString(),
      photos: ad.photos,
      seller: {
        id: ad.seller.id,
        name: ad.seller.name,
        avatar: ad.seller.avatar,
        rating: ad.seller.rating,
      },
      details: ad.details,
      status: ad.status,
    }));

    return NextResponse.json({
      ads: formattedAds,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore: offset + ads.length < totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching user ads:', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить объявления' },
      { status: 500 }
    );
  }
}
