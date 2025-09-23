# VisionAnalyzer - Спецификация модуля

## Назначение

VisionAnalyzer - модуль для анализа изображений UI интерфейсов через AI (Claude 3.5 Sonnet) с целью извлечения структурированных данных о компонентах интерфейса.

## Входные данные

### Формат изображений
- **PNG** - предпочтительный формат
- **JPG/JPEG** - поддерживается
- **WebP** - поддерживается
- **Максимальный размер:** 10MB
- **Рекомендуемое разрешение:** 1920x1080 или выше

### Предобработка
- Изменение размера (если необходимо)
- Улучшение контраста
- Шумоподавление
- Конвертация в PNG

## Выходные данные

### Структура ответа
```json
{
  "imageId": "uuid",
  "imagePath": "path/to/image.png",
  "timestamp": "2025-09-23T18:57:48.377Z",
  "elements": [
    {
      "id": "unique_id",
      "type": "chart|card|table|button|header|navigation|sidebar|form|input|text|image|container",
      "properties": {
        "title": "Заголовок элемента",
        "text": "Текст элемента",
        "value": "Значение",
        "color": "#1976d2",
        "backgroundColor": "#ffffff",
        "textColor": "#000000",
        "fontSize": "14px",
        "fontWeight": "500",
        "borderRadius": "8px",
        "border": "1px solid #e0e0e0",
        "padding": "16px",
        "margin": "8px",
        "width": "100%",
        "height": "auto",
        "data": {},
        "config": {}
      },
      "position": {
        "x": 20,
        "y": 80,
        "width": 400,
        "height": 300
      },
      "children": []
    }
  ],
  "layout": {
    "type": "flexbox|grid|absolute",
    "direction": "row|column",
    "gap": 16,
    "padding": 24,
    "justifyContent": "flex-start|center|flex-end|space-between",
    "alignItems": "flex-start|center|flex-end|stretch"
  },
  "colors": {
    "primary": "#1976d2",
    "secondary": "#dc004e",
    "background": "#ffffff",
    "text": "#000000",
    "accent": "#ff6b6b",
    "success": "#4caf50",
    "warning": "#ff9800",
    "error": "#f44336"
  },
  "typography": {
    "primaryFont": "Roboto, sans-serif",
    "primarySize": "14px",
    "headingSizes": ["24px", "20px", "16px"],
    "lineHeight": "1.5"
  },
  "metadata": {
    "totalElements": 5,
    "confidence": 0.95,
    "processingTime": 1758653868377,
    "tokens": {
      "prompt": 2522,
      "completion": 1396,
      "total": 3918
    },
    "temperature": 0.1,
    "model": "anthropic/claude-3.5-sonnet",
    "attempts": 1,
    "fallback": false
  }
}
```

## Поддерживаемые типы элементов

### 1. Chart (Графики)
- **Line Chart** - линейные графики
- **Bar Chart** - столбчатые диаграммы
- **Pie Chart** - круговые диаграммы
- **Donut Chart** - кольцевые диаграммы
- **Area Chart** - площадные графики

### 2. Card (Карточки)
- **Info Card** - информационные карточки
- **Metric Card** - карточки с метриками
- **Product Card** - карточки товаров
- **User Card** - карточки пользователей

### 3. Table (Таблицы)
- **Data Table** - таблицы данных
- **Comparison Table** - таблицы сравнения
- **Schedule Table** - таблицы расписаний

### 4. Button (Кнопки)
- **Primary Button** - основные кнопки
- **Secondary Button** - вторичные кнопки
- **Icon Button** - кнопки с иконками
- **Toggle Button** - переключатели

### 5. Header (Заголовки)
- **Page Header** - заголовки страниц
- **Section Header** - заголовки разделов
- **Card Header** - заголовки карточек

### 6. Navigation (Навигация)
- **Top Navigation** - верхняя навигация
- **Side Navigation** - боковая навигация
- **Breadcrumbs** - хлебные крошки
- **Pagination** - пагинация

### 7. Form (Формы)
- **Contact Form** - формы обратной связи
- **Login Form** - формы входа
- **Registration Form** - формы регистрации
- **Search Form** - формы поиска

### 8. Input (Поля ввода)
- **Text Input** - текстовые поля
- **Number Input** - числовые поля
- **Email Input** - поля email
- **Password Input** - поля пароля
- **Textarea** - многострочные поля

### 9. Text (Текст)
- **Heading** - заголовки
- **Paragraph** - абзацы
- **Label** - метки
- **Caption** - подписи

