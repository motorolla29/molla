import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Создаем Redis клиент
const redisClient = createClient({
  url: redisUrl,
});

// Обработчики событий
redisClient.on('error', (err) => {
  console.warn('Redis Client Error:', err);
});

// Подключаемся к Redis
let isConnected = false;
let connectionPromise: Promise<void> | null = null;

async function ensureConnection(): Promise<void> {
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    if (!isConnected && typeof window === 'undefined') {
      try {
        await redisClient.connect();
        isConnected = true;
      } catch (error) {
        console.error('❌ Failed to connect to Redis:', error);
        console.warn('⚠️ Redis unavailable - using memory fallback');
        // Не бросаем ошибку, чтобы приложение продолжало работать
      }
    }
  })();

  return connectionPromise;
}

export async function connectRedis() {
  await ensureConnection();
  return redisClient;
}

// Экспортируем клиент
export { redisClient };

// Fallback in-memory storage для случаев, когда Redis недоступен
const memoryFallback = new Map<string, any>();

// Вспомогательные функции для работы с данными регистрации
export const registrationCache = {
  async set(email: string, data: any, ttlSeconds: number = 600) {
    // Автоматическая инициализация Redis при первом использовании
    await ensureConnection();

    if (isConnected) {
      try {
        await redisClient.setEx(
          `registration:${email}`,
          ttlSeconds,
          JSON.stringify(data)
        );
        return true;
      } catch (error) {
        console.error('❌ Redis set error:', error);
        // Fallback to memory
        memoryFallback.set(email, {
          data,
          expires: Date.now() + ttlSeconds * 1000,
        });
        return false;
      }
    } else {
      // Use memory fallback
      memoryFallback.set(email, {
        data,
        expires: Date.now() + ttlSeconds * 1000,
      });
      return false;
    }
  },

  async get(email: string): Promise<any | null> {
    // Автоматическая инициализация Redis при первом использовании
    await ensureConnection();

    if (isConnected) {
      try {
        const data = await redisClient.get(`registration:${email}`);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error('Redis get error:', error);
        // Check memory fallback
        const fallback = memoryFallback.get(email);
        if (fallback && fallback.expires > Date.now()) {
          return fallback.data;
        }
        return null;
      }
    } else {
      // Use memory fallback
      const fallback = memoryFallback.get(email);
      if (fallback && fallback.expires > Date.now()) {
        return fallback.data;
      }
      return null;
    }
  },

  async delete(email: string) {
    // Автоматическая инициализация Redis при первом использовании
    await ensureConnection();

    if (isConnected) {
      try {
        await redisClient.del(`registration:${email}`);
      } catch (error) {
        console.error('Redis delete error:', error);
      }
    }

    // Always clean memory fallback
    memoryFallback.delete(email);
  },

  async cleanup() {
    // Clean expired memory fallback entries
    const now = Date.now();
    for (const [key, value] of memoryFallback.entries()) {
      if (value.expires <= now) {
        memoryFallback.delete(key);
      }
    }
  },
};
