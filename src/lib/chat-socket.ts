/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { io, Socket } from 'socket.io-client';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

let socket: Socket | null = null;
let socketPromise: Promise<Socket> | null = null;
let status: ConnectionStatus = 'disconnected';
let lastError: Error | null = null;
const listeners: Array<
  (state: ConnectionStatus, error?: Error | null) => void
> = [];

function notify() {
  listeners.forEach((cb) => cb(status, lastError));
}

async function getSocketToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/socket-token', {
      method: 'GET',
      credentials: 'include', // Важно для отправки cookies
    });

    if (!response.ok) {
      // 401 для неавторизованного пользователя ожидаем, не спамим консоль
      if (response.status !== 401) {
        console.error('Failed to get socket token:', response.status);
      }
      return null;
    }

    const data = await response.json();
    return data.token || null;
  } catch (error) {
    console.error('Error fetching socket token:', error);
    return null;
  }
}

export async function getSocket(): Promise<Socket> {
  // Если уже есть промис инициализации, возвращаем его
  if (socketPromise) {
    return socketPromise;
  }

  // Если сокет уже существует и не отключен, возвращаем его
  if (socket && !socket.disconnected) {
    return socket;
  }

  // Создаем новый промис инициализации
  socketPromise = (async () => {
    const url =
      process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || 'http://localhost:4001';

    // Получаем токен через API
    const token = await getSocketToken();

    socket = io(url, {
      transports: ['websocket'],
      autoConnect: false, // Отключаем авто-подключение
      withCredentials: true,
      auth: token ? { token } : undefined,
    });

    status = 'connecting';
    notify();

    socket.on('connect', () => {
      console.log('Socket connected');
      status = 'connected';
      lastError = null;
      notify();
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      status = 'disconnected';
      notify();
    });

    socket.on('connect_error', (err) => {
      console.log('Socket connect error:', err);
      status = 'error';
      lastError = err;
      notify();
    });

    // Подключаемся вручную после установки всех обработчиков
    socket.connect();

    // Очищаем промис после успешной инициализации
    socketPromise = null;

    return socket;
  })();

  return socketPromise;
}

export function useSocketConnection(
  onStatusChange?: (state: ConnectionStatus, error?: Error | null) => void
) {
  // Инициализация сокета теперь происходит только в useChatSocket
  if (onStatusChange) {
    listeners.push(onStatusChange);
    onStatusChange(status, lastError);
    return () => {
      const idx = listeners.indexOf(onStatusChange);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }
  return () => {};
}

export function getConnectionStatus() {
  return { status, error: lastError };
}

export type SocketConnectionStatus = ConnectionStatus;
