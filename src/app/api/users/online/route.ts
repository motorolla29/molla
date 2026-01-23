import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Обновить lastSeenAt для текущего пользователя
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const userId = decoded.userId;

    await prisma.seller.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating lastSeenAt:', error);
    return NextResponse.json(
      { error: 'Не удалось обновить статус' },
      { status: 500 }
    );
  }
}

// Получить статусы онлайн для списка пользователей
// Пользователь считается онлайн, если lastSeenAt обновлялся в последние 60 секунд
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIds = searchParams.get('userIds');

    if (!userIds) {
      return NextResponse.json(
        { error: 'Не указаны userIds' },
        { status: 400 }
      );
    }

    const ids = userIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'Неверный формат userIds' },
        { status: 400 }
      );
    }

    // Получаем статусы пользователей
    const minuteAgo = new Date(Date.now() - 60 * 1000);

    const users = await prisma.seller.findMany({
      where: {
        id: { in: ids },
      },
      select: {
        id: true,
        lastSeenAt: true,
      },
    });

    // Создаем карту статусов
    const statusMap: Record<number, { isOnline: boolean; lastSeenAt: string | null }> = {};

    users.forEach(user => {
      const isOnline = !!(user.lastSeenAt && user.lastSeenAt >= minuteAgo);
      statusMap[user.id] = {
        isOnline,
        lastSeenAt: user.lastSeenAt?.toISOString() || null,
      };
    });

    return NextResponse.json({
      statuses: statusMap,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching users online status:', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить статусы пользователей' },
      { status: 500 }
    );
  }
}