/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { io, Socket } from 'socket.io-client';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

let socket: Socket | null = null;
let status: ConnectionStatus = 'disconnected';
let lastError: Error | null = null;
const listeners: Array<(state: ConnectionStatus, error?: Error | null) => void> =
  [];

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
      console.error('Failed to get socket token:', response.status);
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
  if (socket) return socket;

  const url =
    process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || 'http://localhost:4001';

  // Получаем токен через API
  const token = await getSocketToken();

  socket = io(url, {
    transports: ['websocket'],
    autoConnect: true,
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

  return socket;
}

export function useSocketConnection(
  onStatusChange?: (state: ConnectionStatus, error?: Error | null) => void
) {
  if (!socket) {
    getSocket().catch((error) => {
      console.error('Failed to initialize socket:', error);
    });
  }
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
