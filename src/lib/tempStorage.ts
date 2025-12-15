// Временное хранилище для данных регистрации
// Использует Redis для production, in-memory для разработки

interface TempRegistrationData {
  name: string;
  email: string;
  password: string; // Хэшированный пароль
  verificationCode: string;
  verificationCodeExpires: Date;
}

// Fallback in-memory storage для случаев, когда Redis недоступен
const memoryStorage = new Map<string, TempRegistrationData>();

let redisConnected = false;

// Динамический импорт Redis только на сервере
async function getRedisClient() {
  if (typeof window === 'undefined') {
    try {
      const { registrationCache, connectRedis } = await import('./redis');
      if (!redisConnected) {
        await connectRedis();
        redisConnected = true;
      }
      return { registrationCache, connected: true };
    } catch (error) {
      console.warn('Redis not available, using memory storage');
      return { registrationCache: null, connected: false };
    }
  }
  return { registrationCache: null, connected: false };
}

export async function saveTempRegistration(
  email: string,
  data: Omit<TempRegistrationData, 'email'>
) {
  const { registrationCache, connected } = await getRedisClient();

  const registrationData: TempRegistrationData = { ...data, email };

  if (connected && registrationCache) {
    // Используем Redis
    await registrationCache.set(email, registrationData, 600); // 10 минут
  } else {
    // Fallback на memory storage
    memoryStorage.set(email, registrationData);
  }
}

export async function getTempRegistration(
  email: string
): Promise<TempRegistrationData | null> {
  const { registrationCache, connected } = await getRedisClient();

  if (connected && registrationCache) {
    // Используем Redis
    return await registrationCache.get(email);
  } else {
    // Fallback на memory storage
    return memoryStorage.get(email) || null;
  }
}

export async function deleteTempRegistration(email: string) {
  const { registrationCache, connected } = await getRedisClient();

  if (connected && registrationCache) {
    // Используем Redis
    await registrationCache.delete(email);
  } else {
    // Fallback на memory storage
    memoryStorage.delete(email);
  }
}

// Очистка истекших записей
export async function cleanupExpiredRegistrations() {
  const { registrationCache, connected } = await getRedisClient();

  if (connected && registrationCache) {
    // Redis автоматически очищает истекшие ключи
    await registrationCache.cleanup();
  } else {
    // Очистка memory storage
    const now = new Date();
    for (const [email, data] of memoryStorage.entries()) {
      if (data.verificationCodeExpires < now) {
        memoryStorage.delete(email);
      }
    }
  }
}
