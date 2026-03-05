import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MAX_SUGGESTIONS = 8;

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const q = (searchParams.get('q') || '').trim();

    const where = q
      ? {
          text: {
            startsWith: q,
            mode: 'insensitive' as const,
          },
        }
      : {};

    const stats = await prisma.searchStat.findMany({
      where,
      orderBy: [
        { count: 'desc' },
        { lastSearchedAt: 'desc' },
      ],
      take: MAX_SUGGESTIONS,
    });

    const suggestions = stats.map((s) => s.text);

    return NextResponse.json(suggestions, { status: 200 });
  } catch (error) {
    console.error('Failed to load search suggestions', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

