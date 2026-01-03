# Bank - Система общения бизнеса и клиентов

Система для организации общения между бизнесами и их клиентами через чаты, ботов и каналы.

## Технологический стек

- **Backend:** Node.js + Express (JavaScript)
- **Frontend:** Vue 3 + Composition API + Vite
- **База данных:** MongoDB
- **Интеграция:** mms3 API + RabbitMQ
- **Структура:** Монорепо

## Структура проекта

```
bank/
├── backend/          # Node.js + Express backend
├── frontend/         # Vue 3 frontend
├── docs/            # Документация
│   ├── mms3/        # Документация mms3
│   ├── PLAN.md      # План проекта
│   └── IDEAS.md     # Идеи и предложения
└── README.md
```

## Требования

- Node.js 18+
- MongoDB (установлен и запущен)
- mms3 (установлен и запущен на порту 3000)
- RabbitMQ (опционально, для событий)

## Установка

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Отредактируйте .env с вашими настройками
npm start
```

Backend будет доступен на `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend будет доступен на `http://localhost:5173`

## Конфигурация

### Backend (.env)

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/bank
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

### Запуск в режиме разработки

Backend:
```bash
cd backend
npm run dev  # С автоперезагрузкой (если настроен nodemon)
```

Frontend:
```bash
cd frontend
npm run dev  # Vite dev server с HMR
```

## Лицензия

ISC
