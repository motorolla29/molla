import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { convertToAdBase } from '@/utils';

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
        _count: {
          select: {
            favorites: true,
            userViews: true,
          },
        },
        todayViews: {
          where: {
            viewedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)), // просмотры с начала сегодняшнего дня
            },
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    const userId = Number((payload as any).userId);
    const { adId } = await params;

    // Проверяем, что объявление существует и принадлежит пользователю
    const existingAd = await prisma.ad.findUnique({
      where: { id: adId },
      select: { sellerId: true },
    });

    if (!existingAd) {
      return NextResponse.json(
        { error: 'Объявление не найдено' },
        { status: 404 }
      );
    }

    if (existingAd.sellerId !== userId) {
      return NextResponse.json(
        { error: 'У вас нет прав на редактирование этого объявления' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      city,
      cityLabel,
      address,
      lat,
      lng,
      price,
      currency,
      details,
      photos,
      showPhone,
      showEmail,
    } = body || {};

    // Обязательные поля: заголовок, категория, цена
    if (!title || !category || typeof price !== 'number') {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля: заголовок, категория, цена' },
        { status: 400 }
      );
    }

    // Создаем объявление
    const updatedAd = await prisma.ad.update({
      where: { id: adId },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        category,
        city: city?.trim() || null,
        cityLabel,
        address: address?.trim() || null,
        lat: lat || null,
        lng: lng || null,
        price: price,
        currency: currency || 'RUB',
        details: details?.trim() || null,
        photos: photos || [],
        showPhone: showPhone || false,
        showEmail: showEmail || false,
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
    });

    const converted = convertToAdBase(updatedAd);
    return NextResponse.json(converted);
  } catch (error) {
    console.error('❌ Error updating ad:', error);
    return NextResponse.json(
      { error: 'Не удалось обновить объявление' },
      { status: 500 }
    );
  }
}
