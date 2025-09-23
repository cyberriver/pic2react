import fs from 'fs/promises';
import path from 'path';
import prettier from 'prettier';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

/**
 * ComponentWorkerV2 - Гибридный подход к генерации React компонентов
 * Этап 1: Базовое сопоставление
 * Этап 2: Итеративная оптимизация
 * Этап 3: Визуальная валидация (в разработке)
 */
class ComponentWorkerV2 {
  constructor() {
    this.outputDir = './output';
    
    // Маппинг типов AI анализа на React компоненты
    this.typeMapping = {
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

    // Ключевые параметры для оптимизации по типам
    this.optimizationParams = {
      'chart': ['width', 'height', 'color', 'data', 'config'],
      'card': ['width', 'height', 'padding', 'borderRadius', 'backgroundColor'],
      'table': ['width', 'height', 'columns', 'data', 'styling'],
      'button': ['width', 'height', 'color', 'backgroundColor', 'borderRadius'],
      'text': ['fontSize', 'fontWeight', 'color', 'lineHeight'],
      'image': ['width', 'height', 'objectFit', 'borderRadius']
    };

    // Настройки оптимизации
    this.optimizationConfig = {
      enabled: true,
      maxIterations: 10,
      qualityThreshold: 0.9,
      paramVariations: {
        'width': [0.9, 0.95, 1.05, 1.1],
        'height': [0.9, 0.95, 1.05, 1.1],
        'color': ['lighter', 'darker', 'complementary'],
        'fontSize': [0.9, 0.95, 1.05, 1.1]
      }
    };
  }

  /**
   * Основной метод обработки структурированных данных
   */
  async processStructuredData(analysis, options = {}) {
    try {
      logger.info(`🚀 Начинаем гибридную обработку для ${analysis.imageId}`);

      const result = {
        imageId: analysis.imageId,
        timestamp: new Date(),
        components: [],
        metadata: {
          totalElements: analysis.elements?.length || 0,
          tokens: analysis.metadata?.tokens || {},
          temperature: analysis.metadata?.temperature || 0.7,
          model: analysis.metadata?.model || 'unknown',
          optimizationEnabled: this.optimizationConfig.enabled
        }
      };

      // Создаем папку для компонентов
      const componentDir = path.join(this.outputDir, analysis.imageId);
      await fs.mkdir(componentDir, { recursive: true });

      // Обрабатываем каждый элемент
      for (const element of analysis.elements || []) {
        try {
          logger.debug(`📝 Обрабатываем элемент: ${element.id} (тип: ${element.type})`);
          
          // Этап 1: Базовое сопоставление
          const baseComponent = await this.performBasicMapping(element, analysis, options);
          
          // Этап 2: Итеративная оптимизация (если включена)
          let optimizedComponent = baseComponent;
          if (this.optimizationConfig.enabled) {
            optimizedComponent = await this.performIterativeOptimization(
              baseComponent, 
              element, 
              analysis, 
              options
            );
          }
          
          // Этап 3: Генерация финального компонента
          const finalComponent = await this.generateFinalComponent(
            optimizedComponent, 
            element, 
            analysis, 
            options
          );
          
          if (finalComponent) {
            result.components.push(finalComponent);
            await this.saveComponent(finalComponent, componentDir);
            logger.info(`✅ Компонент создан: ${finalComponent.name}`);
          }
          
        } catch (error) {
          logger.error(`❌ Ошибка обработки элемента ${element.id}:`, error);
          
          // Fallback компонент
          const fallbackComponent = this.generateFallbackComponent(element);
          result.components.push(fallbackComponent);
          await this.saveComponent(fallbackComponent, componentDir);
        }
      }

      // Создаем главный компонент
      const mainComponent = await this.generateMainComponent(analysis, result.components, options);
      if (mainComponent) {
        result.components.push(mainComponent);
        await this.saveComponent(mainComponent, componentDir);
      }

      // Создаем index файл
      await this.createIndexFile(result.components, componentDir);

      logger.info(`🎉 Гибридная обработка завершена для ${analysis.imageId}. Создано компонентов: ${result.components.length}`);
      return result;

    } catch (error) {
      logger.error('💥 Критическая ошибка гибридной обработки:', error);
      throw error;
    }
  }

  /**
   * Этап 1: Базовое сопоставление AI анализа с React компонентами
   */
  async performBasicMapping(element, analysis, options) {
    logger.debug(`🔍 Базовое сопоставление для ${element.id}`);
    
    const componentType = this.typeMapping[element.type] || 'GenericComponent';
    const baseParams = this.extractBaseParams(element);
    
    const baseComponent = {
      id: element.id,
      type: element.type,
      componentType: componentType,
      name: this.generateComponentName(element),
      baseParams: baseParams,
      element: element,
      quality: 0.5, // Базовое качество
      iterations: 0
    };

    logger.debug(`📊 Базовые параметры извлечены:`, {
      componentType,
      paramsCount: Object.keys(baseParams).length,
      quality: baseComponent.quality
    });

    return baseComponent;
  }

  /**
   * Этап 2: Итеративная оптимизация ключевых параметров
   */
  async performIterativeOptimization(baseComponent, element, analysis, options) {
    logger.debug(`⚡ Начинаем итеративную оптимизацию для ${element.id}`);
    
    const keyParams = this.optimizationParams[element.type] || ['width', 'height'];
    let currentComponent = { ...baseComponent };
    let bestQuality = currentComponent.quality;
    let bestComponent = currentComponent;
    
    for (let iteration = 0; iteration < this.optimizationConfig.maxIterations; iteration++) {
      logger.debug(`🔄 Итерация ${iteration + 1}/${this.optimizationConfig.maxIterations}`);
      
      // Генерируем варианты параметров
      const variants = this.generateParamVariants(currentComponent, keyParams);
      
      // Оцениваем качество каждого варианта
      for (const variant of variants) {
        const quality = await this.evaluateComponentQuality(variant, element, analysis);
        
        if (quality > bestQuality) {
          bestQuality = quality;
          bestComponent = { ...variant, quality, iterations: iteration + 1 };
          logger.debug(`📈 Улучшение качества: ${quality.toFixed(3)} (итерация ${iteration + 1})`);
        }
        
        // Проверяем критерий остановки
        if (quality >= this.optimizationConfig.qualityThreshold) {
          logger.info(`🎯 Достигнуто целевое качество: ${quality.toFixed(3)}`);
          return { ...variant, quality, iterations: iteration + 1 };
        }
      }
      
      currentComponent = bestComponent;
    }
    
    logger.info(`🏁 Оптимизация завершена. Лучшее качество: ${bestQuality.toFixed(3)}`);
    return bestComponent;
  }

  /**
   * Этап 3: Генерация финального React компонента
   */
  async generateFinalComponent(optimizedComponent, element, analysis, options) {
    logger.debug(`🎨 Генерируем финальный компонент: ${optimizedComponent.name}`);
    
    const componentContent = await this.generateComponentCode(optimizedComponent, element, analysis, options);
    
    return {
      id: optimizedComponent.id,
      type: optimizedComponent.type,
      name: optimizedComponent.name,
      content: componentContent,
      element: element,
      quality: optimizedComponent.quality,
      iterations: optimizedComponent.iterations,
      metadata: {
        componentType: optimizedComponent.componentType,
        baseParams: optimizedComponent.baseParams,
        optimizationUsed: this.optimizationConfig.enabled
      }
    };
  }

  /**
   * Извлечение базовых параметров из AI анализа
   */
  extractBaseParams(element) {
    const { properties, position } = element;
    
    return {
      // Размеры
      width: position?.width || 300,
      height: position?.height || 200,
      
      // Стили
      color: properties?.color || '#1976d2',
      backgroundColor: properties?.backgroundColor || '#ffffff',
      textColor: properties?.textColor || '#000000',
      fontSize: properties?.fontSize || '14px',
      fontWeight: properties?.fontWeight || '400',
      borderRadius: properties?.borderRadius || '4px',
      border: properties?.border || 'none',
      padding: properties?.padding || '16px',
      margin: properties?.margin || '8px',
      
      // Контент
      title: properties?.title || '',
      text: properties?.text || '',
      value: properties?.value || '',
      
      // Данные
      data: properties?.data || {},
      config: properties?.config || {},
      columns: properties?.columns || []
    };
  }

  /**
   * Генерация вариантов параметров для оптимизации
   */
  generateParamVariants(component, keyParams) {
    const variants = [];
    
    for (const param of keyParams) {
      const currentValue = component.baseParams[param];
      const variations = this.generateParamVariations(param, currentValue);
      
      for (const variation of variations) {
        variants.push({
          ...component,
          baseParams: {
            ...component.baseParams,
            [param]: variation
          }
        });
      }
    }
    
    return variants;
  }

  /**
   * Генерация вариаций для конкретного параметра
   */
  generateParamVariations(param, currentValue) {
    const variations = this.optimizationConfig.paramVariations[param];
    
    if (!variations) {
      return [currentValue];
    }
    
    switch (param) {
      case 'width':
      case 'height':
        return variations.map(factor => Math.round(currentValue * factor));
        
      case 'fontSize':
        const size = parseInt(currentValue) || 14;
        return variations.map(factor => `${Math.round(size * factor)}px`);
        
      case 'color':
      case 'backgroundColor':
        return this.generateColorVariations(currentValue);
        
      default:
        return [currentValue];
    }
  }

  /**
   * Генерация цветовых вариаций
   */
  generateColorVariations(baseColor) {
    // Простая генерация цветовых вариаций
    const variations = [baseColor];
    
    // Добавляем светлее и темнее варианты
    if (baseColor.startsWith('#')) {
      const hex = baseColor.slice(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      // Светлее
      const lighter = `#${Math.min(255, Math.round(r * 1.2)).toString(16).padStart(2, '0')}${Math.min(255, Math.round(g * 1.2)).toString(16).padStart(2, '0')}${Math.min(255, Math.round(b * 1.2)).toString(16).padStart(2, '0')}`;
      variations.push(lighter);
      
      // Темнее
      const darker = `#${Math.max(0, Math.round(r * 0.8)).toString(16).padStart(2, '0')}${Math.max(0, Math.round(g * 0.8)).toString(16).padStart(2, '0')}${Math.max(0, Math.round(b * 0.8)).toString(16).padStart(2, '0')}`;
      variations.push(darker);
    }
    
    return variations;
  }

  /**
   * Оценка качества компонента (упрощенная версия)
   */
  async evaluateComponentQuality(component, element, analysis) {
    // Упрощенная оценка качества на основе соответствия параметров
    let quality = 0.5; // Базовое качество
    
    const { properties, position } = element;
    const params = component.baseParams;
    
    // Проверяем соответствие размеров
    const widthMatch = Math.abs(params.width - (position?.width || 300)) / (position?.width || 300);
    const heightMatch = Math.abs(params.height - (position?.height || 200)) / (position?.height || 200);
    
    quality += (1 - widthMatch) * 0.2;
    quality += (1 - heightMatch) * 0.2;
    
    // Проверяем соответствие цветов (если есть)
    if (properties?.color && params.color) {
      quality += 0.1; // Бонус за наличие цвета
    }
    
    if (properties?.backgroundColor && params.backgroundColor) {
      quality += 0.1; // Бонус за наличие фона
    }
    
    // Проверяем соответствие текста
    if (properties?.text && params.text) {
      quality += 0.1; // Бонус за наличие текста
    }
    
    // Ограничиваем качество от 0 до 1
    return Math.max(0, Math.min(1, quality));
  }

  /**
   * Генерация кода React компонента
   */
  async generateComponentCode(component, element, analysis, options) {
    const { componentType, baseParams, name } = component;
    
    // Выбираем шаблон на основе типа компонента
    switch (componentType) {
      case 'ChartComponent':
        return this.generateChartCode(name, baseParams, element);
      case 'CardComponent':
        return this.generateCardCode(name, baseParams, element);
      case 'TableComponent':
        return this.generateTableCode(name, baseParams, element);
      case 'ButtonComponent':
        return this.generateButtonCode(name, baseParams, element);
      case 'HeaderComponent':
        return this.generateHeaderCode(name, baseParams, element);
      case 'NavigationComponent':
        return this.generateNavigationCode(name, baseParams, element);
      default:
        return this.generateGenericCode(name, baseParams, element);
    }
  }

  /**
   * Генерация кода Chart компонента
   */
  generateChartCode(componentName, params, element) {
    return `import React from 'react';

interface ${componentName}Props {
  data?: any[];
  title?: string;
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  data = ${JSON.stringify(params.data)}, 
  title = "${params.title}", 
  className = '' 
}) => {
  return (
    <div 
      className={\`chart-container \${className}\`}
      style={{
        width: '${params.width}px',
        height: '${params.height}px',
        backgroundColor: '${params.backgroundColor}',
        borderRadius: '${params.borderRadius}',
        padding: '${params.padding}',
        margin: '${params.margin}',
        border: '${params.border}',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {title && (
        <h3 style={{
          color: '${params.textColor}',
          fontSize: '${params.fontSize}',
          fontWeight: '${params.fontWeight}',
          marginBottom: '16px'
        }}>
          {title}
        </h3>
      )}
      <div style={{
        width: '100%',
        height: '200px',
        backgroundColor: '#f8f9fa',
        border: '1px dashed #ccc',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666'
      }}>
        <p>Chart Component (${element.type})</p>
      </div>
      {data && Object.keys(data).length > 0 && (
        <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
          Data: {JSON.stringify(data, null, 2)}
        </div>
      )}
    </div>
  );
};

export default ${componentName};`;
  }

  /**
   * Генерация кода Card компонента
   */
  generateCardCode(componentName, params, element) {
    return `import React from 'react';

interface ${componentName}Props {
  title?: string;
  value?: string | number;
  className?: string;
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  title = "${params.title}", 
  value = "${params.value}", 
  className = '',
  children 
}) => {
  return (
    <div 
      className={\`card \${className}\`}
      style={{
        width: '${params.width}px',
        height: '${params.height}px',
        backgroundColor: '${params.backgroundColor}',
        borderRadius: '${params.borderRadius}',
        padding: '${params.padding}',
        margin: '${params.margin}',
        border: '${params.border}',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
    >
      {title && (
        <h4 style={{
          color: '${params.textColor}',
          fontSize: '${params.fontSize}',
          fontWeight: '${params.fontWeight}',
          margin: '0 0 8px 0'
        }}>
          {title}
        </h4>
      )}
      {value && (
        <div style={{
          color: '${params.color}',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          {value}
        </div>
      )}
      {children}
    </div>
  );
};

export default ${componentName};`;
  }

  /**
   * Генерация кода Table компонента
   */
  generateTableCode(componentName, params, element) {
    return `import React from 'react';

interface ${componentName}Props {
  data?: any[];
  columns?: string[];
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  data = ${JSON.stringify(params.data)}, 
  columns = ${JSON.stringify(params.columns)}, 
  className = '' 
}) => {
  return (
    <div 
      className={\`table-container \${className}\`}
      style={{
        width: '${params.width}px',
        height: '${params.height}px',
        backgroundColor: '${params.backgroundColor}',
        borderRadius: '${params.borderRadius}',
        padding: '${params.padding}',
        margin: '${params.margin}',
        border: '${params.border}',
        overflow: 'auto'
      }}
    >
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '${params.fontSize}'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            {columns.map((column, index) => (
              <th 
                key={index}
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                  fontWeight: '${params.fontWeight}',
                  color: '${params.textColor}'
                }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex}
              style={{
                backgroundColor: rowIndex % 2 === 0 ? 'white' : '#f9f9f9'
              }}
            >
              {columns.map((column, colIndex) => (
                <td 
                  key={colIndex}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #eee',
                    color: '${params.textColor}'
                  }}
                >
                  {row[column] || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ${componentName};`;
  }

  /**
   * Генерация кода Button компонента
   */
  generateButtonCode(componentName, params, element) {
    return `import React from 'react';

interface ${componentName}Props {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  children = "${params.text || 'Button'}", 
  onClick,
  disabled = false,
  className = '' 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={\`button \${className}\`}
      style={{
        width: '${params.width}px',
        height: '${params.height}px',
        backgroundColor: '${params.backgroundColor}',
        color: '${params.textColor}',
        border: '${params.border}',
        borderRadius: '${params.borderRadius}',
        padding: '${params.padding}',
        margin: '${params.margin}',
        fontSize: '${params.fontSize}',
        fontWeight: '${params.fontWeight}',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '${params.color}';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '${params.backgroundColor}';
        }
      }}
    >
      {children}
    </button>
  );
};

export default ${componentName};`;
  }

  /**
   * Генерация кода Header компонента
   */
  generateHeaderCode(componentName, params, element) {
    return `import React from 'react';

interface ${componentName}Props {
  title?: string;
  className?: string;
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  title = "${params.title || params.text || 'Header'}", 
  className = '',
  children 
}) => {
  return (
    <header 
      className={\`header \${className}\`}
      style={{
        width: '${params.width}px',
        height: '${params.height}px',
        backgroundColor: '${params.backgroundColor}',
        color: '${params.textColor}',
        padding: '${params.padding}',
        margin: '${params.margin}',
        border: '${params.border}',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <h1 style={{
        fontSize: '${params.fontSize}',
        fontWeight: '${params.fontWeight}',
        margin: 0,
        color: '${params.color}'
      }}>
        {title}
      </h1>
      {children}
    </header>
  );
};

export default ${componentName};`;
  }

  /**
   * Генерация кода Navigation компонента
   */
  generateNavigationCode(componentName, params, element) {
    return `import React from 'react';

interface ${componentName}Props {
  items?: Array<{ label: string; href: string; active?: boolean }>;
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  items = [],
  className = '' 
}) => {
  return (
    <nav 
      className={\`navigation \${className}\`}
      style={{
        width: '${params.width}px',
        height: '${params.height}px',
        backgroundColor: '${params.backgroundColor}',
        padding: '${params.padding}',
        margin: '${params.margin}',
        border: '${params.border}',
        display: 'flex',
        alignItems: 'center',
        gap: '24px'
      }}
    >
      {items.map((item, index) => (
        <a
          key={index}
          href={item.href}
          style={{
            color: item.active ? '${params.color}' : '${params.textColor}',
            textDecoration: 'none',
            fontSize: '${params.fontSize}',
            fontWeight: item.active ? 'bold' : '${params.fontWeight}',
            padding: '8px 16px',
            borderRadius: '${params.borderRadius}',
            backgroundColor: item.active ? 'rgba(0,0,0,0.1)' : 'transparent',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = item.active ? 'rgba(0,0,0,0.1)' : 'transparent';
          }}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
};

export default ${componentName};`;
  }

  /**
   * Генерация кода Generic компонента
   */
  generateGenericCode(componentName, params, element) {
    return `import React from 'react';

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
      className={\`generic-component \${className}\`}
      style={{
        width: '${params.width}px',
        height: '${params.height}px',
        backgroundColor: '${params.backgroundColor}',
        border: '${params.border}',
        borderRadius: '${params.borderRadius}',
        padding: '${params.padding}',
        margin: '${params.margin}',
        color: '${params.textColor}',
        fontSize: '${params.fontSize}',
        fontWeight: '${params.fontWeight}',
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

export default ${componentName};`;
  }

  /**
   * Генерация fallback компонента
   */
  generateFallbackComponent(element) {
    const componentName = this.generateComponentName(element);
    const { properties, position } = element;
    
    return {
      id: element.id,
      type: element.type,
      name: componentName,
      content: this.generateGenericCode(componentName, {
        width: position?.width || 300,
        height: position?.height || 200,
        backgroundColor: properties?.backgroundColor || '#f5f5f5',
        border: '1px dashed #ccc',
        borderRadius: properties?.borderRadius || '4px',
        padding: properties?.padding || '16px',
        margin: properties?.margin || '8px',
        color: properties?.textColor || '#666',
        fontSize: properties?.fontSize || '14px',
        fontWeight: properties?.fontWeight || '400'
      }, element),
      element: element,
      quality: 0.1,
      iterations: 0,
      metadata: {
        componentType: 'FallbackComponent',
        baseParams: {},
        optimizationUsed: false
      }
    };
  }

  /**
   * Генерация имени компонента
   */
  generateComponentName(element) {
    const typeMap = {
      'chart': 'Chart',
      'card': 'Card',
      'table': 'Table',
      'button': 'Button',
      'header': 'Header',
      'navigation': 'Navigation',
      'sidebar': 'Sidebar',
      'form': 'Form',
      'input': 'Input',
      'text': 'Text',
      'image': 'Image',
      'container': 'Container'
    };

    const baseName = typeMap[element.type] || 'Component';
    const id = element.id.replace(/[^a-zA-Z0-9]/g, '');
    return `${baseName}${id.charAt(0).toUpperCase() + id.slice(1)}`;
  }

  /**
   * Генерация главного компонента
   */
  async generateMainComponent(analysis, components, options) {
    const componentName = `Main${analysis.imageId.replace(/[^a-zA-Z0-9]/g, '')}`;
    
    const imports = components.map(comp => 
      `import ${comp.name} from './${comp.name}';`
    ).join('\n');

    const componentUsages = components.map(comp => 
      `      <${comp.name} />`
    ).join('\n');

    return {
      id: 'main',
      type: 'main',
      name: componentName,
      content: `import React from 'react';
${imports}

interface ${componentName}Props {
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ className = '' }) => {
  return (
    <div 
      className={\`main-component \${className}\`}
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '${analysis.colors?.background || '#ffffff'}',
        color: '${analysis.colors?.text || '#000000'}',
        fontFamily: '${analysis.typography?.primaryFont || 'Roboto, sans-serif'}',
        fontSize: '${analysis.typography?.primarySize || '14px'}',
        lineHeight: '${analysis.typography?.lineHeight || '1.5'}',
        padding: '${analysis.layout?.padding || '24px'}',
        display: '${analysis.layout?.type === 'grid' ? 'grid' : 'flex'}',
        flexDirection: '${analysis.layout?.direction || 'column'}',
        gap: '${analysis.layout?.gap || '16px'}',
        justifyContent: '${analysis.layout?.justifyContent || 'flex-start'}',
        alignItems: '${analysis.layout?.alignItems || 'flex-start'}'
      }}
    >
${componentUsages}
    </div>
  );
};

export default ${componentName};`,
      element: null,
      quality: 1.0,
      iterations: 0,
      metadata: {
        componentType: 'MainComponent',
        baseParams: {},
        optimizationUsed: false
      }
    };
  }

  /**
   * Сохранение компонента в файл
   */
  async saveComponent(component, outputDir) {
    try {
      if (!component || !component.name || !component.content) {
        logger.error('Некорректный компонент для сохранения:', component);
        throw new Error('Некорректный компонент для сохранения');
      }

      const filePath = path.join(outputDir, `${component.name}.tsx`);
      
      // Форматирование кода
      let formattedContent;
      try {
        formattedContent = await this.formatCode(component.content, 'tsx');
      } catch (formatError) {
        logger.warn(`Ошибка форматирования кода для ${component.name}, используем исходный код:`, formatError.message);
        formattedContent = component.content;
      }
      
      await fs.writeFile(filePath, formattedContent, 'utf8');
      logger.info(`💾 Компонент сохранен: ${filePath}`);
      
      return filePath;
    } catch (error) {
      logger.error(`Ошибка сохранения компонента ${component.name}:`, error);
      throw error;
    }
  }

  /**
   * Создание index файла
   */
  async createIndexFile(components, outputDir) {
    const exports = components.map(comp => 
      `export { default as ${comp.name} } from './${comp.name}';`
    ).join('\n');

    const mainComponent = components.find(comp => comp.name.startsWith('Main'));
    const mainExport = mainComponent ? 
      `export { default as MainComponent } from './${mainComponent.name}';` : '';

    const content = `// Generated components with hybrid approach
${exports}
${mainExport}

// Re-export all components
export * from './${components[0]?.name || 'Component'}';
`;

    const filePath = path.join(outputDir, 'index.ts');
    await fs.writeFile(filePath, content, 'utf8');
    logger.info(`📄 Index файл создан: ${filePath}`);
  }

  /**
   * Форматирование кода
   */
  async formatCode(code, language) {
    try {
      const formatted = await prettier.format(code, {
        parser: language === 'tsx' ? 'typescript' : 'babel',
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
        tabWidth: 2,
        printWidth: 100
      });
      return formatted;
    } catch (error) {
      logger.warn('Ошибка форматирования кода:', error);
      return code;
    }
  }
}

export default ComponentWorkerV2;
