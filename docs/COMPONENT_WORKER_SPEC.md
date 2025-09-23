# ComponentWorker - Спецификация модуля

## Назначение

ComponentWorker - модуль для генерации React компонентов на основе структурированных данных от VisionAnalyzer с использованием гибридного подхода: базовое сопоставление + итеративная оптимизация + визуальная валидация.

## Архитектура

### Гибридный подход
```
Структурированные данные → Базовое сопоставление → Итеративная оптимизация → Визуальная валидация → React компоненты
```

### Основные этапы
1. **Базовое сопоставление** - определение типа React компонента
2. **Итеративная оптимизация** - подгонка ключевых параметров
3. **Визуальная валидация** - сравнение с оригинальным изображением
4. **Генерация кода** - создание React компонента
5. **Сохранение** - запись в файловую систему

## Входные данные

### Структура от VisionAnalyzer
```json
{
  "imageId": "uuid",
  "elements": [
    {
      "id": "element_1",
      "type": "chart",
      "properties": {
        "title": "Sales Chart",
        "data": [10, 20, 30, 40],
        "color": "#1976d2"
      },
      "position": {
        "x": 20,
        "y": 80,
        "width": 400,
        "height": 300
      }
    }
  ],
  "layout": {
    "type": "flexbox",
    "direction": "column"
  }
}
```

### Опции генерации
```json
{
  "projectPath": "/path/to/react/project",
  "outputDir": "output",
  "componentLibrary": "material-ui",
  "typescript": true,
  "cssModules": false,
  "optimization": {
    "enabled": true,
    "maxIterations": 10,
    "qualityThreshold": 0.9
  }
}
```

## Выходные данные

### Структура результата
```json
{
  "components": [
    {
      "id": "element_1",
      "name": "SalesChart",
      "type": "chart",
      "content": "import React from 'react'...",
      "filePath": "output/uuid/SalesChart.tsx",
      "quality": 0.95,
      "iterations": 3
    }
  ],
  "mainComponentPath": "output/uuid/MainComponent.tsx",
  "indexPath": "output/uuid/index.ts",
  "metadata": {
    "totalComponents": 1,
    "averageQuality": 0.95,
    "totalIterations": 3,
    "processingTime": 2500
  }
}
```

## Базовое сопоставление

### Маппинг типов
```javascript
const TYPE_MAPPING = {
  'chart': 'ChartComponent',
  'card': 'CardComponent', 
  'table': 'TableComponent',
  'button': 'ButtonComponent',
  'header': 'HeaderComponent',
  'navigation': 'NavigationComponent',
  'sidebar': 'SidebarComponent',
  'form': 'FormComponent',
  'input': 'InputComponent',
  'text': 'TextComponent',
  'image': 'ImageComponent',
  'container': 'ContainerComponent'
};
```

### Извлечение базовых параметров
```javascript
function extractBaseParams(element) {
  return {
    type: TYPE_MAPPING[element.type] || 'GenericComponent',
    props: {
      title: element.properties.title,
      text: element.properties.text,
      color: element.properties.color,
      backgroundColor: element.properties.backgroundColor,
      width: element.position.width,
      height: element.position.height
    },
    styles: {
      position: 'absolute',
      left: element.position.x,
      top: element.position.y,
      width: element.position.width,
      height: element.position.height
    }
  };
}
```

## Итеративная оптимизация

### Ключевые параметры для оптимизации
```javascript
const OPTIMIZATION_PARAMS = {
  'chart': ['width', 'height', 'color', 'data', 'config'],
  'card': ['width', 'height', 'padding', 'borderRadius', 'backgroundColor'],
  'table': ['width', 'height', 'columns', 'data', 'styling'],
  'button': ['width', 'height', 'color', 'backgroundColor', 'borderRadius'],
  'text': ['fontSize', 'fontWeight', 'color', 'lineHeight'],
  'image': ['width', 'height', 'objectFit', 'borderRadius']
};
```

