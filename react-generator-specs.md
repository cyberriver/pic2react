# React Component Generator из изображений - Документация

## 1. Пользовательские сценарии (User Stories)

### Основные сценарии

**US-001: Мониторинг входящих изображений**
Как разработчик, хочу бросить изображение UI элемента в папку `incoming`, чтобы система автоматически обнаружила его и начала обработку, при этом я получу уведомление о начале процесса.

**US-002: Автоматическое распознавание UI элементов**
Как пользователь, хочу чтобы система автоматически распознала типы UI элементов на изображении (кнопки, поля ввода, карточки, таблицы), чтобы не описывать их вручную.

**US-003: Анализ зависимостей проекта**
Как разработчик, хочу указать папку с проектом React, чтобы система проанализировала package.json и настроила генерацию под используемые библиотеки (MUI, Ant Design, styled-components и т.д.).

**US-004: Выбор версии React**
Как пользователь, хочу выбрать целевую версию React (16, 17, 18, 19), чтобы сгенерированный компонент использовал подходящие API и синтаксис.

**US-005: Генерация компонента с mock данными**
Как разработчик, хочу получить готовый React компонент с реалистичными mock данными, чтобы сразу увидеть как он выглядит и работает.

**US-006: Создание документации**
Как разработчик, хочу получить автоматически созданную документацию с описанием props, методов использования и примерами, чтобы понять как использовать компонент.

### Дополнительные сценарии

**US-007: Batch обработка**
Как пользователь, хочу загрузить несколько изображений одновременно, чтобы сгенерировать набор связанных компонентов для дизайн-системы.

**US-008: Настройка стилизации**
Как разработчик, хочу выбрать подход к стилизации (CSS Modules, styled-components, Tailwind CSS), чтобы компонент вписывался в архитектуру проекта.

**US-009: TypeScript поддержка**
Как разработчик, хочу получить TypeScript версию компонента с типизированными props, если проект использует TypeScript.

**US-010: Веб-интерфейс управления**
Как пользователь, хочу управлять процессом через веб-интерфейс, где могу видеть очередь обработки, настраивать параметры и просматривать результаты.

**US-011: Экспорт в различные форматы**
Как разработчик, хочу экспортировать результат в различные форматы: отдельные файлы, Storybook stories, тесты Jest, документация Markdown.

**US-012: Интеграция с Figma**
Как дизайнер, хочу экспортировать элементы прямо из Figma, чтобы не делать скриншоты вручную.

## 2. Техническая спецификация

### 2.1 Архитектура системы

```
react-component-generator/
├── core/                   # Основная логика
│   ├── fileWatcher.js     # Мониторинг файлов
│   ├── visionAnalyzer.js  # Computer Vision анализ
│   ├── projectAnalyzer.js # Анализ React проектов
│   ├── codeGenerator.js   # Генерация кода
│   └── mockGenerator.js   # Генерация mock данных
├── templates/              # Шаблоны компонентов
│   ├── react16/           # React 16.x шаблоны
│   ├── react17/           # React 17.x шаблоны
│   ├── react18/           # React 18.x шаблоны
│   └── react19/           # React 19.x шаблоны
├── web-ui/                 # Веб-интерфейс
│   ├── src/
│   ├── public/
│   └── package.json
├── incoming/               # Входящие изображения
├── packages/               # Проекты для анализа
├── processed/              # Обработанные данные
├── output/                 # Результаты генерации
└── config/                 # Конфигурация
    ├── vision.json        # Настройки CV
    ├── templates.json     # Настройки шаблонов
    └── ui-libraries.json  # Поддерживаемые UI библиотеки
```

### 2.2 Технологический стек

**Backend:**
- Node.js 18+ / Python 3.9+
- Express.js / FastAPI для веб-интерфейса
- Socket.io для real-time уведомлений

**Computer Vision:**
- YOLOv8 для детекции UI элементов
- EasyOCR для распознавания текста
- OpenCV для обработки изображений
- Альтернативно: OpenAI Vision API

**Генерация кода:**
- Handlebars.js для шаблонизации
- AST manipulation с babel/parser
- Prettier для форматирования
- ESLint для валидации

**Mock данные:**
- Faker.js для генерации данных
- Zod для валидации схем

**Мониторинг файлов:**
- chokidar (Node.js) / watchdog (Python)

**Frontend (Web UI):**
- React 18 + TypeScript
- Material-UI или Ant Design
- React Query для управления состоянием
- Socket.io-client для real-time

### 2.3 API спецификация

#### Конфигурация проекта
```typescript
interface ProjectConfig {
  name: string;
  path: string;
  reactVersion: '16' | '17' | '18' | '19';
  typescript: boolean;
  uiLibrary: 'mui' | 'antd' | 'chakra' | 'bootstrap' | 'none';
  styling: 'css' | 'scss' | 'styled-components' | 'emotion' | 'tailwind';
  stateManagement: 'useState' | 'redux' | 'zustand' | 'recoil';
}
```

