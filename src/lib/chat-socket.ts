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

function parseCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function getSocket(): Socket {
  if (socket) return socket;

  const url =
    process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || 'http://localhost:4001';

  const tokenFromCookie = parseCookie('token');

  socket = io(url, {
    transports: ['websocket'],
    autoConnect: true,
    withCredentials: true,
    auth: tokenFromCookie ? { token: tokenFromCookie } : undefined,
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
    getSocket();
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
