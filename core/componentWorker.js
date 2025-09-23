import fs from 'fs/promises';
import path from 'path';
import prettier from 'prettier';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

/**
 * ComponentWorker - генерация React компонентов из структурированных данных
 */
class ComponentWorker {
  constructor() {
    this.outputDir = './output';
    this.templates = new Map();
    this.componentTypes = {
      'chart': this.generateChartComponent,
      'card': this.generateCardComponent,
      'table': this.generateTableComponent,
      'button': this.generateButtonComponent,
      'header': this.generateHeaderComponent,
      'navigation': this.generateNavigationComponent,
      'sidebar': this.generateSidebarComponent,
      'form': this.generateFormComponent,
      'input': this.generateInputComponent,
      'text': this.generateTextComponent,
      'image': this.generateImageComponent,
      'container': this.generateContainerComponent
    };
  }

  /**
   * Обработка структурированных данных и генерация компонентов
   */
  async processStructuredData(analysis, options = {}) {
    try {
      logger.info(`Начинаем обработку структурированных данных для ${analysis.imageId}`);

      const result = {
        imageId: analysis.imageId,
        timestamp: new Date(),
        components: [],
        metadata: {
          totalElements: analysis.elements?.length || 0,
          tokens: analysis.metadata?.tokens || {},
          temperature: analysis.metadata?.temperature || 0.7,
          model: analysis.metadata?.model || 'unknown'
        }
      };

      // Создаем папку для компонентов
      const componentDir = path.join(this.outputDir, analysis.imageId);
      await fs.mkdir(componentDir, { recursive: true });

      // Генерируем компоненты для каждого элемента
      for (const element of analysis.elements || []) {
        try {
          logger.debug(`Генерируем компонент для элемента: ${element.id} (тип: ${element.type})`);
          
          const component = await this.generateComponent(element, analysis, options);
          
          if (component) {
            logger.debug(`Компонент сгенерирован: ${component.name}`, {
              id: component.id,
              type: component.type,
              name: component.name,
              contentLength: component.content?.length || 0
            });
            
            result.components.push(component);
            
            // Сохраняем компонент в файл
            await this.saveComponent(component, componentDir);
          } else {
            logger.warn(`Генератор вернул null для элемента ${element.id}`);
          }
        } catch (error) {
          logger.error(`Ошибка генерации компонента для элемента ${element.id}:`, error);
          
          // Создаем fallback компонент при ошибке
          try {
            const fallbackComponent = this.generateFallbackComponent(element);
            result.components.push(fallbackComponent);
            await this.saveComponent(fallbackComponent, componentDir);
            logger.info(`Создан fallback компонент для ${element.id}`);
          } catch (fallbackError) {
            logger.error(`Ошибка создания fallback компонента для ${element.id}:`, fallbackError);
          }
        }
      }

      // Создаем главный компонент, объединяющий все элементы
      const mainComponent = await this.generateMainComponent(analysis, result.components, options);
      if (mainComponent) {
        result.components.push(mainComponent);
        await this.saveComponent(mainComponent, componentDir);
      }

      // Создаем index файл
      await this.createIndexFile(result.components, componentDir);

      logger.info(`Обработка завершена для ${analysis.imageId}. Создано компонентов: ${result.components.length}`);
      return result;

    } catch (error) {
      logger.error('Ошибка обработки структурированных данных:', error);
      throw error;
    }
  }

  /**
   * Генерация компонента для элемента
   */
  async generateComponent(element, analysis, options) {
    const generator = this.componentTypes[element.type];
    if (!generator) {
      logger.warn(`Неизвестный тип компонента: ${element.type}`);
      return this.generateFallbackComponent(element);
    }

    try {
      const component = await generator.call(this, element, analysis, options);
      
      // Валидация результата
      if (!component || typeof component !== 'string') {
        logger.warn(`Генератор ${element.type} вернул некорректный результат`);
        return this.generateFallbackComponent(element);
      }

      return {
        id: element.id,
        type: element.type,
        name: this.generateComponentName(element),
        content: component,
        element: element
      };
    } catch (error) {
      logger.error(`Ошибка генерации компонента ${element.type}:`, error);
      return this.generateFallbackComponent(element);
    }
  }

