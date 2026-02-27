import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 },
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    const blockerId = Number((decoded as any).userId);
    const { userId } = await params;
    const blockedId = Number(userId);

    if (!blockedId || Number.isNaN(blockedId)) {
      return NextResponse.json(
        { error: 'Некорректный идентификатор пользователя' },
        { status: 400 },
      );
    }

    if (blockerId === blockedId) {
      return NextResponse.json(
        { error: 'Нельзя заблокировать самого себя' },
        { status: 400 },
      );
    }

    await prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
      create: {
        blockerId,
        blockedId,
      },
      update: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error blocking user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 },
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    const blockerId = Number((decoded as any).userId);
    const { userId } = await params;
    const blockedId = Number(userId);

    if (!blockedId || Number.isNaN(blockedId)) {
      return NextResponse.json(
        { error: 'Некорректный идентификатор пользователя' },
        { status: 400 },
      );
    }

    await prisma.userBlock.deleteMany({
      where: {
        blockerId,
        blockedId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unblocking user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