### Алгоритм оптимизации
```javascript
class ParameterOptimizer {
  async optimizeComponent(baseComponent, targetImage, options) {
    const keyParams = OPTIMIZATION_PARAMS[baseComponent.type] || [];
    let currentComponent = baseComponent;
    let bestQuality = 0;
    let bestComponent = currentComponent;
    
    for (let iteration = 0; iteration < options.maxIterations; iteration++) {
      // Генерируем варианты параметров
      const variants = this.generateVariants(currentComponent, keyParams);
      
      // Оцениваем качество каждого варианта
      for (const variant of variants) {
        const quality = await this.evaluateQuality(variant, targetImage);
        
        if (quality > bestQuality) {
          bestQuality = quality;
          bestComponent = variant;
        }
        
        // Проверяем критерий остановки
        if (quality >= options.qualityThreshold) {
          return { component: variant, quality, iterations: iteration + 1 };
        }
      }
      
      currentComponent = bestComponent;
    }
    
    return { component: bestComponent, quality: bestQuality, iterations: options.maxIterations };
  }
}
```

### Генерация вариантов
```javascript
function generateVariants(component, keyParams) {
  const variants = [];
  
  for (const param of keyParams) {
    const currentValue = component.props[param];
    const variations = generateParamVariations(param, currentValue);
    
    for (const variation of variations) {
      variants.push({
        ...component,
        props: {
          ...component.props,
          [param]: variation
        }
      });
    }
  }
  
  return variants;
}

function generateParamVariations(param, currentValue) {
  switch (param) {
    case 'width':
    case 'height':
      return [
        currentValue * 0.9,
        currentValue * 1.1,
        currentValue * 0.95,
        currentValue * 1.05
      ];
    case 'color':
    case 'backgroundColor':
      return generateColorVariations(currentValue);
    case 'fontSize':
      return [
        currentValue * 0.9,
        currentValue * 1.1,
        currentValue * 0.95,
        currentValue * 1.05
      ];
    default:
      return [currentValue];
  }
}
```

## Визуальная валидация

### Генерация изображения из React компонента
```javascript
class VisualValidator {
  async renderComponent(component) {
    // Создаем временный React компонент
    const tempComponent = this.createTempComponent(component);
    
    // Рендерим в headless браузере
    const image = await this.renderInBrowser(tempComponent);
    
    return image;
  }
  
  async renderInBrowser(component) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Создаем HTML с React компонентом
    const html = this.generateHTML(component);
    await page.setContent(html);
    
    // Делаем скриншот
    const image = await page.screenshot({
      type: 'png',
      fullPage: false
    });
    
    await browser.close();
    return image;
  }
}
```

### Сравнение изображений
```javascript
class ImageComparator {
  async compareImages(image1, image2) {
    // Конвертируем в base64
    const base64_1 = image1.toString('base64');
    const base64_2 = image2.toString('base64');
    
    // Вычисляем структурное сходство
    const similarity = await this.calculateSSIM(base64_1, base64_2);
    
    return similarity;
  }
  
  async calculateSSIM(image1, image2) {
    // Используем библиотеку для вычисления SSIM
    const ssim = require('ssim.js');
    const result = ssim(image1, image2);
    return result.ssim;
  }
}
```

## Генерация кода

### Шаблоны компонентов
```javascript
const COMPONENT_TEMPLATES = {
  'ChartComponent': `
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ChartComponentProps {
  title?: string;
  data: any[];
  color?: string;
  width?: number;
  height?: number;
}

const ChartComponent: React.FC<ChartComponentProps> = ({
  title,
  data,
  color = '#1976d2',
  width = 400,
  height = 300
}) => {
  return (
    <div style={{ width, height }}>
      {title && <h3>{title}</h3>}
      <LineChart width={width} height={height} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="value" stroke={color} />
      </LineChart>
    </div>
  );
};

export default ChartComponent;
  `,
  
  'CardComponent': `
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@mui/material';

interface CardComponentProps {
  title?: string;
  content?: string;
  backgroundColor?: string;
  width?: number;
  height?: number;
}

const CardComponent: React.FC<CardComponentProps> = ({
  title,
  content,
  backgroundColor = '#ffffff',
  width = 300,
  height = 200
}) => {
  return (
    <Card 
      style={{ 
        width, 
        height, 
        backgroundColor,
        margin: '8px'
      }}
    >
      {title && (
        <CardHeader title={title} />
      )}
      <CardContent>
        {content && <p>{content}</p>}
      </CardContent>
    </Card>
  );
};

export default CardComponent;
  `
};
```

### Генерация главного компонента
```javascript
function generateMainComponent(analysis, components, options) {
  const imports = components.map(comp => 
    `import ${comp.name} from './${comp.name}';`
  ).join('\n');
  
  const renders = components.map(comp => 
    `    <${comp.name} {...${comp.name}Props} />`
  ).join('\n');
  
  return `
import React from 'react';
${imports}

interface MainComponentProps {
  className?: string;
}

