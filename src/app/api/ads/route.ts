import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AdBase, CategoryKey, Currency } from '@/types/ad';
import { verifyToken } from '@/lib/jwt';

// Конвертация Prisma модели в AdBase тип
function convertToAdBase(ad: any): AdBase {
  try {
    const result = {
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
      price: ad.price ? Number(ad.price) : undefined,
      currency: (ad.currency as Currency) || undefined,
      datePosted: ad.datePosted.toISOString(),
      photos: ad.photos,
      seller: {
        id: ad.seller.id,
        avatar: ad.seller.avatar,
        name: ad.seller.name,
        rating: ad.seller.rating,
        contact: {
          phone: ad.showPhone ? ad.seller.phone || undefined : undefined,
          email: ad.showEmail ? ad.seller.email || undefined : undefined,
        },
      },
      details: ad.details,
    };

    return result;
  } catch (error) {
    console.error(`❌ Error converting ad ${ad.id}:`, error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Получаем параметры фильтрации из URL
    const cityLabel = searchParams.get('cityLabel');
    const category = searchParams.get('category') as CategoryKey | null;
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');
    const isVip = searchParams.get('vip') === '1';
    const timeFilter = searchParams.get('time');
    const sort = searchParams.get('sort') || 'datePosted';
    const skip = parseInt(searchParams.get('skip') || '0');
    const limit = parseInt(searchParams.get('limit') || '24');

    // Строим условия фильтрации
    const where: any = {
      status: 'active', // показываем только активные объявления
    };

    // Фильтр по городу
    if (cityLabel && cityLabel !== 'russia') {
      where.cityLabel = cityLabel;
    }

    // Фильтр по категории
    if (category) {
      where.category = category;
    }

    // Фильтр по цене
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseInt(minPrice);
      if (maxPrice) where.price.lte = parseInt(maxPrice);
    }

    // Фильтр по поисковому запросу
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Фильтр VIP объявлений
    if (isVip) {
      where.isVip = true;
    }

    // Фильтр по времени
    if (timeFilter) {
      const now = new Date();
      if (timeFilter === '7') {
        // За последние 7 дней
        where.datePosted = {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        };
      } else if (timeFilter === '24') {
        // За последние 24 часа
        where.datePosted = {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        };
      }
    }

    // Сортировка
    let orderBy: any = undefined; // По умолчанию - без сортировки

    if (sort === 'new') {
      orderBy = { datePosted: 'desc' };
    } else if (sort === 'price_asc') {
      orderBy = { price: 'asc' };
    }

    const ads = await prisma.ad.findMany({
      where,
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
      orderBy,
      skip,
      take: limit,
    });

    // Конвертируем в формат AdBase
    const convertedAds = ads.map(convertToAdBase);

    return NextResponse.json(convertedAds);
  } catch (error) {
    console.error('❌ Error fetching ads:', error);
    console.error(
      'Stack trace:',
      error instanceof Error ? error.stack : 'Unknown error'
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch ads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Проверка контактов осуществляется на фронтенде

    // Функция транслитерации кириллицы в латиницу
    const transliterate = (text: string): string => {
      const map: { [key: string]: string } = {
        а: 'a',
        б: 'b',
        в: 'v',
        г: 'g',
        д: 'd',
        е: 'e',
        ё: 'yo',
        ж: 'zh',
        з: 'z',
        и: 'i',
        й: 'y',
        к: 'k',
        л: 'l',
        м: 'm',
        н: 'n',
        о: 'o',
        п: 'p',
        р: 'r',
        с: 's',
        т: 't',
        у: 'u',
        ф: 'f',
        х: 'kh',
        ц: 'ts',
        ч: 'ch',
        ш: 'sh',
        щ: 'shch',
        ъ: '',
        ы: 'y',
        ь: '',
        э: 'e',
        ю: 'yu',
        я: 'ya',
        А: 'A',
        Б: 'B',
        В: 'V',
        Г: 'G',
        Д: 'D',
        Е: 'E',
        Ё: 'Yo',
        Ж: 'Zh',
        З: 'Z',
        И: 'I',
        Й: 'Y',
        К: 'K',
        Л: 'L',
        М: 'M',
        Н: 'N',
        О: 'O',
        П: 'P',
        Р: 'R',
        С: 'S',
        Т: 'T',
        У: 'U',
        Ф: 'F',
        Х: 'Kh',
        Ц: 'Ts',
        Ч: 'Ch',
        Ш: 'Sh',
        Щ: 'Shch',
        Ъ: '',
        Ы: 'Y',
        Ь: '',
        Э: 'E',
        Ю: 'Yu',
        Я: 'Ya',
      };

      return text
        .split('')
        .map((char) => map[char] || char)
        .join('');
    };

    // Генерируем ID из заголовка (транслитерированного) + случайная строка
    const titleSlug = transliterate(title)
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
    const randomString = Math.random().toString(36).substring(2, 6); // 4 символа
    const generatedId = `${titleSlug}_${randomString}`;

    const ad = await prisma.ad.create({
      data: {
        id: generatedId,
        title,
        description: description || '',
        category,
        city: city || 'Москва', // дефолтное значение
        cityLabel: cityLabel || 'moscow', // дефолтное значение
        address: address || '', // опционально
        lat: typeof lat === 'number' ? lat : 55.7558, // координаты Москвы по умолчанию
        lng: typeof lng === 'number' ? lng : 37.6173, // координаты Москвы по умолчанию
        price: typeof price === 'number' ? price : null,
        currency: currency || null,
        details: details || '',
        photos: Array.isArray(photos) ? photos : [],
        showPhone: showPhone !== false, // по умолчанию true
        showEmail: showEmail !== false, // по умолчанию true
        sellerId,
      },
    });

    return NextResponse.json({ id: ad.id }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating ad:', error);
    return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 });
  }
}
