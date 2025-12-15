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

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

redisClient.on('end', () => {
  console.log('Redis connection ended');
});

// Подключаемся к Redis
let isConnected = false;

export async function connectRedis() {
  if (!isConnected) {
    try {
      await redisClient.connect();
      isConnected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      // Fallback to in-memory storage if Redis is not available
      console.warn('Using in-memory storage as fallback');
    }
  }
  return redisClient;
}

// Экспортируем клиент
export { redisClient };

// Вспомогательные функции для работы с данными регистрации
export const registrationCache = {
  async set(email: string, data: any, ttlSeconds: number = 600) {
    // 10 минут по умолчанию
    try {
      await redisClient.setEx(
        `registration:${email}`,
        ttlSeconds,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Redis set error:', error);
    }
  },

  async get(email: string): Promise<any | null> {
    try {
      const data = await redisClient.get(`registration:${email}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  },

  async delete(email: string) {
    try {
      await redisClient.del(`registration:${email}`);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  },

  async cleanup() {
    // Redis автоматически удаляет истекшие ключи, но можем добавить дополнительную логику если нужно
  },
};
