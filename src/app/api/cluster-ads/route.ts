import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Параметры кластера
    const ids = searchParams.get('ids')?.split(',') || [];
    const skip = parseInt(searchParams.get('skip') || '0');
    const limit = parseInt(searchParams.get('limit') || '24');

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs parameter is required' },
        { status: 400 }
      );
    }

    // Загружаем полные данные объявлений
    const ads = await prisma.ad.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            rating: true,
            phone: true,
            email: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        datePosted: 'desc',
      },
    });

    // Преобразуем в формат AdBase
    const formattedAds = ads.map((ad) => ({
      id: ad.id,
      category: ad.category.toLowerCase() as any,
      title: ad.title,
      description: ad.description || '',
      city: ad.city || '',
      cityLabel: ad.cityLabel || '',
      address: ad.address || '',
      location: {
        lat: ad.lat,
        lng: ad.lng,
      },
      price: ad.price || undefined,
      currency: ad.currency as any,
      datePosted: ad.datePosted.toISOString(),
      photos: ad.photos,
      seller: {
        id: ad.seller.id,
        avatar: ad.seller.avatar,
        name: ad.seller.name,
        rating: ad.seller.rating,
        contact: {
          phone: ad.seller.phone || undefined,
          email: ad.seller.email || undefined,
        },
      },
      details: ad.details || '',
    }));

    // Проверяем, есть ли еще данные
    const hasMore = ads.length === limit;

    return NextResponse.json({
      ads: formattedAds,
      hasMore,
      total: ids.length,
    });
  } catch (error) {
    console.error('❌ Error loading cluster ads:', error);
    return NextResponse.json(
      {
        error: 'Failed to load cluster ads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
