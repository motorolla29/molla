This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Development (локально из одного репозитория)

Запустите оба сервера одновременно:

```bash
# Терминал 1: Next.js приложение (порт 3000)
npm run dev

# Терминал 2: Socket.IO сервер (порт 4001)
npm run socket:dev
```

Socket сервер запускается командой `npm run socket:dev`, которая выполняет `node realtime-server/server.js`.

### Переменные окружения для разработки

Создайте `.env` файл в корне проекта:
```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
NEXT_PUBLIC_SOCKET_URL="http://localhost:4001"
```

### Структура проекта
```
molla/
├── src/                    # Next.js приложение (Vercel)
├── realtime-server/        # Socket.IO сервер (Railway)
│   ├── server.js          # Главный серверный файл
│   ├── package.json       # Зависимости socket сервера
│   └── README.md          # Документация socket сервера
├── prisma/                # Схема БД (общая)
├── vercel.json           # Конфиг деплоя на Vercel
└── railway.toml          # Конфиг деплоя на Railway
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment Guide

### Architecture (один репозиторий)
```
Основной репозиторий: molla/
├── src/                    # Next.js приложение
├── prisma/                 # База данных
├── realtime-server/        # Socket.IO сервер
│   ├── server.js
│   └── package.json
├── vercel.json            # Конфиг для Vercel
└── railway.toml           # Конфиг для Railway

Деплой:
├── Vercel ← src/ (Next.js app)
└── Railway ← realtime-server/ (Socket.IO)
```

**Преимущества одного репозитория:**
- ✅ Легче поддерживать код в синхронизированном состоянии
- ✅ Общие зависимости (JWT, database schemas) в одном месте
- ✅ Упрощенное управление версиями
- ✅ Один источник правды для всего проекта

### 1. Deploy Socket Server to Railway (из основного репозитория)

#### Вариант 1: Деплой папки realtime-server через Railway CLI
```bash
# Установить Railway CLI
npm install -g @railway/cli

# Авторизоваться
railway login

# Создать проект Railway
railway init

# Связать с папкой realtime-server
railway up --service realtime-server
```

#### Вариант 2: Настроить Railway через веб-интерфейс
1. Go to [Railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub"
3. Выберите ваш основной репозиторий Molla
4. В настройках проекта укажите **Root Directory**: `realtime-server`
5. Railway автоматически обнаружит package.json в папке realtime-server

#### Переменные окружения для Railway:
```
DATABASE_URL=postgresql://... (from your database)
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=https://your-app.vercel.app
PORT=4001
```

#### Получить Railway URL:
После деплоя скопируйте URL (типа `https://molla-production.up.railway.app`)

### 2. Deploy Next.js App to Vercel (из основного репозитория)

#### Step 1: Deploy to Vercel
```bash
npm i -g vercel
vercel --prod
```

#### Step 2: Настройки Vercel
Vercel автоматически обнаружит `vercel.json` и будет использовать его настройки. Проект будет собираться из корневой папки, игнорируя `realtime-server`.

#### Step 3: Configure Environment Variables in Vercel Dashboard
Go to your Vercel project settings and add:
```
DATABASE_URL=postgresql://... (same as Railway)
JWT_SECRET=your-super-secret-jwt-key (same as Railway)
NEXT_PUBLIC_SOCKET_URL=https://your-railway-app.up.railway.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Final Steps

1. **Проверьте CORS** - в Railway установите `CORS_ORIGIN=https://your-vercel-app.vercel.app`
2. **Тестируйте соединение** - Socket сервер должен быть доступен из Next.js приложения
3. **Мониторьте логи** в дашбордах Railway и Vercel

### Важные замечания

- **Root Directory в Railway**: Установите `realtime-server` как корневую папку для деплоя
- **Build Command в Railway**: `npm install` (автоматически)
- **Start Command в Railway**: `npm start` (из package.json в realtime-server)
- **Vercel игнорирует realtime-server**: Благодаря vercel.json конфигурации

### Troubleshooting

- **Railway не находит package.json**: Убедитесь, что указали Root Directory `realtime-server`
- **Socket connection fails**: Проверьте `NEXT_PUBLIC_SOCKET_URL` в Vercel и `CORS_ORIGIN` в Railway
- **Build fails**: Убедитесь, что все переменные окружения установлены правильно

### Troubleshooting

- **Socket connection fails**: Check CORS_ORIGIN in Railway matches Vercel URL
- **Database errors**: Ensure DATABASE_URL is correct in both services
- **JWT errors**: Ensure JWT_SECRET is identical in both services

### Costs
- **Railway**: Free tier (512MB RAM, $5/month over limit)
- **Vercel**: Free tier (100GB bandwidth/month)
- **Database**: PostgreSQL provider (Supabase free, Railway paid, etc.)
