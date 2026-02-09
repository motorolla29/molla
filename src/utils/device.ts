/**
 * Утилиты для работы с устройством пользователя
 */

interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  os: string;
  browser: string;
  ip: string;
  city?: string;
}

/**
 * Парсит User-Agent строку и возвращает информацию об устройстве
 */
function parseUserAgent(userAgent: string): Omit<DeviceInfo, 'ip' | 'city'> {
  const ua = userAgent.toLowerCase();

  // Определяем тип устройства
  let type: DeviceInfo['type'] = 'unknown';
  if (
    ua.includes('mobile') ||
    ua.includes('android') ||
    ua.includes('iphone')
  ) {
    type = ua.includes('tablet') || ua.includes('ipad') ? 'tablet' : 'mobile';
  } else if (
    ua.includes('windows') ||
    ua.includes('macintosh') ||
    ua.includes('linux')
  ) {
    type = 'desktop';
  }

  // Определяем ОС
  let os = 'Неизвестная ОС';
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('macintosh') || ua.includes('mac os x')) {
    os = 'macOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
  }

  // Определяем браузер
  let browser = 'Неизвестный браузер';
  if (ua.includes('firefox')) {
    browser = 'Firefox Browser';
  } else if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome Browser';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari Browser';
  } else if (ua.includes('edg')) {
    browser = 'Edge Browser';
  } else if (ua.includes('opera')) {
    browser = 'Opera Browser';
  }

  return { type, os, browser };
}

/**
 * Получает информацию о городе по IP адресу
 * Использует внешний API для геолокации
 */
async function getCityFromIP(ip: string): Promise<string | undefined> {
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:')) {
    return 'Локальный адрес';
  }

  // Очищаем IP от префиксов
  const cleanIp = ip.replace(/^::ffff:/, '');

  // Дополнительная проверка на локальные адреса после очистки
  if (
    cleanIp === '127.0.0.1' ||
    cleanIp === '::1' ||
    cleanIp.startsWith('192.168.') ||
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('172.')
  ) {
    return 'Локальный адрес';
  }

  try {
    // Пробуем несколько бесплатных API геолокации
    // Порядок важен: сначала API с токенами (более надежные), потом без ключей
    const apis = [
      // ipinfo.io с токеном (если есть в env) - самый надежный
      {
        url: process.env.IPINFO_TOKEN
          ? `https://ipinfo.io/${cleanIp}/json?token=${process.env.IPINFO_TOKEN}`
          : `https://ipinfo.io/${cleanIp}/json`,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MollaApp/1.0)',
        },
      },
      // ip.sb как основной вариант (работает хорошо)
      {
        url: `https://api.ip.sb/geoip/${cleanIp}`,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MollaApp/1.0)',
        },
      },
      // freegeoip.app как дополнительный вариант
      {
        url: `https://freegeoip.app/json/${cleanIp}`,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MollaApp/1.0)',
        },
      },
    ];

    for (let i = 0; i < apis.length; i++) {
      const api = apis[i];

      // Добавляем задержку между запросами (кроме первого)
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 секунда задержки
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд

        const response = await fetch(api.url, {
          signal: controller.signal,
          headers: api.headers,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          continue; // Пробуем следующий API
        }

        const data = await response.json();

        // Разные API возвращают данные в разных форматах
        let city: string | undefined;
        let country: string | undefined;

        if (data.city && data.country_name) {
          // ipapi.co format
          city = data.city;
          country = data.country_name;
        } else if (data.city && data.country) {
          // ipinfo.io format
          city = data.city;
          country = data.country;
        } else if (data.city && data.country_code) {
          // ip.sb format
          city = data.city;
          country = data.country_code;
        } else if (data.city && data.country) {
          // ip.sb alternative format
          city = data.city;
          country = data.country;
        }

        // Для ip.sb, если нет города, попробуем использовать другие поля
        if (!city && data.country) {
          if (data.region) {
            city = `${data.region}, ${data.country}`;
          } else {
            city = data.country;
          }
        }

        // freegeoip.app format
        if (!city && data.ip && data.city && data.country_name) {
          city = `${data.city}, ${data.country_name}`;
        }

        if (city && country) {
          return `${city}, ${country}`;
        } else if (city) {
          return city;
        }
      } catch (apiError) {
        console.warn(`API ${api.url} failed:`, apiError);
        continue; // Пробуем следующий API
      }
    }
  } catch (error) {
    console.warn('All geolocation APIs failed:', error);
  }

  return undefined;
}

/**
 * Возвращает тип устройства с соответствующим эмодзи
 */
export function getDeviceTypeEmoji(userAgent: string): string {
  const deviceInfo = parseUserAgent(userAgent);

  const emojiMap = {
    desktop: '💻',
    mobile: '📱',
    tablet: '📱',
    unknown: '',
  };

  return emojiMap[deviceInfo.type] || '';
}

/**
 * Создает человекочитаемое описание устройства для уведомлений
 */
export async function createDeviceDescription(
  userAgent: string,
  ip: string | null,
  loginTime?: Date,
): Promise<string> {
  const deviceInfo = parseUserAgent(userAgent);

  // Преобразуем тип устройства в русский
  const deviceTypeMap = {
    desktop: 'Десктоп',
    mobile: 'Мобильное устройство',
    tablet: 'Планшет',
    unknown: 'Неизвестное устройство',
  };

  const deviceType = deviceTypeMap[deviceInfo.type];

  // Получаем город по IP
  const city = ip ? await getCityFromIP(ip) : undefined;

  // Формируем описание
  let description = `${deviceType} (${deviceInfo.os}), ${deviceInfo.browser}`;

  if (city) {
    description += `, ${city}`;
  }

  // Добавляем время входа если указано
  // if (loginTime) {
  //   const timeStr = loginTime.toLocaleString('ru-RU', {
  //     hour: '2-digit',
  //     minute: '2-digit',
  //     day: '2-digit',
  //     month: '2-digit',
  //   });
  //   description += `, ${timeStr}`;
  // }

  return description;
}