#### Результат анализа изображения
```typescript
interface UIAnalysis {
  imageId: string;
  imagePath: string;
  timestamp: Date;
  elements: UIElement[];
  layout: LayoutInfo;
  colors: ColorPalette;
  typography: TypographyInfo;
}

interface UIElement {
  id: string;
  type: 'button' | 'input' | 'text' | 'image' | 'card' | 'table' | 'container';
  bbox: [number, number, number, number]; // x1, y1, x2, y2
  confidence: number;
  properties: ElementProperties;
  extractedText?: string;
}

interface ElementProperties {
  width: number;
  height: number;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  fontSize?: number;
  fontWeight?: string;
  [key: string]: any;
}
```

#### Результат генерации
```typescript
interface GeneratedComponent {
  componentName: string;
  files: GeneratedFile[];
  mockData: MockData;
  documentation: Documentation;
}

interface GeneratedFile {
  path: string;
  content: string;
  type: 'component' | 'styles' | 'types' | 'stories' | 'test' | 'docs';
}
```

### 2.4 Конфигурационные файлы

#### vision.json
```json
{
  "models": {
    "yolo": {
      "modelPath": "./models/ui-elements-yolo.pt",
      "confidenceThreshold": 0.7,
      "classes": ["button", "input", "text", "image", "card", "table", "container"]
    },
    "ocr": {
      "languages": ["en", "ru"],
      "confidenceThreshold": 0.8
    }
  },
  "preprocessing": {
    "resize": true,
    "maxWidth": 1920,
    "denoise": true,
    "contrastEnhancement": true
  }
}
```

#### ui-libraries.json
```json
{
  "mui": {
    "imports": {
      "Button": "@mui/material/Button",
      "TextField": "@mui/material/TextField",
      "Card": "@mui/material/Card"
    },
    "templates": "templates/mui/",
    "styling": "makeStyles"
  },
  "antd": {
    "imports": {
      "Button": "antd/es/button",
      "Input": "antd/es/input",
      "Card": "antd/es/card"
    },
    "templates": "templates/antd/",
    "styling": "css"
  }
}
```

### 2.5 Шаблоны генерации

#### Базовый шаблон React 18 компонента
```handlebars
// templates/react18/functional-component.hbs
import React{{#if hooks}}, { {{#each hooks}}{{this}}{{#unless @last}}, {{/unless}}{{/each}} }{{/if}} from 'react';
{{#each imports}}
import {{name}} from '{{path}}';
{{/each}}
{{#if typescript}}
interface {{componentName}}Props {
  {{#each props}}
  {{name}}{{#if optional}}?{{/if}}: {{type}};
  {{/each}}
}
{{/if}}

const {{componentName}}{{#if typescript}}: React.FC<{{componentName}}Props>{{/if}} = ({{#if props}}{
  {{#each props}}{{name}}{{#if defaultValue}} = {{defaultValue}}{{/if}},{{/each}}
}{{/if}}) => {
  {{#each stateHooks}}
  const [{{name}}, set{{capitalize name}}] = useState({{initialValue}});
  {{/each}}

  {{#each eventHandlers}}
  const {{name}} = {{#if async}}async {{/if}}({{parameters}}) => {
    {{body}}
  };
  {{/each}}

  return (
    <div className="{{kebabCase componentName}}">
      {{#each elements}}
      {{> (lookup ../templates type) this}}
      {{/each}}
    </div>
  );
};

export default {{componentName}};
{{#if typescript}}
export type { {{componentName}}Props };
{{/if}}
```

### 2.6 Процесс обработки

#### Pipeline обработки изображения
1. **Детекция файла** - chokidar обнаруживает новый файл
2. **Предобработка** - изменение размера, улучшение качества
3. **Computer Vision анализ** - YOLO детекция + OCR
4. **Классификация элементов** - определение типов UI элементов
5. **Извлечение свойств** - цвета, размеры, шрифты
6. **Выбор конфигурации проекта** - анализ package.json
7. **Генерация mock данных** - Faker.js создание данных
8. **Рендеринг шаблона** - Handlebars генерация кода
9. **Постобработка** - Prettier форматирование, ESLint валидация
10. **Сохранение результата** - файлы в папку output

#### Интерфейсы для веб-UI
```typescript
// API endpoints
POST /api/projects/analyze - анализ проекта
GET  /api/projects - список проектов
POST /api/images/upload - загрузка изображения
GET  /api/images/status/:id - статус обработки
GET  /api/components/:id - получение сгенерированного компонента
POST /api/generate - запуск генерации с параметрами
WS   /api/realtime - WebSocket для уведомлений
```

### 2.7 Требования к производительности

- Обработка изображения: < 30 сек
- Генерация компонента: < 10 сек
- Поддержка до 100 изображений в очереди
- Веб-интерфейс: отзывчивость < 200ms
- Память: < 2GB на процесс

