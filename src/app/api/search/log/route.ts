import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
    }

    const trimmed = text.trim();

    if (!trimmed) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // @ts-expect-error модель появится после обновления Prisma Client
    await prisma.searchStat.upsert({
      where: { text: trimmed },
      update: {
        count: { increment: 1 },
        lastSearchedAt: new Date(),
      },
      create: {
        text: trimmed,
        count: 1,
      },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to log search term', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