### 10. Image (Изображения)
- **Logo** - логотипы
- **Avatar** - аватары
- **Banner** - баннеры
- **Icon** - иконки

### 11. Container (Контейнеры)
- **Section** - секции
- **Grid** - сетки
- **Flexbox** - флексбоксы
- **Modal** - модальные окна

## Обработка ошибок

### Типы ошибок
1. **Ошибки API** - недоступность OpenRouter/OpenAI
2. **Ошибки парсинга** - некорректный JSON от AI
3. **Ошибки валидации** - некорректная структура данных
4. **Ошибки предобработки** - проблемы с изображением

### Стратегии обработки
1. **Повторные попытки** - до 3 попыток с задержкой
2. **Fallback промпт** - упрощенный анализ при ошибках
3. **Валидация структуры** - проверка корректности данных
4. **Очистка JSON** - исправление синтаксических ошибок

### Fallback режим
При критических ошибках возвращается минимальная структура:
```json
{
  "elements": [
    {
      "id": "fallback_element",
      "type": "container",
      "properties": {
        "title": "Не удалось проанализировать",
        "text": "Попробуйте другое изображение",
        "backgroundColor": "#f5f5f5",
        "textColor": "#666666"
      },
      "position": {
        "x": 0,
        "y": 0,
        "width": 400,
        "height": 200
      },
      "children": []
    }
  ],
  "layout": {
    "type": "flexbox",
    "direction": "column",
    "gap": 16,
    "padding": 24
  },
  "colors": {
    "primary": "#1976d2",
    "background": "#ffffff",
    "text": "#000000"
  },
  "typography": {
    "primaryFont": "Roboto, sans-serif",
    "primarySize": "14px"
  },
  "metadata": {
    "totalElements": 1,
    "confidence": 0.1,
    "processingTime": 0,
    "fallback": true
  }
}
```

## Конфигурация

### Настройки API
```json
{
  "models": {
    "openai": {
      "model": "gpt-4-vision-preview",
      "maxTokens": 4000,
      "temperature": 0.1
    }
  },
  "preprocessing": {
    "resize": true,
    "maxWidth": 1920,
    "maxHeight": 1080,
    "contrastEnhancement": true,
    "denoise": true
  },
  "analysis": {
    "batchSize": 1,
    "timeout": 30000
  }
}
```

### Промпты
```json
{
  "visionAnalysis": {
    "systemPrompt": "Ты - эксперт по анализу UI интерфейсов...",
    "userPrompt": "Проанализируй это изображение UI интерфейса...",
    "fallbackPrompt": "Если не можешь проанализировать изображение..."
  },
  "errorHandling": {
    "maxRetries": 3,
    "retryDelay": 1000,
    "fallbackEnabled": true
  }
}
```

## Метрики и мониторинг

### Ключевые метрики
- **Время обработки** - общее время анализа
- **Использование токенов** - prompt + completion токены
- **Успешность** - процент успешных анализов
- **Качество** - confidence score от AI
- **Количество попыток** - сколько раз потребовалось

### Логирование
- **Debug** - детальная информация о процессе
- **Info** - основные этапы обработки
- **Warn** - предупреждения и fallback режимы
- **Error** - ошибки и исключения

## Производительность

### Ограничения
- **Размер изображения:** до 10MB
- **Время обработки:** до 30 секунд
- **Количество элементов:** до 50 на изображение
- **Глубина вложенности:** до 5 уровней

### Оптимизации
- **Предобработка изображений** - сжатие и оптимизация
- **Кэширование результатов** - для повторных запросов
- **Батчевая обработка** - для множественных изображений
- **Параллельная обработка** - для независимых элементов

## Тестирование

### Unit тесты
- Валидация входных данных
- Обработка ошибок
- Парсинг JSON ответов
- Предобработка изображений

### Integration тесты
- Полный цикл анализа
- Взаимодействие с API
- Обработка различных типов изображений
- Fallback режимы

### Performance тесты
- Время обработки
- Использование памяти
- Нагрузочное тестирование
- Стресс-тестирование

## Будущие улучшения

### Краткосрочные
- Поддержка дополнительных типов элементов
- Улучшение точности анализа
- Оптимизация промптов
- Расширение fallback режимов

### Долгосрочные
- Машинное обучение для улучшения анализа
- Поддержка видео и анимаций
- Анализ интерактивности
- Интеграция с дизайн-системами
