# Руководство по Frontend и Backend

## Обзор архитектуры

React Component Generator состоит из двух основных частей:
- **Backend** (Node.js/Express) - обработка изображений и генерация компонентов
- **Frontend** (React 18) - веб-интерфейс для взаимодействия с системой

## Backend (Порт 3001)

### Основные модули

#### 1. Главный сервер (`src/index.js`)
- **Express.js** сервер с REST API
- **Socket.io** для real-time коммуникации
- **Multer** для загрузки файлов
- **Winston** для логирования

#### 2. Core модули (`core/`)
- **FileWatcher** - мониторинг папки `incoming/`
- **VisionAnalyzer** - анализ изображений через OpenRouter API
- **ComponentWorkerV3** - генерация React компонентов
- **ProjectAnalyzer** - анализ React проектов

### API Эндпоинты

#### Основные
- `GET /api/health` - проверка состояния системы
- `POST /api/images/upload` - загрузка изображений
- `GET /api/images/status` - список всех задач обработки
- `GET /api/images/status/:id` - статус конкретной задачи

#### Компоненты
- `GET /api/components/clean/:id/:componentName` - получение очищенного кода компонента
- `GET /api/components/render/:id/:componentName` - рендеринг компонента (legacy)
- `GET /api/images/original/:id` - получение оригинального изображения

### Обработка данных

#### Поток обработки изображения:
1. **Загрузка** → папка `incoming/`
2. **Анализ** → VisionAnalyzer (Claude 3.5 Sonnet)
3. **Генерация** → ComponentWorkerV3
4. **Сохранение** → папка `output/{taskId}/`

#### Структура данных:
```javascript
// Задача обработки
{
  id: "uuid",
  imagePath: "path/to/image.png",
  fileName: "image.png",
  status: "processing|completed|error",
  createdAt: Date,
  result: {
    components: [{ name: "ComponentName", path: "path/to/component.tsx" }],
    tokens: { input: 1000, output: 500 },
    temperature: 0.7
  }
}
```

## Frontend (Порт 3000)

### Технологический стек
- **React 18** с TypeScript
- **Material-UI** для компонентов
- **@tanstack/react-query** для управления состоянием
- **React Router** для навигации
- **Vite** как сборщик

### Основные компоненты

#### 1. Dashboard (`src/components/Dashboard.tsx`)
- Статистика системы
- Мониторинг очереди обработки
- Real-time обновления через Socket.io

#### 2. ImageUpload (`src/components/ImageUpload.tsx`)
- Drag & Drop загрузка изображений
- Поддержка форматов: PNG, JPG, JPEG, WEBP
- Валидация файлов

#### 3. Components (`src/components/Components.tsx`)
- Список сгенерированных компонентов
- Предпросмотр кода
- Визуальное сравнение с оригиналом

#### 4. ComponentRenderer (`src/components/ComponentRenderer.tsx`)
- Безопасный рендеринг сгенерированных компонентов
- Очистка кода от import/export
- Использование React.createElement

### Состояние приложения

#### Основные типы данных:
```typescript
interface Component {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  status: 'processing' | 'completed' | 'error';
  quality: number;
  iterations: number;
  files: ComponentFile[];
  metadata: ComponentMetadata;
}

interface ProcessingJob {
  id: string;
  imagePath: string;
  fileName: string;
  status: string;
  createdAt: Date;
  result?: {
    components: any[];
    tokens: any;
    temperature: number;
  };
}
```

## Взаимодействие Frontend ↔ Backend

### 1. Загрузка изображения
```typescript
// Frontend
const formData = new FormData();
formData.append('image', file);
await fetch('/api/images/upload', { method: 'POST', body: formData });

// Backend
router.post('/images/upload', upload.single('image'), (req, res) => {
  // Обработка файла
});
```

### 2. Получение списка компонентов
```typescript
// Frontend
const response = await fetch('/api/images/status');
const data = await response.json();

// Backend
router.get('/images/status', (req, res) => {
  res.json({ success: true, data: processingQueue });
});
```

### 3. Рендеринг компонента
```typescript
// Frontend
<ComponentRenderer 
  componentId={component.id}
  componentName={component.files[0].name}
  height="400px"
/>

// Backend
router.get('/components/clean/:id/:componentName', (req, res) => {
  // Возвращает очищенный код компонента
});
```

## Конфигурация

### Backend (.env)
```env
OPENROUTER_API_KEY=your_api_key
PORT=3001
NODE_ENV=development
```

### Frontend (vite.config.ts)
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});
```

## Запуск системы

### Backend
```bash
cd pic2react
npm run dev
# Запускается на http://localhost:3001
```

### Frontend
```bash
cd pic2react/web-ui
npm run dev
# Запускается на http://localhost:3000
```

## Отладка

### Backend логи
- Файлы в папке `logs/`
- Уровни: error, warn, info, debug
- Winston конфигурация в `src/index.js`

### Frontend отладка
- React DevTools
- Console логи в браузере
- Network tab для API запросов

### Общие проблемы
1. **Порт занят** - проверьте процессы на портах 3000/3001
2. **API недоступен** - убедитесь что backend запущен
3. **CORS ошибки** - проверьте proxy настройки в Vite
4. **Ошибки рендеринга** - проверьте логи ComponentRenderer

## Безопасность

### Backend
- Валидация загружаемых файлов
- Ограничение размеров файлов
- Санитизация данных от AI

### Frontend
- Безопасный рендеринг через React.createElement
- Валидация данных от API
- Обработка ошибок рендеринга

## Производительность

### Backend
- Асинхронная обработка очереди
- Кэширование результатов
- Оптимизация запросов к AI API

### Frontend
- Lazy loading компонентов
- Мемоизация через React Query
- Оптимизация re-renders
