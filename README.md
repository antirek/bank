# Boqq - Система общения бизнеса и клиентов

Система для организации общения между бизнесами и их клиентами через чаты, ботов и каналы.

## Технологический стек

- **Backend:** Node.js + Express (JavaScript)
- **Frontend:** Vue 3 + Composition API + Vite
- **База данных:** MongoDB
- **Интеграция:** mms3 API + RabbitMQ
- **Структура:** Монорепо (npm workspaces)

## Структура проекта

```
boqq/
├── packages/           # API
│   ├── user-api/      # boqq-backend (3101)
│   └── auth-api/      # boqq-auth-api (3102)
├── packages-ui/
│   ├── user-ui/       # boqq-frontend (5173)
│   ├── auth-ui/       # форма входа (5174)
│   └── shared/        # @boqq/ui, api-client
├── packages-shared/   # @boqq/shared
└── docs/
```

## Требования

- Node.js 18+
- MongoDB (установлен и запущен)
- mms3 (установлен и запущен на порту 3000)
- RabbitMQ (опционально, для событий)

## Установка

Установка зависимостей одной командой из корня проекта:

```bash
npm install
```

Настройка backend (один раз):

```bash
cp packages/user-api/.env.example packages/user-api/.env
# Отредактируйте packages/user-api/.env с вашими настройками
```

- **user-api:** `npm run start:user-api` — `http://localhost:3101`, OpenAPI: `GET /api/api-docs`
- **user-ui:** `npm run dev:user-ui` — `http://localhost:5173`
- **auth-api:** `npm run dev:auth-api` — `http://localhost:3102` (send-code, verify-code)
- **auth-ui:** `npm run dev:auth-ui` — `http://localhost:5174` (форма входа; после входа редирект на user-ui с токеном)

Запуск всех четырёх сервисов: `npm run dev:all`

## Конфигурация

Конфиг: `import { config } from '@boqq/shared/config'`. Модели и ready: `import { User, ready, ... } from '@boqq/shared/models'`. Значения конфига берутся из env; при первом импорте вызывается `dotenv.config()` из рабочей директории приложения.

### user-api (.env)

```env
PORT=3101
MONGODB_URI=mongodb://localhost:27017/bank
JWT_SECRET=your-jwt-secret-key
MMS3_API_URL=...
```

### auth-api (.env, см. packages/auth-api/.env.example)

```env
PORT=3102
MONGODB_URI=mongodb://localhost:27017/bank
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=http://localhost:5174
```

**Важно:** `JWT_SECRET` в auth-api и user-api должен совпадать — иначе user-api не примет токен и будет постоянно редирект на форму входа.

### auth-ui (env при сборке / .env)

- `VITE_AUTH_API_URL` — URL auth-api (в dev можно не задавать: используется proxy /auth-api)
- `VITE_USER_UI_URL` — куда редиректить после входа (например `http://localhost:5173`)

### user-ui (env при сборке / .env)

- `VITE_AUTH_UI_URL` — ссылка на форму входа (например `http://localhost:5174`)

## API Endpoints

### Health Check
- `GET /api/health` - Проверка статуса API

### Users
- `GET /api/users` - Список пользователей
- `GET /api/users/:userId` - Получить пользователя
- `POST /api/users` - Создать пользователя
- `PUT /api/users/:userId` - Обновить пользователя

### Businesses
- `GET /api/businesses` - Список бизнесов
- `GET /api/businesses/:id` - Получить бизнес
- `GET /api/businesses/slug/:slug` - Получить бизнес по slug
- `POST /api/businesses` - Создать бизнес
- `PUT /api/businesses/:id` - Обновить бизнес

## Текущий статус

✅ Базовая инфраструктура настроена
✅ Backend API работает
✅ Frontend приложение запущено
✅ MongoDB модели созданы
✅ Базовые API endpoints реализованы
✅ Интерфейс проверен через Playwright

## Следующие шаги

См. `docs/PLAN.md` для детального плана реализации.

## Разработка

### Запуск из корня проекта (npm workspaces)

- `npm run dev:user-api` — user-api (3101)
- `npm run dev:user-ui` — user-ui (5173)
- `npm run dev:auth-api` — auth-api (3102)
- `npm run dev:auth-ui` — auth-ui (5174)
- `npm run dev:all` — все четыре сервиса

Сборка: `npm run build:user-ui`, `npm run build:auth-ui`

## Лицензия

ISC
