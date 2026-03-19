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
├── packages/           # API-пакеты
│   └── user-api/       # boqq-backend (Express + express-openapi)
├── packages-ui/        # UI-пакеты
│   ├── user-ui/        # boqq-frontend (Vue 3 + Vite)
│   └── shared/         # @boqq/ui (UserHeader, OwnerCard), api-client (@boqq/api-client)
├── packages-shared/   # @boqq/shared-models (mongoose-модели)
├── docs/
├── package.json        # workspaces: packages/*, packages-ui/*, packages-shared
└── README.md
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

Запуск backend: `npm run start:backend` — будет доступен на `http://localhost:3001` (или порт из `packages/user-api/.env`).  
Спецификация OpenAPI: `GET /api/api-docs` (JSON).  
Запуск frontend: `npm run dev:frontend` — будет доступен на `http://localhost:5173`

## Конфигурация

### Backend (.env)

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/boqq
MMS3_API_URL=http://localhost:3000/api
MMS3_API_KEY=your-api-key-here
MMS3_TENANT_ID=tnt_default
RABBITMQ_URL=amqp://localhost:5672
JWT_SECRET=your-jwt-secret-key
```

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

Backend (с автоперезагрузкой):
```bash
npm run dev:backend
```

Frontend (Vite dev server с HMR):
```bash
npm run dev:frontend
```

Сборка frontend: `npm run build:frontend`  
Превью собранного frontend: `npm run preview:frontend`

## Лицензия

ISC