const MainComponent: React.FC<MainComponentProps> = ({ className = '' }) => {
  return (
    <div 
      className={\`main-component \${className}\`}
      style={{
        display: '${analysis.layout.type}',
        flexDirection: '${analysis.layout.direction}',
        gap: '${analysis.layout.gap}px',
        padding: '${analysis.layout.padding}px'
      }}
    >
${renders}
    </div>
  );
};

export default MainComponent;
  `;
}
```

## Обработка ошибок

### Типы ошибок
1. **Ошибки валидации** - некорректные входные данные
2. **Ошибки генерации** - проблемы с созданием компонента
3. **Ошибки оптимизации** - сбои в итеративном процессе
4. **Ошибки сохранения** - проблемы с записью файлов

### Fallback компоненты
```javascript
function generateFallbackComponent(element) {
  const componentName = generateComponentName(element);
  const { properties, position } = element;
  
  return `
import React from 'react';

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({
  className = '',
  children
}) => {
  return (
    <div
      className={\`fallback-component \${className}\`}
      style={{
        width: '${position.width}px',
        height: '${position.height}px',
        backgroundColor: '${properties.backgroundColor || '#f5f5f5'}',
        border: '1px dashed #ccc',
        borderRadius: '${properties.borderRadius || '4px'}',
        padding: '${properties.padding || '16px'}',
        margin: '${properties.margin || '8px'}',
        color: '${properties.textColor || '#666'}',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>
        ${element.type.toUpperCase()} Component
      </p>
      <p style={{ margin: 0, fontSize: '12px' }}>
        ID: ${element.id}
      </p>
      {children}
    </div>
  );
};

export default ${componentName};
  `;
}
```

## Конфигурация

### Настройки оптимизации
```json
{
  "optimization": {
    "enabled": true,
    "maxIterations": 10,
    "qualityThreshold": 0.9,
    "paramVariations": {
      "width": [0.9, 0.95, 1.05, 1.1],
      "height": [0.9, 0.95, 1.05, 1.1],
      "color": ["lighter", "darker", "complementary"],
      "fontSize": [0.9, 0.95, 1.05, 1.1]
    }
  },
  "visualValidation": {
    "enabled": true,
    "browser": "puppeteer",
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    "screenshot": {
      "type": "png",
      "quality": 90
    }
  },
  "codeGeneration": {
    "typescript": true,
    "cssModules": false,
    "componentLibrary": "material-ui",
    "prettier": true,
    "eslint": true
  }
}
```

## Метрики и мониторинг

### Ключевые метрики
- **Время обработки** - общее время генерации
- **Качество результата** - similarity score
- **Количество итераций** - до достижения качества
- **Успешность генерации** - процент успешных компонентов
- **Использование fallback** - частота использования запасных вариантов

### Логирование
```javascript
logger.info('Начинаем генерацию компонента', {
  elementId: element.id,
  elementType: element.type,
  optimizationEnabled: options.optimization.enabled
});

logger.debug('Итерация оптимизации', {
  iteration: i,
  currentQuality: quality,
  bestQuality: bestQuality
});

logger.warn('Используем fallback компонент', {
  elementId: element.id,
  reason: error.message
});
```

## Производительность

### Ограничения
- **Максимум итераций:** 20
- **Время обработки:** до 60 секунд на компонент
- **Размер изображения:** до 10MB
- **Количество элементов:** до 100 на изображение

### Оптимизации
- **Параллельная обработка** - независимые элементы
- **Кэширование результатов** - для повторных запросов
- **Предварительная валидация** - отсев заведомо плохих вариантов
- **Адаптивные параметры** - уменьшение вариантов при низком качестве

## Тестирование

### Unit тесты
- Валидация входных данных
- Базовое сопоставление типов
- Генерация вариантов параметров
- Создание fallback компонентов

### Integration тесты
- Полный цикл генерации
- Взаимодействие с VisionAnalyzer
- Сохранение в файловую систему
- Обработка ошибок

### Performance тесты
- Время генерации компонентов
- Использование памяти
- Нагрузочное тестирование
- Стресс-тестирование оптимизации

## Будущие улучшения

### Краткосрочные
- Поддержка дополнительных UI библиотек
- Улучшение алгоритмов оптимизации
- Расширение fallback режимов
- Оптимизация производительности

### Долгосрочные
- Машинное обучение для предсказания параметров
- Поддержка анимаций и интерактивности
- Интеграция с дизайн-системами
- Автоматическое тестирование компонентов
