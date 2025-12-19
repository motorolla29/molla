import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AdBase, CategoryKey, Currency } from '@/types/ad';

// Локальная конвертация Prisma Ad -> AdBase (дублируем из списка объявлений, чтобы не тянуть весь роут)
function convertToAdBase(ad: any): AdBase {
  const result: AdBase = {
    id: ad.id,
    category: ad.category.toLowerCase() as CategoryKey,
    title: ad.title,
    description: ad.description,
    city: ad.city,
    cityLabel: ad.cityLabel,
    address: ad.address,
    location: {
      lat: ad.lat,
      lng: ad.lng,
    },
    price: ad.price || undefined,
    currency: (ad.currency as Currency) || undefined,
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
    details: ad.details,
  };

  return result;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    const { adId } = await params;

    const ad = await prisma.ad.findUnique({
      where: { id: adId },
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
    });

    if (!ad) {
      return NextResponse.json(
        { error: 'Объявление не найдено' },
        { status: 404 }
      );
    }

    const converted = convertToAdBase(ad);
    return NextResponse.json(converted);
  } catch (error) {
    console.error('❌ Error fetching ad by id:', error);
    return NextResponse.json({ error: 'Failed to fetch ad' }, { status: 500 });
  }
}