### 2.8 Безопасность и ограничения

- Валидация типов файлов (только PNG, JPG, JPEG)
- Максимальный размер файла: 50MB
- Sandbox для выполнения сгенерированного кода
- Очистка временных файлов
- Логирование всех операций

---

## 3. Промт для Cursor AI

```
Создай React Component Generator - систему для автоматической генерации React компонентов из изображений UI элементов.

ТЕХНИЧЕСКОЕ ЗАДАНИЕ:

1. АРХИТЕКТУРА ПРОЕКТА:
   Создай Node.js приложение со следующей структурой:
   - core/ - основная логика (fileWatcher, visionAnalyzer, codeGenerator)  
   - templates/ - Handlebars шаблоны для разных версий React
   - web-ui/ - React 18 интерфейс управления
   - incoming/ - папка для входящих изображений
   - packages/ - папка с React проектами для анализа
   - output/ - результаты генерации

2. ОСНОВНОЙ ФУНКЦИОНАЛ:
   - Мониторинг папки incoming/ с помощью chokidar
   - Анализ изображений через OpenAI Vision API (детекция UI элементов)
   - Парсинг package.json для определения зависимостей React проекта
   - Генерация React компонентов через Handlebars шаблоны
   - Создание mock данных с Faker.js
   - Веб-интерфейс для управления процессом

3. ТЕХНОЛОГИЧЕСКИЙ СТЕК:
   Backend: Node.js, Express, Socket.io, chokidar, handlebars, prettier
   Vision: OpenAI API для анализа изображений
   Frontend: React 18, TypeScript, Material-UI, Socket.io-client
   Mock данные: Faker.js, зависит от типа UI элемента

4. ОСНОВНЫЕ КОМПОНЕНТЫ:

   FileWatcher (core/fileWatcher.js):
   - Следит за папкой incoming/
   - Обрабатывает новые изображения автоматически
   - Эмитит события через EventEmitter

   VisionAnalyzer (core/visionAnalyzer.js):
   - Интеграция с OpenAI Vision API
   - Распознает типы UI элементов (button, input, card, table)
   - Извлекает свойства: цвета, размеры, текст
   - Возвращает структурированные данные

   ProjectAnalyzer (core/projectAnalyzer.js):
   - Анализирует package.json файлы из папки packages/
   - Определяет версию React и используемые UI библиотеки
   - Настраивает параметры генерации

   CodeGenerator (core/codeGenerator.js):
   - Использует Handlebars для генерации компонентов
   - Поддерживает React 16, 17, 18, 19
   - Генерирует TypeScript при необходимости
   - Создает стили (CSS, styled-components, emotion)

   MockGenerator (core/mockGenerator.js):
   - Генерирует реалистичные данные с Faker.js
   - Адаптирует данные под тип UI элемента
   - Создает props и state для компонентов

5. ВЕБ-ИНТЕРФЕЙС (web-ui/):
   - Дашборд с очередью обработки
   - Форма выбора React проекта из packages/
   - Drag & drop для загрузки изображений
   - Превью сгенерированных компонентов
   - Настройки генерации (версия React, UI библиотеки)
   - Real-time уведомления через WebSocket

6. ШАБЛОНЫ ГЕНЕРАЦИИ:
   Создай Handlebars шаблоны для:
   - Функциональные компоненты React 18 с хуками
   - TypeScript интерфейсы для props
   - CSS Modules / styled-components стили
   - Storybook stories
   - Jest тесты
   - Документация с примерами использования

7. КОНФИГУРАЦИЯ:
   config/settings.json - настройки приложения
   config/ui-libraries.json - маппинг UI библиотек
   config/templates.json - конфигурация шаблонов

8. API ENDPOINTS:
   GET  /api/projects - список React проектов
   POST /api/images/upload - загрузка изображений
   GET  /api/images/status/:id - статус обработки
   POST /api/generate - запуск генерации
   GET  /api/components/:id - получение результата
   WebSocket /realtime - уведомления

9. ОСОБЫЕ ТРЕБОВАНИЯ:
   - Поддержка batch обработки нескольких изображений
   - Автоматическое определение UI библиотек (MUI, Ant Design, Chakra)
   - Генерация mock данных, подходящих для типа элемента
   - Форматирование кода через Prettier
   - Валидация через ESLint
   - Создание документации в Markdown

10. ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ:
    - Загрузка скриншота кнопки → генерация Button компонента с props
    - Загрузка макета формы → генерация Form с полями и валидацией
    - Загрузка карточки → генерация Card компонента с mock данными

НАЧНИ С:
1. Настройки package.json с необходимыми зависимостями
2. Базовая структура папок
3. FileWatcher для мониторинга incoming/
4. Простой VisionAnalyzer с OpenAI API
5. Базовый Handlebars шаблон для React 18 компонента

Сделай код модульным, с хорошей документацией и обработкой ошибок. Используй современные Node.js практики и React 18 фичи.
```