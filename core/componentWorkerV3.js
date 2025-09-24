import fs from 'fs/promises';
import path from 'path';
import prettier from 'prettier';
import { v4 as uuidv4 } from 'uuid';
import { transform } from '@babel/core';
import logger from '../utils/logger.js';

/**
 * ComponentWorkerV3 - Улучшенный гибридный подход с строгой оценкой качества
 * Этап 1: Базовое сопоставление
 * Этап 2: Адаптивная итеративная оптимизация
 * Этап 3: Строгая оценка качества
 * Этап 4: Визуальная валидация (в разработке)
 */
class ComponentWorkerV3 {
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

    // Настройки строгой оптимизации
    this.optimizationConfig = {
      enabled: true,
      maxIterations: 12,
      qualityThreshold: 0.95,
      strictEvaluation: true,
      adaptiveIterations: true,
      paramVariations: {
        'width': [0.8, 0.9, 0.95, 1.05, 1.1, 1.2],
        'height': [0.8, 0.9, 0.95, 1.05, 1.1, 1.2],
        'color': ['lighter', 'darker', 'complementary', 'analogous'],
        'fontSize': [0.8, 0.9, 0.95, 1.05, 1.1, 1.2]
      }
    };
  }

  /**
   * Основной метод обработки структурированных данных
   */
  async processStructuredData(analysis, options = {}) {
    try {
      logger.info(`🚀 Начинаем улучшенную гибридную обработку для ${analysis.imageId}`);

      const result = {
        imageId: analysis.imageId,
        timestamp: new Date(),
        components: [],
        metadata: {
          totalElements: analysis.elements?.length || 0,
          tokens: analysis.metadata?.tokens || {},
          temperature: analysis.metadata?.temperature || 0.7,
          model: analysis.metadata?.model || 'unknown',
          optimizationEnabled: this.optimizationConfig.enabled,
          strictEvaluation: this.optimizationConfig.strictEvaluation
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
          
          // Этап 2: Адаптивная итеративная оптимизация
          let optimizedComponent = baseComponent;
          if (this.optimizationConfig.enabled) {
            optimizedComponent = await this.performAdaptiveOptimization(
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
            logger.info(`✅ Компонент создан: ${finalComponent.name} (качество: ${finalComponent.quality.toFixed(3)})`);
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

      logger.info(`🎉 Улучшенная гибридная обработка завершена для ${analysis.imageId}. Создано компонентов: ${result.components.length}`);
      return result;

    } catch (error) {
      logger.error('💥 Критическая ошибка улучшенной гибридной обработки:', error);
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
      quality: 0.3, // Более реалистичное базовое качество
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
   * Этап 2: Адаптивная итеративная оптимизация
   */
  async performAdaptiveOptimization(baseComponent, element, analysis, options) {
    logger.debug(`⚡ Начинаем адаптивную оптимизацию для ${element.id}`);
    
    const keyParams = this.selectKeyParams(element);
    const maxIterations = this.calculateMaxIterations(element);
    
    let currentComponent = { ...baseComponent };
    let bestQuality = currentComponent.quality;
    let bestComponent = currentComponent;
    let stagnationCount = 0;
    
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      logger.debug(`🔄 Итерация ${iteration + 1}/${maxIterations}`);
      
      // Адаптивная интенсивность вариаций
      const variationIntensity = this.calculateVariationIntensity(iteration, maxIterations, stagnationCount);
      
      // Генерируем варианты параметров
      const variants = this.generateAdaptiveVariants(currentComponent, keyParams, variationIntensity);
      
      // Оцениваем качество каждого варианта
      let improved = false;
      for (const variant of variants) {
        const quality = await this.evaluateComponentQualityStrict(variant, element, analysis);
        
        if (quality > bestQuality) {
          bestQuality = quality;
          bestComponent = { ...variant, quality, iterations: iteration + 1 };
          improved = true;
          logger.debug(`📈 Улучшение качества: ${quality.toFixed(3)} (итерация ${iteration + 1})`);
        }
        
        // Проверяем критерий остановки
        if (quality >= this.optimizationConfig.qualityThreshold) {
          logger.info(`🎯 Достигнуто целевое качество: ${quality.toFixed(3)}`);
          return { ...variant, quality, iterations: iteration + 1 };
        }
      }
      
      // Отслеживаем застой
      if (!improved) {
        stagnationCount++;
        if (stagnationCount >= 3) {
          logger.info(`🏁 Оптимизация остановлена из-за застоя (${stagnationCount} итераций без улучшений)`);
          break;
        }
      } else {
        stagnationCount = 0;
      }
      
      currentComponent = bestComponent;
    }
    
    logger.info(`🏁 Адаптивная оптимизация завершена. Лучшее качество: ${bestQuality.toFixed(3)}`);
    return bestComponent;
  }

  /**
   * Строгая оценка качества компонента
   */
  async evaluateComponentQualityStrict(component, element, analysis) {
    let quality = 0;
    const { properties, position } = element;
    const params = component.baseParams;
    
    // 1. Строгая проверка размеров (40% веса)
    const sizeScore = this.evaluateSizeMatch(params, position);
    quality += sizeScore * 0.4;
    
    // 2. Проверка цветового соответствия (25% веса)
    const colorScore = this.evaluateColorMatch(params, properties);
    quality += colorScore * 0.25;
    
    // 3. Проверка типографики (20% веса)
    const typographyScore = this.evaluateTypographyMatch(params, properties);
    quality += typographyScore * 0.2;
    
    // 4. Проверка контента (15% веса)
    const contentScore = this.evaluateContentMatch(params, properties);
    quality += contentScore * 0.15;
    
    return Math.max(0, Math.min(1, quality));
  }

  /**
   * Оценка соответствия размеров
   */
  evaluateSizeMatch(params, position) {
    if (!position) return 0;
    
    const widthError = Math.abs(params.width - position.width) / position.width;
    const heightError = Math.abs(params.height - position.height) / position.height;
    
    // Строгий штраф за отклонение: 0% = 1.0, 5% = 0.9, 10% = 0.8, 20% = 0.6, 50% = 0.0
    const widthScore = Math.max(0, 1 - widthError * 2);
    const heightScore = Math.max(0, 1 - heightError * 2);
    
    return (widthScore + heightScore) / 2;
  }

  /**
   * Оценка соответствия цветов
   */
  evaluateColorMatch(params, properties) {
    let score = 0;
    let checks = 0;
    
    // Проверяем основной цвет
    if (properties.color && params.color) {
      const colorMatch = this.calculateColorSimilarity(properties.color, params.color);
      score += colorMatch * 0.5;
      checks++;
    }
    
    // Проверяем фон
    if (properties.backgroundColor && params.backgroundColor) {
      const bgMatch = this.calculateColorSimilarity(properties.backgroundColor, params.backgroundColor);
      score += bgMatch * 0.3;
      checks++;
    }
    
    // Проверяем цвет текста
    if (properties.textColor && params.textColor) {
      const textMatch = this.calculateColorSimilarity(properties.textColor, params.textColor);
      score += textMatch * 0.2;
      checks++;
    }
    
    return checks > 0 ? score : 0.5; // Нейтральная оценка если нет цветов
  }

  /**
   * Расчет схожести цветов
   */
  calculateColorSimilarity(color1, color2) {
    if (color1 === color2) return 1.0;
    
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    if (hex1.length === 6 && hex2.length === 6) {
      const r1 = parseInt(hex1.substr(0, 2), 16);
      const g1 = parseInt(hex1.substr(2, 2), 16);
      const b1 = parseInt(hex1.substr(4, 2), 16);
      
      const r2 = parseInt(hex2.substr(0, 2), 16);
      const g2 = parseInt(hex2.substr(2, 2), 16);
      const b2 = parseInt(hex2.substr(4, 2), 16);
      
      const distance = Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
      const maxDistance = Math.sqrt(255**2 + 255**2 + 255**2);
      
      return Math.max(0, 1 - distance / maxDistance);
    }
    
    return 0.5; // Неизвестные форматы
  }

  /**
   * Оценка соответствия типографики
   */
  evaluateTypographyMatch(params, properties) {
    let score = 0;
    let checks = 0;
    
    // Проверяем размер шрифта
    if (properties.fontSize && params.fontSize) {
      const fontSize1 = parseInt(properties.fontSize) || 14;
      const fontSize2 = parseInt(params.fontSize) || 14;
      const fontSizeError = Math.abs(fontSize1 - fontSize2) / fontSize1;
      const fontSizeScore = Math.max(0, 1 - fontSizeError * 3); // Строгий штраф
      score += fontSizeScore * 0.4;
      checks++;
    }
    
    // Проверяем вес шрифта
    if (properties.fontWeight && params.fontWeight) {
      const weightMatch = properties.fontWeight === params.fontWeight ? 1.0 : 0.5;
      score += weightMatch * 0.3;
      checks++;
    }
    
    // Проверяем цвет текста
    if (properties.textColor && params.textColor) {
      const textColorMatch = this.calculateColorSimilarity(properties.textColor, params.textColor);
      score += textColorMatch * 0.3;
      checks++;
    }
    
    return checks > 0 ? score : 0.5;
  }

  /**
   * Оценка соответствия контента
   */
  evaluateContentMatch(params, properties) {
    let score = 0;
    let checks = 0;
    
    // Проверяем заголовок
    if (properties.title && params.title) {
      const titleMatch = properties.title === params.title ? 1.0 : 0.7;
      score += titleMatch * 0.4;
      checks++;
    }
    
    // Проверяем текст
    if (properties.text && params.text) {
      const textMatch = properties.text === params.text ? 1.0 : 0.7;
      score += textMatch * 0.3;
      checks++;
    }
    
    // Проверяем значение
    if (properties.value && params.value) {
      const valueMatch = properties.value === params.value ? 1.0 : 0.7;
      score += valueMatch * 0.3;
      checks++;
    }
    
    return checks > 0 ? score : 0.5;
  }

  /**
   * Анализ сложности элемента
   */
  analyzeComplexity(element) {
    let complexity = 0;
    
    // Количество свойств
    complexity += Object.keys(element.properties || {}).length * 0.1;
    
    // Размер элемента
    const area = (element.position?.width || 0) * (element.position?.height || 0);
    complexity += Math.log(area + 1) * 0.05;
    
    // Наличие данных
    if (element.properties?.data) complexity += 0.3;
    if (element.properties?.columns) complexity += 0.2;
    
    return Math.min(1, complexity);
  }

  /**
   * Выбор ключевых параметров для оптимизации
   */
  selectKeyParams(element) {
    const allParams = this.optimizationParams[element.type] || ['width', 'height'];
    const complexity = this.analyzeComplexity(element);
    
    // Для простых элементов - меньше параметров
    if (complexity < 0.3) {
      return allParams.slice(0, 2);
    }
    
    // Для сложных элементов - больше параметров
    if (complexity > 0.7) {
      return allParams;
    }
    
    // Для средних элементов - половина параметров
    return allParams.slice(0, Math.ceil(allParams.length / 2));
  }

  /**
   * Расчет максимального количества итераций
   */
  calculateMaxIterations(element) {
    const complexity = this.analyzeComplexity(element);
    
    // Простые элементы: 3-5 итераций
    if (complexity < 0.3) return 5;
    
    // Средние элементы: 5-8 итераций  
    if (complexity < 0.7) return 8;
    
    // Сложные элементы: 8-12 итераций
    return 12;
  }

  /**
   * Расчет интенсивности вариаций
   */
  calculateVariationIntensity(iteration, maxIterations, stagnationCount) {
    const progress = iteration / maxIterations;
    const baseIntensity = 0.05 + progress * 0.15; // От 5% до 20%
    
    // Увеличиваем интенсивность при застое
    const stagnationBoost = stagnationCount * 0.05;
    
    return Math.min(0.3, baseIntensity + stagnationBoost);
  }

  /**
   * Генерация адаптивных вариантов параметров
   */
  generateAdaptiveVariants(component, keyParams, variationIntensity) {
    const variants = [];
    
    for (const param of keyParams) {
      const currentValue = component.baseParams[param];
      const variations = this.generateParamVariations(param, currentValue, variationIntensity);
      
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
   * Генерация вариаций для конкретного параметра с учетом интенсивности
   */
  generateParamVariations(param, currentValue, intensity) {
    const baseVariations = this.optimizationConfig.paramVariations[param];
    
    if (!baseVariations) {
      return [currentValue];
    }
    
    // Адаптируем вариации под интенсивность
    const adaptedVariations = baseVariations.map(factor => {
      const adjustedFactor = 1 + (factor - 1) * intensity;
      return adjustedFactor;
    });
    
    switch (param) {
      case 'width':
      case 'height':
        return adaptedVariations.map(factor => Math.round(currentValue * factor));
        
      case 'fontSize':
        const size = parseInt(currentValue) || 14;
        return adaptedVariations.map(factor => `${Math.round(size * factor)}px`);
        
      case 'color':
      case 'backgroundColor':
        return this.generateColorVariations(currentValue, intensity);
        
      default:
        return [currentValue];
    }
  }

  /**
   * Генерация цветовых вариаций с учетом интенсивности
   */
  generateColorVariations(baseColor, intensity) {
    const variations = [baseColor];
    
    if (baseColor.startsWith('#')) {
      const hex = baseColor.slice(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      // Адаптируем интенсивность изменений
      const lightFactor = 1 + intensity * 0.3;
      const darkFactor = 1 - intensity * 0.3;
      
      // Светлее
      const lighter = `#${Math.min(255, Math.round(r * lightFactor)).toString(16).padStart(2, '0')}${Math.min(255, Math.round(g * lightFactor)).toString(16).padStart(2, '0')}${Math.min(255, Math.round(b * lightFactor)).toString(16).padStart(2, '0')}`;
      variations.push(lighter);
      
      // Темнее
      const darker = `#${Math.max(0, Math.round(r * darkFactor)).toString(16).padStart(2, '0')}${Math.max(0, Math.round(g * darkFactor)).toString(16).padStart(2, '0')}${Math.max(0, Math.round(b * darkFactor)).toString(16).padStart(2, '0')}`;
      variations.push(darker);
    }
    
    return variations;
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
        optimizationUsed: this.optimizationConfig.enabled,
        strictEvaluation: this.optimizationConfig.strictEvaluation
      }
    };
  }

  /**
   * Генерация кода React компонента (используем существующие методы)
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
      case 'SidebarComponent':
        return this.generateSidebarCode(name, baseParams, element);
      case 'FormComponent':
        return this.generateFormCode(name, baseParams, element);
      case 'InputComponent':
        return this.generateInputCode(name, baseParams, element);
      case 'TextComponent':
        return this.generateTextCode(name, baseParams, element);
      case 'ImageComponent':
        return this.generateImageCode(name, baseParams, element);
      case 'ContainerComponent':
        return this.generateContainerCode(name, baseParams, element);
      default:
        return this.generateGenericCode(name, baseParams, element);
    }
  }

  // Методы генерации кода компонентов (копируем из ComponentWorkerV2)
  generateChartCode(componentName, params, element) {
    return `import React, { useEffect, useRef } from 'react';

interface ${componentName}Props {
  data?: any;
  title?: string;
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  data = ${JSON.stringify(params.data)}, 
  title = "${params.title}", 
  className = '' 
}) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !window.Chart) return;

    // Уничтожаем предыдущий график
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Подготавливаем данные для Chart.js
    const chartData = {
      labels: data.labels || ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
      datasets: [{
        label: title || 'Данные',
        data: data.values || [60, 65, 70, 75, 80, 85],
        backgroundColor: [
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 99, 132, 0.2)',
          'rgba(255, 205, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 2
      }]
    };

    const config = {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: !!title,
            text: title
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };

    // Создаем новый график
    chartRef.current = new window.Chart(canvasRef.current, config);

    // Очистка при размонтировании
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, title]);

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
          marginBottom: '16px',
          margin: '0 0 16px 0'
        }}>
          {title}
        </h3>
      )}
      <div style={{
        width: '100%',
        height: '200px',
        position: 'relative'
      }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};

export default ${componentName};`;
  }

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

  // Дополнительные методы генерации компонентов
  generateSidebarCode(componentName, params, element) {
    return `import React from 'react';

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  className = '', 
  children,
  isOpen = true,
  onToggle
}) => {
  return (
    <aside 
      className={\`sidebar \${className}\`}
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
        position: 'relative',
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease'
      }}
    >
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>Sidebar</h3>
        {onToggle && (
          <button 
            onClick={onToggle}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            {isOpen ? '×' : '☰'}
          </button>
        )}
      </div>
      <div style={{ flex: 1, padding: '16px' }}>
        {children || (
          <nav>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '8px' }}>
                <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>Menu Item 1</a>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>Menu Item 2</a>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>Menu Item 3</a>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </aside>
  );
};

export default ${componentName};`;
  }

  generateFormCode(componentName, params, element) {
    return `import React, { useState } from 'react';

interface ${componentName}Props {
  className?: string;
  onSubmit?: (data: any) => void;
  children?: React.ReactNode;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  className = '', 
  onSubmit,
  children
}) => {
  const [formData, setFormData] = useState({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form 
      className={\`form \${className}\`}
      onSubmit={handleSubmit}
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
        gap: '16px'
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', textAlign: 'center' }}>Form</h3>
      
      {children || (
        <>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Name:
            </label>
            <input
              type="text"
              name="name"
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Email:
            </label>
            <input
              type="email"
              name="email"
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            Submit
          </button>
        </>
      )}
    </form>
  );
};

export default ${componentName};`;
  }

  generateInputCode(componentName, params, element) {
    return `import React, { useState } from 'react';

interface ${componentName}Props {
  className?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  className = '', 
  placeholder = 'Enter text...',
  type = 'text',
  value = '',
  onChange,
  label
}) => {
  const [inputValue, setInputValue] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div 
      className={\`input-container \${className}\`}
      style={{
        width: '${params.width}px',
        height: '${params.height}px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      {label && (
        <label style={{
          fontSize: '${params.fontSize}',
          fontWeight: '${params.fontWeight}',
          color: '${params.textColor}',
          marginBottom: '4px'
        }}>
          {label}
        </label>
      )}
      
      <input
        type={type}
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: '40px',
          padding: '8px 12px',
          border: '${params.border}',
          borderRadius: '${params.borderRadius}',
          fontSize: '${params.fontSize}',
          backgroundColor: '${params.backgroundColor}',
          color: '${params.textColor}',
          outline: 'none',
          transition: 'border-color 0.2s ease'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#007bff';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#ddd';
        }}
      />
    </div>
  );
};

export default ${componentName};`;
  }

  generateTextCode(componentName, params, element) {
    return `import React from 'react';

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
  text?: string;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  align?: 'left' | 'center' | 'right' | 'justify';
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  className = '', 
  children,
  text = 'Sample text content',
  variant = 'p',
  align = 'left'
}) => {
  const Tag = variant as keyof JSX.IntrinsicElements;
  
  return (
    <Tag 
      className={\`text-component \${className}\`}
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
        textAlign: align,
        lineHeight: '1.5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
      }}
    >
      {children || text}
    </Tag>
  );
};

export default ${componentName};`;
  }

  generateImageCode(componentName, params, element) {
    return `import React, { useState } from 'react';

interface ${componentName}Props {
  className?: string;
  src?: string;
  alt?: string;
  fallbackSrc?: string;
  onClick?: () => void;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  className = '', 
  src = 'https://via.placeholder.com/300x200?text=Image+Placeholder',
  alt = 'Image',
  fallbackSrc = 'https://via.placeholder.com/300x200?text=Error+Loading',
  onClick
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    setImageSrc(fallbackSrc);
  };

  return (
    <div 
      className={\`image-container \${className}\`}
      style={{
        width: '${params.width}px',
        height: '${params.height}px',
        backgroundColor: '${params.backgroundColor}',
        border: '${params.border}',
        borderRadius: '${params.borderRadius}',
        padding: '${params.padding}',
        margin: '${params.margin}',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '${params.textColor}',
          fontSize: '${params.fontSize}'
        }}>
          Loading...
        </div>
      )}
      
      <img
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '${params.borderRadius}',
          display: isLoading ? 'none' : 'block'
        }}
      />
      
      {hasError && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '${params.textColor}',
          fontSize: '${params.fontSize}',
          textAlign: 'center'
        }}>
          <div>⚠️</div>
          <div>Image failed to load</div>
        </div>
      )}
    </div>
  );
};

export default ${componentName};`;
  }

  generateContainerCode(componentName, params, element) {
    return `import React from 'react';

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
  direction?: 'row' | 'column';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  className = '', 
  children,
  direction = 'column',
  justify = 'flex-start',
  align = 'flex-start',
  wrap = 'nowrap'
}) => {
  return (
    <div 
      className={\`container \${className}\`}
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
        flexDirection: direction,
        justifyContent: justify,
        alignItems: align,
        flexWrap: wrap,
        boxSizing: 'border-box'
      }}
    >
      {children || (
        <div style={{
          textAlign: 'center',
          color: '#666',
          fontSize: '14px'
        }}>
          <p style={{ margin: '0 0 8px 0' }}>Container Component</p>
          <p style={{ margin: 0, fontSize: '12px' }}>Add your content here</p>
        </div>
      )}
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
        optimizationUsed: false,
        strictEvaluation: false
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
        optimizationUsed: false,
        strictEvaluation: false
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

      // Форматирование TypeScript кода
      let formattedContent;
      try {
        formattedContent = await this.formatCode(component.content, 'tsx');
      } catch (formatError) {
        logger.warn(`Ошибка форматирования кода для ${component.name}, используем исходный код:`, formatError.message);
        formattedContent = component.content;
      }
      
      // Сохраняем TypeScript версию
      const tsxPath = path.join(outputDir, `${component.name}.tsx`);
      await fs.writeFile(tsxPath, formattedContent, 'utf8');
      logger.info(`💾 TypeScript компонент сохранен: ${tsxPath}`);
      
      // Трансформируем в JavaScript
      try {
        const jsCode = await this.transformToJavaScript(formattedContent, component.name);
        
        // Сохраняем JavaScript версию
        const jsPath = path.join(outputDir, `${component.name}.js`);
        await fs.writeFile(jsPath, jsCode, 'utf8');
        logger.info(`💾 JavaScript компонент сохранен: ${jsPath}`);
        
        return { tsxPath, jsPath };
      } catch (transformError) {
        logger.warn(`Ошибка трансформации в JavaScript для ${component.name}:`, transformError.message);
        // Возвращаем только TypeScript путь, если трансформация не удалась
        return { tsxPath };
      }
      
    } catch (error) {
      logger.error(`Ошибка сохранения компонента ${component.name}:`, error);
      throw error;
    }
  }

  /**
   * Трансформация TypeScript/JSX кода в JavaScript
   */
  async transformToJavaScript(tsxCode, componentName) {
    try {
      const result = transform(tsxCode, {
        presets: [
          ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
          ['@babel/preset-react', { runtime: 'classic' }]
        ],
        filename: `${componentName}.tsx`
      });

      if (!result || !result.code) {
        throw new Error('Ошибка трансформации Babel');
      }

      // Очищаем код от import/export и TypeScript интерфейсов
      const cleanCode = result.code
        .replace(/import\s+.*?from\s+['"][^'"]+['"];?\s*/g, '') // Удаляем все import statements
        .replace(/import\s+['"][^'"]+['"];?\s*/g, '') // Удаляем import без from
        .replace(/export\s+.*?from\s+['"][^'"]+['"];?\s*/g, '') // Удаляем export statements
        .replace(/export\s+default\s+[^;]+;\s*/g, '') // Удаляем export default
        .replace(/interface\s+\w+\s*\{[^}]*\}\s*/g, '') // Удаляем TypeScript интерфейсы
        .replace(/type\s+\w+\s*=\s*[^;]+;\s*/g, '') // Удаляем TypeScript типы
        .replace(/:\s*React\.FC<[^>]+>/g, '') // Удаляем типизацию React.FC<Props>
        .replace(/:\s*\w+Props/g, '') // Удаляем ссылки на Props интерфейсы
        .replace(/className={\`([^`]+)\${([^}]+)}\`}/g, 'className={"$1" + $2}')
        .replace(/className={\`([^`]+)\`}/g, 'className={"$1"}')
        .replace(/\/\/ React уже загружен\s*/g, '') // Удаляем комментарий
        .trim(); // Убираем лишние пробелы

      logger.info(`🔄 Компонент ${componentName} трансформирован в JavaScript`);
      return cleanCode;
    } catch (error) {
      logger.error(`Ошибка трансформации компонента ${componentName}:`, error);
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

    const content = `// Generated components with improved hybrid approach (V3)
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

export default ComponentWorkerV3;
