import { NextResponse } from 'next/server';
import { createDeviceDescription } from '@/utils/device';

// Расширенная версия для тестирования с логированием
async function createDeviceDescriptionWithLogs(
  userAgent: string,
  ip: string | null,
  loginTime?: Date
): Promise<{
  description: string;
  logs: string[];
}> {
  const logs: string[] = [];

  logs.push(`🔍 Начинаем анализ устройства для IP: ${ip || 'null'}`);

  // Парсим User-Agent
  const ua = userAgent.toLowerCase();
  let type: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown';
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

  let os = 'Неизвестная ОС';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os x')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  let browser = 'Неизвестный браузер';
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';

  logs.push(`📱 User-Agent анализ: ${type} · ${os} · ${browser}`);

  // Геолокация
  let city: string | undefined;

  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:')) {
    logs.push(`🏠 IP ${ip} определён как локальный`);
    city = 'Локальный адрес';
  } else {
    const cleanIp = ip.replace(/^::ffff:/, '');
    logs.push(`🌐 Очищенный IP: ${cleanIp}`);

    // Дополнительная проверка на локальные адреса после очистки
    if (
      cleanIp === '127.0.0.1' ||
      cleanIp === '::1' ||
      cleanIp.startsWith('192.168.') ||
      cleanIp.startsWith('10.') ||
      cleanIp.startsWith('172.')
    ) {
      logs.push(`🏠 IP ${cleanIp} определён как локальный после очистки`);
      city = 'Локальный адрес';
    } else {
      // Пробуем API (ipinfo.io временно отключен)
      const apis = [
        // ipinfo.io с токеном (если есть в env) - самый надежный
        {
          name: 'ipinfo.io',
          url: process.env.IPINFO_TOKEN
            ? `https://ipinfo.io/${cleanIp}/json?token=${process.env.IPINFO_TOKEN}`
            : `https://ipinfo.io/${cleanIp}/json`,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MollaApp/1.0)' },
        },
        // ip.sb как основной вариант (работает хорошо)
        {
          name: 'ip.sb',
          url: `https://api.ip.sb/geoip/${cleanIp}`,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MollaApp/1.0)' },
        },
        // freegeoip.app как дополнительный вариант
        {
          name: 'freegeoip.app',
          url: `https://freegeoip.app/json/${cleanIp}`,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MollaApp/1.0)' },
        },
      ];

      for (let i = 0; i < apis.length; i++) {
        const api = apis[i];

        // Добавляем задержку между запросами (кроме первого)
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 секунда задержки
        }

        try {
          logs.push(`🔄 Пробуем API: ${api.name} (${api.url})`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд

          const response = await fetch(api.url, {
            signal: controller.signal,
            headers: api.headers,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            logs.push(`❌ API ${api.name} вернул статус ${response.status}`);
            continue;
          }

          const data = await response.json();
          logs.push(`✅ API ${api.name} ответил: ${JSON.stringify(data)}`);

          // Разные API возвращают данные в разных форматах
          if (data.city && data.country_name) {
            // ipapi.co format
            city = `${data.city}, ${data.country_name}`;
          } else if (data.city && data.country) {
            // ipinfo.io format
            city = `${data.city}, ${data.country}`;
          } else if (data.city && data.country_code) {
            // ip.sb format
            city = `${data.city}, ${data.country_code}`;
          } else if (data.city && data.country) {
            // ip.sb alternative format
            city = `${data.city}, ${data.country}`;
          }

          // Для ip.sb, если нет города, попробуем использовать другие поля
          if (!city && data.country) {
            if (data.region) {
              city = `${data.region}, ${data.country}`;
            } else {
              city = data.country;
            }
          }

          // Разные API возвращают данные в разных форматах
          if (data.city && data.country_name) {
            // ipapi.co format или freegeoip.app
            city = `${data.city}, ${data.country_name}`;
          } else if (data.city && data.country) {
            // ipinfo.io format или ip.sb alternative
            city = `${data.city}, ${data.country}`;
          } else if (data.city && data.country_code) {
            // ip.sb format
            city = `${data.city}, ${data.country_code}`;
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

          if (city) {
            logs.push(`🎯 Успешно получен город: ${city} через ${api.name}`);
            break; // Выходим из цикла, если нашли город
          } else {
            logs.push(`⚠️ API ${api.name} не вернул город`);
          }
        } catch (apiError: any) {
          logs.push(`💥 Ошибка API ${api.name}: ${apiError.message}`);
          continue;
        }
      }

      if (!city) {
        logs.push(`❌ Все API геолокации провалились`);
        city = undefined;
      }
    }
  }

  // Формируем финальное описание
  const deviceTypeMap = {
    desktop: 'Десктоп',
    mobile: 'Мобильное',
    tablet: 'Планшет',
    unknown: 'Неизвестное устройство',
  };

  const deviceType = deviceTypeMap[type];
  let description = `${deviceType} · ${os} · ${browser}${
    city ? ` · ${city}` : ''
  }`;

  // Добавляем время входа если указано
  if (loginTime) {
    const timeStr = loginTime.toLocaleString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
    description += ` · ${timeStr}`;
  }

  logs.push(`📋 Финальное описание: ${description}`);

  return { description, logs };
}

export async function GET() {
  try {
    // Тестовые данные
    const testCases = [
      {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
        ip: '8.8.8.8', // Google DNS IP для тестирования
      },
      {
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        ip: '127.0.0.1', // Локальный IP
      },
      {
        userAgent:
          'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36',
        ip: '::1', // IPv6 локальный
      },
      {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ip: '79.127.211.214', // Реальный IP для тестирования
      },
    ];

    const results = [];

    for (const testCase of testCases) {
      console.log(`\n=== ТЕСТИРОВАНИЕ: ${testCase.ip} ===`);
      const { description, logs } = await createDeviceDescriptionWithLogs(
        testCase.userAgent,
        testCase.ip,
        new Date()
      );

      // Выводим логи в консоль сервера
      logs.forEach((log) => console.log(log));

      results.push({
        input: testCase,
        output: description,
        logs: logs,
      });
    }

    return NextResponse.json({
      success: true,
      results,
      message: 'Проверьте логи сервера для детальной информации о геолокации',
    });
  } catch (error) {
    console.error('Geolocation test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test geolocation',
      },
      { status: 500 }
    );
  }
}
