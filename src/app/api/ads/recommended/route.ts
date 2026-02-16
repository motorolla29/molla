import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { convertToAdBase } from '@/utils';
import { Prisma } from '@prisma/client';

const DEFAULT_LIMIT = 24;
const MAX_CANDIDATES = 1000;

type RecommendedRow = {
  id: string;
  category: string;
  title: string;
  description: string | null;
  city: string;
  cityLabel: string;
  address: string | null;
  price: unknown | null;
  currency: string | null;
  datePosted: Date;
  photos: string[];
  details: string | null;
  status: 'active' | 'archived';
  showPhone: boolean;
  showEmail: boolean;
  sellerId: number;
  seller_name: string;
  seller_avatar: string | null;
  seller_rating: number;
  seller_phone: string | null;
  seller_email: string | null;
};

/**
 * GET /api/ads/recommended
 * Умные рекомендации: по избранному, просмотрам и чатам пользователя
 * подбираем объявления той же категории/города. Без истории — свежие по дате.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skip = Math.max(0, parseInt(searchParams.get('skip') || '0'));

    // Ограничиваем limit до 50 за один запрос
    const requestedLimit = Math.min(
      50,
      parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT)),
    );
    const localUserToken = searchParams.get('localUserToken') || undefined;

    let userId: number | null = null;
    const token = request.cookies.get('token')?.value;
    if (token) {
      const payload = verifyToken(token);
      if (payload && typeof payload === 'object' && 'userId' in payload) {
        userId = payload.userId as number;
      }
    }

    const preferredCategories: string[] = [];
    const preferredCityLabels: string[] = [];

    if (userId || localUserToken) {
      const [favorites, views, chats] = await Promise.all([
        prisma.favorite.findMany({
          where: {
            isActive: true,
            adId: { not: null },
            ...(userId
              ? { sellerId: userId }
              : { localUserToken: localUserToken! }),
          },
          include: { ad: { select: { category: true, cityLabel: true } } },
        }),
        prisma.userView.findMany({
          where: userId ? { userId } : { localUserToken: localUserToken! },
          include: { ad: { select: { category: true, cityLabel: true } } },
          orderBy: { viewedAt: 'desc' },
          take: 100,
        }),
        userId
          ? prisma.chat.findMany({
              where: { buyerId: userId, adId: { not: null } },
              include: { ad: { select: { category: true, cityLabel: true } } },
            })
          : [],
      ]);

      const seenIds = new Set<string>();

      for (const f of favorites) {
        if (f.adId && f.ad && !seenIds.has(f.adId)) {
          seenIds.add(f.adId);
          preferredCategories.push(f.ad.category);
          preferredCityLabels.push(f.ad.cityLabel);
        }
      }
      for (const v of views) {
        if (v.adId && v.ad && !seenIds.has(v.adId)) {
          seenIds.add(v.adId);
          preferredCategories.push(v.ad.category);
          preferredCityLabels.push(v.ad.cityLabel);
        }
      }
      for (const c of chats) {
        if (c.adId && c.ad && !seenIds.has(c.adId)) {
          seenIds.add(c.adId);
          preferredCategories.push(c.ad.category);
          preferredCityLabels.push(c.ad.cityLabel);
        }
      }
    }

    const where: {
      status: 'active';
      sellerId?: { not: number };
    } = { status: 'active' };
    if (userId != null) {
      where.sellerId = { not: userId };
    }

    // Общий потолок выдачи: максимум 1000 объявлений через пагинацию
    if (skip >= MAX_CANDIDATES) {
      return NextResponse.json([]);
    }
    const limit = Math.min(requestedLimit, MAX_CANDIDATES - skip);
    if (limit <= 0) {
      return NextResponse.json([]);
    }

    const cats = Array.from(new Set(preferredCategories));
    const cities = Array.from(new Set(preferredCityLabels));

    const hasCats = cats.length > 0;
    const hasCities = cities.length > 0;

    // CASE score полностью эквивалентен прежней логике (3/2/1/0),
    // но ранжирование и топ-1000 делаются целиком в Postgres.
    const condBoth =
      hasCats && hasCities
        ? Prisma.sql`a."category"::text IN (${Prisma.join(
            cats,
          )}) AND a."cityLabel" IN (${Prisma.join(cities)})`
        : Prisma.sql`FALSE`;
    const condCat = hasCats
      ? Prisma.sql`a."category"::text IN (${Prisma.join(cats)})`
      : Prisma.sql`FALSE`;
    const condCity = hasCities
      ? Prisma.sql`a."cityLabel" IN (${Prisma.join(cities)})`
      : Prisma.sql`FALSE`;

    const scoreSql = Prisma.sql`
      CASE
        WHEN ${condBoth} THEN 3
        WHEN ${condCat} THEN 2
        WHEN ${condCity} THEN 1
        ELSE 0
      END
    `;

    const sellerFilterSql =
      userId != null ? Prisma.sql`AND a."sellerId" <> ${userId}` : Prisma.empty;

    const rows = (await prisma.$queryRaw<RecommendedRow[]>(Prisma.sql`
      WITH ranked AS (
        SELECT
          a."id",
          a."category",
          a."title",
          a."description",
          a."city",
          a."cityLabel",
          a."address",
          a."price",
          a."currency",
          a."datePosted",
          a."photos",
          a."details",
          a."status",
          a."showPhone",
          a."showEmail",
          a."sellerId",
          s."name"  AS "seller_name",
          s."avatar" AS "seller_avatar",
          s."rating" AS "seller_rating",
          s."phone" AS "seller_phone",
          s."email" AS "seller_email",
          ${scoreSql} AS "score"
        FROM "ads" a
        JOIN "sellers" s ON s."id" = a."sellerId"
        WHERE a."status" = 'active'
        ${sellerFilterSql}
        ORDER BY "score" DESC, a."datePosted" DESC
        LIMIT ${MAX_CANDIDATES}
      )
      SELECT
        "id",
        "category",
        "title",
        "description",
        "city",
        "cityLabel",
        "address",
        "price",
        "currency",
        "datePosted",
        "photos",
        "details",
        "status",
        "showPhone",
        "showEmail",
        "sellerId",
        "seller_name",
        "seller_avatar",
        "seller_rating",
        "seller_phone",
        "seller_email"
      FROM ranked
      OFFSET ${skip}
      LIMIT ${limit}
    `)) ?? [];

    const adsLike = rows.map((r) => ({
      id: r.id,
      category: r.category,
      title: r.title,
      description: r.description,
      city: r.city,
      cityLabel: r.cityLabel,
      address: r.address,
      price: r.price as any,
      currency: r.currency as any,
      datePosted: r.datePosted,
      photos: r.photos,
      details: r.details,
      status: r.status,
      showPhone: r.showPhone,
      showEmail: r.showEmail,
      sellerId: r.sellerId,
      seller: {
        id: r.sellerId,
        name: r.seller_name,
        avatar: r.seller_avatar,
        rating: r.seller_rating,
        phone: r.seller_phone,
        email: r.seller_email,
      },
    }));

    return NextResponse.json(adsLike.map(convertToAdBase));
  } catch (error) {
    console.error('❌ Error fetching recommended ads:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch recommended ads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
