import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

type SearchHitKind = 'message' | 'chat';

function clampInt(value: string | null, def: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function normalizeQ(q: string) {
  return q.trim().replace(/\s+/g, ' ');
}

function makeSnippet(text: string, q: string) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  const needle = q.toLowerCase();
  const hay = t.toLowerCase();
  const idx = hay.indexOf(needle);
  if (idx === -1) return t.length > 140 ? `${t.slice(0, 140)}…` : t;
  const start = Math.max(0, idx - 40);
  const end = Math.min(t.length, idx + needle.length + 60);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < t.length ? '…' : '';
  return `${prefix}${t.slice(start, end)}${suffix}`;
}

function parseCursor(raw: string | null): { t: number; id: string } | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    if (!obj || typeof obj !== 'object') return null;
    const t = Number((obj as any).t);
    const id = String((obj as any).id || '');
    if (!Number.isFinite(t) || !id) return null;
    return { t, id };
  } catch {
    return null;
  }
}

function encodeCursor(t: number, id: string) {
  return Buffer.from(JSON.stringify({ t, id }), 'utf8').toString('base64');
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }
    const userId = Number((decoded as any).userId);

    const url = new URL(request.url);
    const qRaw = url.searchParams.get('q') || '';
    const q = normalizeQ(qRaw);
    const limit = clampInt(url.searchParams.get('limit'), 20, 1, 50);
    const cursor = parseCursor(url.searchParams.get('cursor'));

    if (q.length < 2) {
      return NextResponse.json({ items: [], hasMore: false, nextCursor: null });
    }

    // 1) Сообщения, где найдено совпадение (с самым свежим совпадением на чат)
    const rawMessageHits = await prisma.message.findMany({
      where: {
        content: { contains: q, mode: 'insensitive' },
        chat: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 250,
      select: {
        id: true,
        chatId: true,
        content: true,
        createdAt: true,
        chat: {
          select: {
            id: true,
            adId: true,
            createdAt: true,
            updatedAt: true,
            buyerId: true,
            sellerId: true,
            ad: {
              select: {
                id: true,
                title: true,
                photos: true,
                price: true,
                currency: true,
                city: true,
                cityLabel: true,
                category: true,
              },
            },
            buyer: {
              select: { id: true, name: true, avatar: true, lastSeenAt: true },
            },
            seller: {
              select: { id: true, name: true, avatar: true, lastSeenAt: true },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                content: true,
                createdAt: true,
                status: true,
                senderId: true,
                attachments: { select: { fileType: true } },
              },
            },
          },
        },
      },
    });

    // 2) Чаты, где совпало по названию объявления или имени пользователя
    const chatHits = await prisma.chat.findMany({
      where: {
        AND: [
          {
            OR: [
              { buyerId: userId },
              { sellerId: userId, messages: { some: {} } },
            ],
          },
          {
            OR: [
              { ad: { title: { contains: q, mode: 'insensitive' } } },
              { buyer: { name: { contains: q, mode: 'insensitive' } } },
              { seller: { name: { contains: q, mode: 'insensitive' } } },
            ],
          },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 250,
      select: {
        id: true,
        adId: true,
        createdAt: true,
        updatedAt: true,
        buyerId: true,
        sellerId: true,
        ad: {
          select: {
            id: true,
            title: true,
            photos: true,
            price: true,
            currency: true,
            city: true,
            cityLabel: true,
            category: true,
          },
        },
        buyer: { select: { id: true, name: true, avatar: true, lastSeenAt: true } },
        seller: { select: { id: true, name: true, avatar: true, lastSeenAt: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            status: true,
            senderId: true,
            attachments: { select: { fileType: true } },
          },
        },
      },
    });

    // Скрытия чатов (удалено "у меня"): такие сообщения/чаты до deletedAt не должны участвовать в поиске.
    const candidateChatIds = Array.from(
      new Set<string>([
        ...rawMessageHits.map((m) => m.chatId),
        ...chatHits.map((c) => c.id),
      ]),
    );

    const hiddenAll = candidateChatIds.length
      ? await prisma.chatHidden.findMany({
          where: { userId, chatId: { in: candidateChatIds } },
          select: { chatId: true, deletedAt: true },
        })
      : [];

    const hiddenMapAll = new Map<string, Date>();
    hiddenAll.forEach((h) => hiddenMapAll.set(h.chatId, h.deletedAt));

    const messageHits = rawMessageHits.filter((m) => {
      const hiddenAt = hiddenMapAll.get(m.chatId);
      if (!hiddenAt) return true;
      return m.createdAt > hiddenAt;
    });

    // Дедуп: один hit на чат (предпочитаем message-hit)
    const byChatId = new Map<
      string,
      {
        kind: SearchHitKind;
        hitAt: Date;
        messageId?: string;
        snippet?: string;
        chat: any;
      }
    >();

    for (const m of messageHits) {
      const chatId = m.chatId;
      if (!m.chat) continue;
      if (!byChatId.has(chatId)) {
        byChatId.set(chatId, {
          kind: 'message',
          hitAt: m.createdAt,
          messageId: m.id,
          snippet: makeSnippet(m.content || '', q),
          chat: m.chat,
        });
      }
    }

    for (const c of chatHits) {
      if (!byChatId.has(c.id)) {
        byChatId.set(c.id, {
          kind: 'chat',
          hitAt: c.updatedAt || c.createdAt,
          chat: c,
        });
      }
    }

    // Финальная фильтрация: если чат скрыт и после deletedAt не было новых сообщений — не показываем его в поиске.
    const allHits = Array.from(byChatId.values()).filter((hit) => {
      const hiddenAt = hiddenMapAll.get(hit.chat.id);
      if (!hiddenAt) return true;
      const lastMessage = hit.chat.messages?.[0];
      const lastEventTime = lastMessage?.createdAt || hit.chat.createdAt;
      return !!lastEventTime && lastEventTime > hiddenAt;
    });

    // Фильтрация по cursor (постраничная выдача в памяти)
    const filtered = cursor
      ? allHits.filter((h) => {
          const t = h.hitAt.getTime();
          if (t < cursor.t) return true;
          if (t > cursor.t) return false;
          // tie-breaker: id сравнение строкой
          return h.chat.id < cursor.id;
        })
      : allHits;

    // Сортировка: по времени совпадения (новые сверху)
    filtered.sort((a, b) => {
      const dt = b.hitAt.getTime() - a.hitAt.getTime();
      if (dt !== 0) return dt;
      return b.chat.id.localeCompare(a.chat.id);
    });

    const page = filtered.slice(0, limit + 1);
    const hasMore = page.length > limit;
    const itemsToReturn = hasMore ? page.slice(0, limit) : page;

    // Подтягиваем скрытия чатов и блокировки одним запросом на пачку
    const chatIds = itemsToReturn.map((h) => h.chat.id);
    const [hidden, blocks] = await Promise.all([
      prisma.chatHidden.findMany({
        where: { userId, chatId: { in: chatIds } },
        select: { chatId: true, deletedAt: true },
      }),
      prisma.userBlock.findMany({
        where: {
          OR: [
            { blockerId: userId },
            { blockedId: userId },
          ],
        },
        select: { blockerId: true, blockedId: true },
      }),
    ]);

    const hiddenMap = new Map<string, Date>();
    hidden.forEach((h) => hiddenMap.set(h.chatId, h.deletedAt));

    // Формируем выдачу в формате ChatListItemModel + поля поиска
    const formattedWithNulls = await Promise.all(
      itemsToReturn.map(async (hit) => {
        const chat = hit.chat;
        const isBuyer = chat.buyerId === userId;
        const otherUser = isBuyer ? chat.seller : chat.buyer;
        const lastMessage = chat.messages?.[0];

        const hiddenAt = hiddenMap.get(chat.id);
        if (hiddenAt) {
          const lastEventTime = lastMessage?.createdAt || chat.createdAt;
          if (!lastEventTime || lastEventTime <= hiddenAt) {
            return null;
          }
        }

        const unreadCount = await prisma.message.count({
          where: {
            chatId: chat.id,
            senderId: { not: userId },
            status: { not: 'read' },
          },
        });

        const isAdDeleted = !chat.ad;

        let isBlockedByMe = false;
        let isBlockedMe = false;
        if (otherUser?.id) {
          isBlockedByMe = blocks.some(
            (b) => b.blockerId === userId && b.blockedId === otherUser.id,
          );
          isBlockedMe = blocks.some(
            (b) => b.blockerId === otherUser.id && b.blockedId === userId,
          );
        }

        const lastMessageDisplay = lastMessage
          ? lastMessage.attachments &&
              lastMessage.attachments.length > 0 &&
              lastMessage.attachments.some((att: any) =>
                att.fileType?.startsWith('image/'),
              ) &&
              !lastMessage.content?.trim()
            ? '📎 Фото'
            : lastMessage.content || 'Сообщение'
          : 'Нет сообщений';

        return {
          id: chat.id,
          adId: chat.adId,
          adTitle: isAdDeleted ? 'Объявление удалено' : chat.ad!.title,
          adPhoto: isAdDeleted ? '' : chat.ad!.photos?.[0] || '',
          adPrice: isAdDeleted
            ? undefined
            : chat.ad!.price
              ? `${chat.ad!.price.toLocaleString('ru-RU')} ${
                  chat.ad!.currency || 'RUB'
                }`
              : undefined,
          adCity: isAdDeleted ? '' : chat.ad!.city,
          adCityLabel: isAdDeleted ? '' : chat.ad!.cityLabel,
          adCategory: isAdDeleted ? 'goods' : chat.ad!.category,
          isAdDeleted,
          otherUserId: otherUser?.id ?? null,
          otherUserName: otherUser?.name ?? 'Пользователь удален',
          otherUserAvatar: otherUser?.avatar ?? null,
          otherUserLastSeenAt: otherUser?.lastSeenAt ?? null,
          lastMessage: lastMessageDisplay,
          lastMessageTime: lastMessage?.createdAt || chat.createdAt,
          lastMessageStatus: lastMessage?.status || null,
          lastMessageIsOutgoing: lastMessage ? lastMessage.senderId === userId : false,
          unreadCount: (isBlockedByMe || isBlockedMe) ? 0 : unreadCount,
          isBlockedByMe,
          isBlockedMe,
          search: {
            kind: hit.kind,
            hitAt: hit.hitAt,
            messageId: hit.messageId || null,
            snippet: hit.snippet || null,
          },
        };
      }),
    );

    const items = formattedWithNulls.filter(Boolean);
    const nextCursor =
      hasMore && itemsToReturn.length > 0
        ? encodeCursor(
            itemsToReturn[itemsToReturn.length - 1].hitAt.getTime(),
            itemsToReturn[itemsToReturn.length - 1].chat.id,
          )
        : null;

    return NextResponse.json({ items, hasMore, nextCursor });
  } catch (error) {
    console.error('Error searching messenger:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

