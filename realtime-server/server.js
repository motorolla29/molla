/**
 * Lightweight Socket.IO server for real-time 1:1 chat.
 * Designed to run separately from Next.js (e.g. Render/Railway/VPS).
 *
 * Environment:
 * - PORT (default 4001)
 * - DATABASE_URL (shared with Next app)
 * - JWT_SECRET (shared with Next app)
 * - CORS_ORIGIN (comma-separated origins allowed for websocket)
 *
 * This server:
 * - Authenticates users via JWT from cookie `token` or `auth.token` payload.
 * - Tracks online users in-memory (userId -> socketIds).
 * - Broadcasts presence (user_online / user_offline with lastSeenAt).
 * - Handles join_chat / leave_chat, send_message (with DB persistence for text),
 *   and typing indications.
 *
 * NOTE: For attachments, persist them through the existing REST API and emit
 *       `send_message` with `persistedMessage` to fan-out in real time.
 */

const { createServer } = require('node:http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PORT = process.env.PORT || 4001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((v) => v.trim());

const httpServer = createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Socket server is running');
});

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
  },
  transports: ['websocket'],
});

// userId -> { sockets: Set<socketId>, lastSeenAt?: Date }
const onlineUsers = new Map();

function parseTokenFromHandshake(handshake) {
  const authToken =
    handshake.auth?.token ||
    handshake.query?.token ||
    handshake.headers?.token ||
    null;

  // Try cookies as fallback
  if (authToken) return authToken;

  const rawCookie = handshake.headers?.cookie;
  if (!rawCookie) return null;
  const parsed = cookie.parse(rawCookie || '');
  return parsed.token || null;
}

function verifyAuth(token) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded?.userId) return null;
    return decoded;
  } catch (err) {
    return null;
  }
}

async function ensureChatAccess(chatId, userId) {
  if (!chatId || !userId) return null;
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
    },
  });
  return chat;
}

io.on('connection', async (socket) => {
  const token = parseTokenFromHandshake(socket.handshake);
  const payload = verifyAuth(token);
  if (!payload) {
    socket.emit('auth_error', { reason: 'unauthorized' });
    socket.disconnect(true);
    return;
  }

  const userId = Number(payload.userId);
  socket.data.userId = userId;

  // Presence: mark online
  const state = onlineUsers.get(userId) || { sockets: new Set(), lastSeenAt: null };
  state.sockets.add(socket.id);
  onlineUsers.set(userId, state);

  // Join personal room for presence fan-out
  socket.join(`user:${userId}`);

  // Notify others that user is online
  io.emit('user_online', { userId });
  console.log(`User ${userId} is now online`);

  // Send snapshot of online users to all connected clients
  const onlineIds = Array.from(onlineUsers.keys());
  io.emit('presence_snapshot', {
    onlineUserIds: onlineIds,
  });
  console.log(`Broadcasted presence snapshot:`, onlineIds);

  socket.on('join_chat', async ({ chatId }) => {
    if (!chatId) return;
    const chat = await ensureChatAccess(chatId, userId);
    if (!chat) {
      socket.emit('join_error', { chatId, reason: 'forbidden' });
      return;
    }
    socket.join(`chat:${chatId}`);
    socket.emit('chat_joined', { chatId });
  });

  socket.on('leave_chat', ({ chatId }) => {
    if (!chatId) return;
    socket.leave(`chat:${chatId}`);
  });

  socket.on(
    'typing',
    ({ chatId }) => {
      if (!chatId) return;
      socket.to(`chat:${chatId}`).emit('typing', {
        chatId,
        fromUserId: userId,
        at: Date.now(),
      });
    }
  );

  socket.on(
    'stop_typing',
    ({ chatId }) => {
      if (!chatId) return;
      socket.to(`chat:${chatId}`).emit('stop_typing', {
        chatId,
        fromUserId: userId,
        at: Date.now(),
      });
    }
  );

  socket.on(
    'send_message',
    async ({ chatId, content, tempId, persistedMessage }) => {
      if (!chatId) return;
      const chat = await ensureChatAccess(chatId, userId);
      if (!chat) {
        socket.emit('message_error', { chatId, tempId, reason: 'forbidden' });
        return;
      }

      // If message already persisted (e.g., with attachments via REST)
      if (persistedMessage) {
        io.to(`chat:${chatId}`).emit('new_message', {
          ...persistedMessage,
          tempId,
        });
        socket.emit('message_saved', {
          tempId,
          message: persistedMessage,
        });
        return;
      }

      if (!content || !content.trim()) return;

      const message = await prisma.message.create({
        data: {
          chatId,
          senderId: userId,
          content,
          messageType: 'text',
          status: 'sent',
        },
      });

      const payload = {
        id: message.id,
        chatId: message.chatId,
        senderId: message.senderId,
        content: message.content || '',
        timestamp: message.createdAt,
        type: 'text',
        status: message.status,
        attachments: [],
      };

      io.to(`chat:${chatId}`).emit('new_message', { ...payload, tempId });
      socket.emit('message_saved', { tempId, message: payload });

      // Notify the recipient about unread message update
      const recipientId = chat.buyerId === userId ? chat.sellerId : chat.buyerId;
      const unreadCount = await prisma.message.count({
        where: {
          chatId: chatId,
          senderId: { not: recipientId }, // Messages NOT from the recipient (i.e., from the sender)
          status: { not: 'read' }, // Not read by the recipient
        },
      });

      io.to(`user:${recipientId}`).emit('unread_update', {
        chatId,
        unreadCount,
      });
    }
  );

  socket.on('disconnect', async () => {
    const state = onlineUsers.get(userId);
    if (!state) return;
    state.sockets.delete(socket.id);
    if (state.sockets.size === 0) {
      const lastSeenAt = new Date();
      onlineUsers.delete(userId);
      try {
        await prisma.seller.update({
          where: { id: userId },
          data: { lastSeenAt },
        });
      } catch (err) {
        console.error('Failed to update lastSeenAt', err);
      }
      io.emit('user_offline', { userId, lastSeenAt });

      // Send updated snapshot after user goes offline
      const onlineIds = Array.from(onlineUsers.keys());
      io.emit('presence_snapshot', {
        onlineUserIds: onlineIds,
      });
      console.log(`User ${userId} went offline, broadcasted presence snapshot:`, onlineIds);
    } else {
      onlineUsers.set(userId, state);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket server listening on :${PORT}`);
});