  /**
   * Генерация fallback компонента с данными от AI
   */
  generateFallbackComponent(element) {
    const componentName = this.generateComponentName(element);
    const { properties, position } = element;
    
    // Создаем fallback компонент на основе данных от AI
    let fallbackContent = '';
    
    switch (element.type) {
      case 'chart':
        fallbackContent = this.generateFallbackChart(componentName, element);
        break;
      case 'card':
        fallbackContent = this.generateFallbackCard(componentName, element);
        break;
      case 'table':
        fallbackContent = this.generateFallbackTable(componentName, element);
        break;
      case 'button':
        fallbackContent = this.generateFallbackButton(componentName, element);
        break;
      case 'header':
        fallbackContent = this.generateFallbackHeader(componentName, element);
        break;
      case 'navigation':
        fallbackContent = this.generateFallbackNavigation(componentName, element);
        break;
      case 'text':
        fallbackContent = this.generateFallbackText(componentName, element);
        break;
      default:
        fallbackContent = this.generateFallbackGeneric(componentName, element);
    }
    
    return {
      id: element.id,
      type: element.type,
      name: componentName,
      content: fallbackContent,
      element: element
    };
  }

  /**
   * Fallback Chart компонент
   */
  generateFallbackChart(componentName, element) {
    const { properties, position } = element;
    const data = properties.data || {};
    
    return `import React from 'react';

interface ${componentName}Props {
  className?: string;
  data?: any[];
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  className = '', 
  data = ${JSON.stringify(data)}
}) => {
  return (
    <div 
      className={\`chart-fallback \${className}\`}
      style={{
        width: '${position.width}px',
        height: '${position.height}px',
        backgroundColor: '${properties.backgroundColor || '#ffffff'}',
        border: '1px solid #e0e0e0',
        borderRadius: '${properties.borderRadius || '8px'}',
        padding: '${properties.padding || '16px'}',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <h3 style={{ 
        color: '${properties.textColor || '#333'}', 
        marginBottom: '16px',
        fontSize: '${properties.fontSize || '16px'}'
      }}>
        ${properties.title || 'Chart'}
      </h3>
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
   * Fallback Card компонент
   */
  generateFallbackCard(componentName, element) {
    const { properties, position } = element;
    
    return `import React from 'react';

interface ${componentName}Props {
  className?: string;
  title?: string;
  value?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  className = '', 
  title = '${properties.title || properties.text || 'Card'}',
  value = '${properties.value || ''}'
}) => {
  return (
    <div 
      className={\`card-fallback \${className}\`}
      style={{
        width: '${position.width}px',
        height: '${position.height}px',
        backgroundColor: '${properties.backgroundColor || '#ffffff'}',
        border: '1px solid #e0e0e0',
        borderRadius: '${properties.borderRadius || '8px'}',
        padding: '${properties.padding || '16px'}',
        margin: '${properties.margin || '8px'}',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
    >
      {title && (
        <h4 style={{
          color: '${properties.textColor || '#333'}',
          fontSize: '${properties.fontSize || '14px'}',
          fontWeight: '${properties.fontWeight || '500'}',
          margin: '0 0 8px 0'
        }}>
          {title}
        </h4>
      )}
      {value && (
        <div style={{
          color: '${properties.color || '#1976d2'}',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          {value}
        </div>
      )}
    </div>
  );
};

export default ${componentName};`;
  }

  /**
   * Fallback Table компонент
   */
  generateFallbackTable(componentName, element) {
    const { properties, position } = element;
    const columns = properties.columns || [];
    const data = properties.data || [];
    
    return `import React from 'react';

interface ${componentName}Props {
  className?: string;
  data?: any[];
  columns?: string[];
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  className = '', 
  data = ${JSON.stringify(data)},
  columns = ${JSON.stringify(columns)}
}) => {
  return (
    <div 
      className={\`table-fallback \${className}\`}
      style={{
        width: '${position.width}',
        height: '${position.height}',
        backgroundColor: '${properties.backgroundColor || '#ffffff'}',
        border: '1px solid #e0e0e0',
        borderRadius: '${properties.borderRadius || '8px'}',
        padding: '${properties.padding || '16px'}',
        overflow: 'auto'
      }}
    >
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '${properties.fontSize || '14px'}'
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
                  fontWeight: '${properties.fontWeight || '500'}',
                  color: '${properties.textColor || '#333'}'
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
                    color: '${properties.textColor || '#333'}'
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
   * Fallback Button компонент
   */
  generateFallbackButton(componentName, element) {
    const { properties, position } = element;
    
    return `import React from 'react';

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  className = '', 
  children = '${properties.text || 'Button'}',
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={\`button-fallback \${className}\`}
      style={{
        width: '${position.width}px',
        height: '${position.height}px',
        backgroundColor: '${properties.backgroundColor || '#1976d2'}',
        color: '${properties.textColor || '#ffffff'}',
        border: '${properties.border || 'none'}',
        borderRadius: '${properties.borderRadius || '4px'}',
        padding: '${properties.padding || '8px 16px'}',
        margin: '${properties.margin || '0'}',
        fontSize: '${properties.fontSize || '14px'}',
        fontWeight: '${properties.fontWeight || '500'}',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      {children}
    </button>
  );
};

export default ${componentName};`;
  }

  /**
   * Fallback Header компонент
   */
  generateFallbackHeader(componentName, element) {
    const { properties, position } = element;
    
    return `import React from 'react';

interface ${componentName}Props {
  className?: string;
  title?: string;
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  className = '', 
  title = '${properties.title || properties.text || 'Header'}',
  children 
}) => {
  return (
    <header 
      className={\`header-fallback \${className}\`}
      style={{
        width: '${position.width}',
        height: '${position.height}px',
        backgroundColor: '${properties.backgroundColor || '#ffffff'}',
        color: '${properties.textColor || '#333'}',
        padding: '${properties.padding || '16px'}',
        margin: '${properties.margin || '0'}',
        border: '${properties.border || 'none'}',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <h1 style={{
        fontSize: '${properties.fontSize || '20px'}',
        fontWeight: '${properties.fontWeight || '600'}',
        margin: 0,
        color: '${properties.color || '#1976d2'}'
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
   * Fallback Navigation компонент
   */
  generateFallbackNavigation(componentName, element) {
    const { properties, position } = element;
    const items = properties.items || [];
    
    return `import React from 'react';

interface ${componentName}Props {
  className?: string;
  items?: Array<{ label: string; href: string; active?: boolean }>;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  className = '', 
  items = ${JSON.stringify(items.map(item => ({ label: item, href: '#' })))}
}) => {
  return (
    <nav 
      className={\`navigation-fallback \${className}\`}
      style={{
        width: '${position.width}',
        height: '${position.height}px',
        backgroundColor: '${properties.backgroundColor || '#ffffff'}',
        padding: '${properties.padding || '16px'}',
        margin: '${properties.margin || '0'}',
        border: '${properties.border || 'none'}',
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
            color: item.active ? '${properties.color || '#1976d2'}' : '${properties.textColor || '#333'}',
            textDecoration: 'none',
            fontSize: '${properties.fontSize || '14px'}',
            fontWeight: item.active ? 'bold' : '${properties.fontWeight || '400'}',
            padding: '8px 16px',
            borderRadius: '${properties.borderRadius || '4px'}',
            backgroundColor: item.active ? 'rgba(0,0,0,0.1)' : 'transparent',
            transition: 'all 0.2s ease'
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
   * Fallback Text компонент
   */
  generateFallbackText(componentName, element) {
    const { properties, position } = element;
    
    return `import React from 'react';

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  className = '', 
  children = '${properties.text || properties.label || 'Text'}'
}) => {
  return (
    <div 
      className={\`text-fallback \${className}\`}
      style={{
        width: '${position.width}',
        height: '${position.height}',
        color: '${properties.textColor || '#333'}',
        fontSize: '${properties.fontSize || '14px'}',
        fontWeight: '${properties.fontWeight || '400'}',
        padding: '${properties.padding || '8px'}',
        margin: '${properties.margin || '0'}',
        backgroundColor: '${properties.backgroundColor || 'transparent'}',
        borderRadius: '${properties.borderRadius || '4px'}',
        border: '${properties.border || 'none'}'
      }}
    >
      {children}
    </div>
  );
};

export default ${componentName};`;
  }

  /**
   * Fallback Generic компонент
   */
  generateFallbackGeneric(componentName, element) {
    const { properties, position } = element;
    
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
      className={\`generic-fallback \${className}\`}
      style={{
        width: '${position.width}',
        height: '${position.height}',
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

export default ${componentName};`;
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
   * Генерация Chart компонента
   */
  async generateChartComponent(element, analysis, options) {
    const { properties, position } = element;
    const componentName = this.generateComponentName(element);

    return `import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ${componentName}Props {
  data?: any[];
  title?: string;
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  data = [], 
  title = "${properties.title || ''}", 
  className = '' 
}) => {
  const chartData = data.length > 0 ? data : ${JSON.stringify(properties.data || [])};

  return (
    <div 
      className={\`chart-container \${className}\`}
      style={{
        width: '${position.width}px',
        height: '${position.height}px',
        backgroundColor: '${properties.backgroundColor}',
        borderRadius: '${properties.borderRadius}',
        padding: '${properties.padding}',
        margin: '${properties.margin}',
        border: '${properties.border}'
      }}
    >
      {title && (
        <h3 style={{
          color: '${properties.textColor}',
          fontSize: '${properties.fontSize}',
          fontWeight: '${properties.fontWeight}',
          marginBottom: '16px'
        }}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="${properties.color}" 
            strokeWidth={2}
            fill="url(#colorGradient)"
          />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="${properties.color}" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="${properties.color}" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ${componentName};`;
  }

  /**
   * Генерация Card компонента
   */
  async generateCardComponent(element, analysis, options) {
    const { properties, position } = element;
    const componentName = this.generateComponentName(element);

    return `import React from 'react';

interface ${componentName}Props {
  title?: string;
  value?: string | number;
  className?: string;
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  title = "${properties.title || ''}", 
  value = "${properties.value || ''}", 
  className = '',
  children 
}) => {
  return (
    <div 
      className={\`card \${className}\`}
      style={{
        width: '${position.width}px',
        height: '${position.height}px',
        backgroundColor: '${properties.backgroundColor}',
        borderRadius: '${properties.borderRadius}',
        padding: '${properties.padding}',
        margin: '${properties.margin}',
        border: '${properties.border}',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      {title && (
        <h4 style={{
          color: '${properties.textColor}',
          fontSize: '${properties.fontSize}',
          fontWeight: '${properties.fontWeight}',
          margin: '0 0 8px 0'
        }}>
          {title}
        </h4>
      )}
      {value && (
        <div style={{
          color: '${properties.color}',
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
   * Генерация Table компонента
   */
  async generateTableComponent(element, analysis, options) {
    const { properties, position } = element;
    const componentName = this.generateComponentName(element);

    return `import React from 'react';

interface ${componentName}Props {
  data?: any[];
  columns?: string[];
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  data = [], 
  columns = ${JSON.stringify(properties.columns || [])}, 
  className = '' 
}) => {
  return (
    <div 
      className={\`table-container \${className}\`}
      style={{
        width: '${position.width}',
        height: '${position.height}',
        backgroundColor: '${properties.backgroundColor}',
        borderRadius: '${properties.borderRadius}',
        padding: '${properties.padding}',
        margin: '${properties.margin}',
        border: '${properties.border}',
        overflow: 'auto'
      }}
    >
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '${properties.fontSize}'
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
                  fontWeight: '${properties.fontWeight}',
                  color: '${properties.textColor}'
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
                    color: '${properties.textColor}'
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
   * Генерация Button компонента
   */
  async generateButtonComponent(element, analysis, options) {
    const { properties, position } = element;
    const componentName = this.generateComponentName(element);

    return `import React from 'react';

interface ${componentName}Props {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  children = "${properties.text || 'Button'}", 
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
        width: '${position.width}px',
        height: '${position.height}px',
        backgroundColor: '${properties.backgroundColor}',
        color: '${properties.textColor}',
        border: '${properties.border}',
        borderRadius: '${properties.borderRadius}',
        padding: '${properties.padding}',
        margin: '${properties.margin}',
        fontSize: '${properties.fontSize}',
        fontWeight: '${properties.fontWeight}',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '${properties.color}';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '${properties.backgroundColor}';
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
   * Генерация Header компонента
   */
  async generateHeaderComponent(element, analysis, options) {
    const { properties, position } = element;
    const componentName = this.generateComponentName(element);

    return `import React from 'react';

interface ${componentName}Props {
  title?: string;
  className?: string;
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  title = "${properties.title || properties.text || 'Header'}", 
  className = '',
  children 
}) => {
  return (
    <header 
      className={\`header \${className}\`}
      style={{
        width: '${position.width}',
        height: '${position.height}px',
        backgroundColor: '${properties.backgroundColor}',
        color: '${properties.textColor}',
        padding: '${properties.padding}',
        margin: '${properties.margin}',
        border: '${properties.border}',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <h1 style={{
        fontSize: '${properties.fontSize}',
        fontWeight: '${properties.fontWeight}',
        margin: 0,
        color: '${properties.color}'
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
   * Генерация Navigation компонента
   */
  async generateNavigationComponent(element, analysis, options) {
    const { properties, position } = element;
    const componentName = this.generateComponentName(element);

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
        width: '${position.width}',
        height: '${position.height}px',
        backgroundColor: '${properties.backgroundColor}',
        padding: '${properties.padding}',
        margin: '${properties.margin}',
        border: '${properties.border}',
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
            color: item.active ? '${properties.color}' : '${properties.textColor}',
            textDecoration: 'none',
            fontSize: '${properties.fontSize}',
            fontWeight: item.active ? 'bold' : '${properties.fontWeight}',
            padding: '8px 16px',
            borderRadius: '${properties.borderRadius}',
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
   * Генерация Sidebar компонента
   */
  async generateSidebarComponent(element, analysis, options) {
    const { properties, position } = element;
    const componentName = this.generateComponentName(element);

    return `import React from 'react';

interface ${componentName}Props {
  items?: Array<{ label: string; icon?: string; href?: string; active?: boolean }>;
  className?: string;
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  items = [],
  className = '',
  children 
}) => {
  return (
    <aside 
      className={\`sidebar \${className}\`}
      style={{
        width: '${position.width}px',
        height: '${position.height}',
        backgroundColor: '${properties.backgroundColor}',
        padding: '${properties.padding}',
        margin: '${properties.margin}',
        border: '${properties.border}',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      {items.map((item, index) => (
        <a
          key={index}
          href={item.href || '#'}
          style={{
            color: item.active ? '${properties.color}' : '${properties.textColor}',
            textDecoration: 'none',
            fontSize: '${properties.fontSize}',
            fontWeight: item.active ? 'bold' : '${properties.fontWeight}',
            padding: '12px 16px',
            borderRadius: '${properties.borderRadius}',
            backgroundColor: item.active ? 'rgba(0,0,0,0.1)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          {item.icon && <span>{item.icon}</span>}
          {item.label}
        </a>
      ))}
      {children}
    </aside>
  );
};

export default ${componentName};`;
  }

  /**
   * Генерация Form компонента
   */
  async generateFormComponent(element, analysis, options) {
    const { properties, position } = element;
    const componentName = this.generateComponentName(element);

    return `import React, { useState } from 'react';

interface ${componentName}Props {
  onSubmit?: (data: any) => void;
  className?: string;
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  onSubmit,
  className = '',
  children 
}) => {
  const [formData, setFormData] = useState({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={\`form \${className}\`}
      style={{
        width: '${position.width}',
        height: '${position.height}',
        backgroundColor: '${properties.backgroundColor}',
        padding: '${properties.padding}',
        margin: '${properties.margin}',
        border: '${properties.border}',
        borderRadius: '${properties.borderRadius}',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      {children}
    </form>
  );
};

export default ${componentName};`;
  }

  /**
   * Генерация Input компонента
   */
  async generateInputComponent(element, analysis, options) {
    const { properties, position } = element;
    const componentName = this.generateComponentName(element);

    return `import React from 'react';

interface ${componentName}Props {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  type = 'text',
  placeholder = '${properties.text || 'Enter text...'}',
  value = '',
  onChange,
  className = '' 
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={\`input \${className}\`}
      style={{
        width: '${position.width}px',
        height: '${position.height}px',
        backgroundColor: '${properties.backgroundColor}',
        color: '${properties.textColor}',
        border: '${properties.border}',
        borderRadius: '${properties.borderRadius}',
        padding: '${properties.padding}',
        margin: '${properties.margin}',
        fontSize: '${properties.fontSize}',
        fontWeight: '${properties.fontWeight}',
        outline: 'none',
        transition: 'border-color 0.2s ease'
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '${properties.color}';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = '#ddd';
      }}
    />
  );
};

export default ${componentName};`;
  }

  /**
   * Генерация Text компонента
   */
  async generateTextComponent(element, analysis, options) {
    const { properties, position } = element;
    const componentName = this.generateComponentName(element);

    return `import React from 'react';

interface ${componentName}Props {
  children?: React.ReactNode;
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  children = "${properties.text || 'Text'}", 
  className = '' 
}) => {
  return (
    <div 
      className={\`text \${className}\`}
      style={{
        width: '${position.width}',
        height: '${position.height}',
        color: '${properties.textColor}',
        fontSize: '${properties.fontSize}',
        fontWeight: '${properties.fontWeight}',
        padding: '${properties.padding}',
        margin: '${properties.margin}',
        backgroundColor: '${properties.backgroundColor}',
        borderRadius: '${properties.borderRadius}',
        border: '${properties.border}'
      }}
    >
      {children}
    </div>
  );
};

export default ${componentName};`;
  }

  /**
   * Генерация Image компонента
   */
  async generateImageComponent(element, analysis, options) {
    const { properties, position } = element;
    const componentName = this.generateComponentName(element);

    return `import React from 'react';

interface ${componentName}Props {
  src?: string;
  alt?: string;
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  src = '${properties.src || ''}',
  alt = '${properties.alt || properties.text || 'Image'}',
  className = '' 
}) => {
  return (
    <img
      src={src}
      alt={alt}
      className={\`image \${className}\`}
      style={{
        width: '${position.width}',
        height: '${position.height}',
        borderRadius: '${properties.borderRadius}',
        padding: '${properties.padding}',
        margin: '${properties.margin}',
        border: '${properties.border}',
        objectFit: 'cover'
      }}
    />
  );
};

export default ${componentName};`;
  }

  /**
   * Генерация Container компонента
   */
  async generateContainerComponent(element, analysis, options) {
    const { properties, position } = element;
    const componentName = this.generateComponentName(element);

    return `import React from 'react';

interface ${componentName}Props {
  children?: React.ReactNode;
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div 
      className={\`container \${className}\`}
      style={{
        width: '${position.width}',
        height: '${position.height}',
        backgroundColor: '${properties.backgroundColor}',
        borderRadius: '${properties.borderRadius}',
        padding: '${properties.padding}',
        margin: '${properties.margin}',
        border: '${properties.border}',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      {children}
    </div>
  );
};

export default ${componentName};`;
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

    return `import React from 'react';
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

export default ${componentName};`;
  }

  /**
   * Сохранение компонента в файл
   */
  async saveComponent(component, outputDir) {
    try {
      // Валидация компонента
      if (!component || !component.name || !component.content) {
        logger.error('Некорректный компонент для сохранения:', component);
        throw new Error('Некорректный компонент для сохранения');
      }

      const filePath = path.join(outputDir, `${component.name}.tsx`);
      
      // Форматирование кода с проверкой
      let formattedContent;
      try {
        formattedContent = await this.formatCode(component.content, 'tsx');
      } catch (formatError) {
        logger.warn(`Ошибка форматирования кода для ${component.name}, используем исходный код:`, formatError.message);
        formattedContent = component.content;
      }

      // Проверка результата форматирования
      if (!formattedContent || typeof formattedContent !== 'string') {
        logger.warn(`Форматирование вернуло некорректный результат для ${component.name}, используем исходный код`);
        formattedContent = component.content;
      }
      
      await fs.writeFile(filePath, formattedContent, 'utf8');
      logger.info(`Компонент сохранен: ${filePath}`);
      
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

    const content = `// Generated components
${exports}
${mainExport}

// Re-export all components
export * from './${components[0]?.name || 'Component'}';
`;

    const filePath = path.join(outputDir, 'index.ts');
    await fs.writeFile(filePath, content, 'utf8');
    logger.info(`Index файл создан: ${filePath}`);
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

export default ComponentWorker;
