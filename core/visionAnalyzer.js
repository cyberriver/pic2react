import OpenAI from 'openai';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { readFileSync } from 'fs';
const visionConfig = JSON.parse(readFileSync(new URL('../config/vision.json', import.meta.url), 'utf8'));
const promptsConfig = JSON.parse(readFileSync(new URL('../config/prompts.json', import.meta.url), 'utf8'));

/**
 * VisionAnalyzer - анализ изображений через OpenAI Vision API
 */
class VisionAnalyzer {
  constructor() {
    // Поддержка OpenRouter API
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || visionConfig.models.openai.apiKey;
    const baseURL = process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : undefined;
    
    this.openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL
    });
    
    this.model = process.env.OPENROUTER_API_KEY ? 'anthropic/claude-3.5-sonnet' : visionConfig.models.openai.model;
    this.maxTokens = visionConfig.models.openai.maxTokens;
    this.temperature = visionConfig.models.openai.temperature;
  }

  /**
   * Анализ изображения для детекции UI элементов
   */
  async analyzeImage(imagePath, options = {}) {
    try {
      logger.info(`Начинаем анализ изображения: ${path.basename(imagePath)}`);

      // Предобработка изображения
      const processedImage = await this.preprocessImage(imagePath);
      
      // Анализ через OpenAI Vision API
      const analysis = await this.performVisionAnalysis(processedImage, options);
      
      // Постобработка результатов
      const result = this.postprocessAnalysis(analysis, imagePath);

      logger.info(`Анализ завершен для: ${path.basename(imagePath)}`);
      return result;

    } catch (error) {
      logger.error('Ошибка анализа изображения:', error);
      throw new Error(`Vision analysis failed: ${error.message}`);
    }
  }

  /**
   * Предобработка изображения
   */
  async preprocessImage(imagePath) {
    const config = visionConfig.preprocessing;
    
    try {
      let pipeline = sharp(imagePath);

      // Изменение размера если необходимо
      if (config.resize) {
        pipeline = pipeline.resize(config.maxWidth, config.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Улучшение контраста
      if (config.contrastEnhancement) {
        pipeline = pipeline.modulate({
          brightness: 1.1,
          contrast: 1.1,
          saturation: 1.0
        });
      }

      // Шумоподавление
      if (config.denoise) {
        pipeline = pipeline.median(3);
      }

      const processedBuffer = await pipeline
        .png({ quality: 90 })
        .toBuffer();

      return processedBuffer;

    } catch (error) {
      logger.error('Ошибка предобработки изображения:', error);
      throw error;
    }
  }

  /**
   * Выполнение анализа через OpenAI Vision API
   */
  async performVisionAnalysis(imageBuffer, options) {
    const prompt = this.buildAnalysisPrompt(options);
    const maxRetries = promptsConfig.errorHandling.maxRetries;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Попытка анализа ${attempt}/${maxRetries}`);
        
        const response = await this.openai.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/png;base64,${imageBuffer.toString('base64')}`
                  }
                }
              ]
            }
          ],
          max_tokens: this.maxTokens,
          temperature: this.temperature
        });

        const content = response.choices[0].message.content;
        logger.debug('Получен ответ от Vision API:', content.substring(0, 500) + '...');
        
        // Пытаемся распарсить JSON
        let analysis;
        try {
          analysis = JSON.parse(content);
        } catch (parseError) {
          logger.warn(`Ошибка парсинга JSON (попытка ${attempt}):`, parseError.message);
          
          if (attempt === maxRetries) {
            // Последняя попытка - используем fallback
            logger.warn('Используем fallback промпт');
            return await this.performFallbackAnalysis(imageBuffer, options);
          }
          
          // Пробуем исправить JSON
          const cleanedContent = this.cleanJsonResponse(content);
          try {
            analysis = JSON.parse(cleanedContent);
          } catch (retryParseError) {
            logger.warn(`Не удалось исправить JSON (попытка ${attempt}):`, retryParseError.message);
            lastError = retryParseError;
            await this.delay(promptsConfig.errorHandling.retryDelay);
            continue;
          }
        }
        
        // Валидация структуры
        if (!this.validateAnalysisStructure(analysis)) {
          logger.warn(`Некорректная структура анализа (попытка ${attempt})`);
          if (attempt === maxRetries) {
            return await this.performFallbackAnalysis(imageBuffer, options);
          }
          lastError = new Error('Некорректная структура анализа');
          await this.delay(promptsConfig.errorHandling.retryDelay);
          continue;
        }
        
        // Добавляем информацию о токенах и температуре
        analysis.metadata = {
          ...analysis.metadata,
          tokens: {
            prompt: response.usage?.prompt_tokens || 0,
            completion: response.usage?.completion_tokens || 0,
            total: response.usage?.total_tokens || 0
          },
          temperature: this.temperature,
          model: this.model,
          processingTime: Date.now(),
          attempts: attempt
        };

        logger.info(`Анализ успешно завершен с попытки ${attempt}`);
        return analysis;

      } catch (error) {
        logger.error(`Ошибка OpenAI Vision API (попытка ${attempt}):`, error);
        lastError = error;
        
        if (attempt < maxRetries) {
          await this.delay(promptsConfig.errorHandling.retryDelay);
        }
      }
    }
    
    // Если все попытки неудачны
    logger.error('Все попытки анализа неудачны, используем fallback');
    return await this.performFallbackAnalysis(imageBuffer, options);
  }

  /**
   * Построение промпта для анализа
   */
  buildAnalysisPrompt(options = {}) {
    return promptsConfig.visionAnalysis.userPrompt;
  }

  /**
   * Постобработка результатов анализа
   */
  postprocessAnalysis(analysis, imagePath) {
    const result = {
      imageId: uuidv4(),
      imagePath: imagePath,
      timestamp: new Date(),
      elements: analysis.elements || [],
      layout: analysis.layout || {},
      colors: analysis.colors || {},
      typography: analysis.typography || {},
      metadata: {
        ...analysis.metadata,
        totalElements: analysis.elements?.length || 0,
        confidence: this.calculateOverallConfidence(analysis.elements || []),
        processingTime: Date.now()
      }
    };

    // Валидация и очистка элементов
    result.elements = result.elements.map((element, index) => ({
      ...element,
      id: element.id || `element_${index}`,
      type: element.type || 'container',
      properties: this.validateProperties(element.properties || {}),
      position: this.validatePosition(element.position || { x: 0, y: 0, width: 100, height: 50 }),
      children: element.children || []
    }));

    return result;
  }

  /**
   * Валидация свойств элемента
   */
  validateProperties(properties) {
    const defaultProps = {
      title: '',
      text: '',
      value: '',
      color: '#1976d2',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      fontSize: '14px',
      fontWeight: '400',
      borderRadius: '4px',
      border: 'none',
      padding: '8px',
      margin: '0px',
      width: '100%',
      height: 'auto',
      data: {},
      config: {}
    };

    return { ...defaultProps, ...properties };
  }

  /**
   * Валидация позиции элемента
   */
  validatePosition(position) {
    const defaultPosition = {
      x: 0,
      y: 0,
      width: 100,
      height: 50
    };

    return {
      ...defaultPosition,
      ...position,
      x: Math.max(0, Number(position.x) || 0),
      y: Math.max(0, Number(position.y) || 0),
      width: Math.max(1, Number(position.width) || 100),
      height: Math.max(1, Number(position.height) || 50)
    };
  }

  /**
   * Валидация bounding box (для обратной совместимости)
   */
  validateBbox(bbox) {
    if (!Array.isArray(bbox) || bbox.length !== 4) {
      return [0, 0, 100, 100];
    }
    
    const [x1, y1, x2, y2] = bbox;
    return [
      Math.max(0, Math.min(x1, x2)),
      Math.max(0, Math.min(y1, y2)),
      Math.max(x1, x2),
      Math.max(y1, y2)
    ];
  }

  /**
   * Расчет общей уверенности
   */
  calculateOverallConfidence(elements) {
    if (elements.length === 0) return 0;
    
    const totalConfidence = elements.reduce((sum, el) => sum + (el.confidence || 0), 0);
    return totalConfidence / elements.length;
  }

  /**
   * Batch анализ нескольких изображений
   */
  async analyzeBatch(imagePaths, options = {}) {
    const results = [];
    const batchSize = visionConfig.analysis.batchSize;

    for (let i = 0; i < imagePaths.length; i += batchSize) {
      const batch = imagePaths.slice(i, i + batchSize);
      const batchPromises = batch.map(path => this.analyzeImage(path, options));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        logger.error(`Ошибка batch анализа (${i}-${i + batchSize}):`, error);
        // Продолжаем с остальными файлами
      }
    }

    return results;
  }

  /**
   * Fallback анализ при ошибках
   */
  async performFallbackAnalysis(imageBuffer, options) {
    logger.warn('Выполняем fallback анализ');
    
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: promptsConfig.visionAnalysis.fallbackPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${imageBuffer.toString('base64')}`
                }
              }
            ]
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature
      });

      const content = response.choices[0].message.content;
      const analysis = JSON.parse(content);
      
      analysis.metadata = {
        ...analysis.metadata,
        tokens: {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0
        },
        temperature: this.temperature,
        model: this.model,
        processingTime: Date.now(),
        fallback: true
      };

      return analysis;
    } catch (error) {
      logger.error('Ошибка fallback анализа:', error);
      throw error;
    }
  }

  /**
   * Очистка JSON ответа
   */
  cleanJsonResponse(content) {
    // Удаляем markdown блоки
    let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Удаляем лишние символы в начале и конце
    cleaned = cleaned.trim();
    
    // Ищем JSON объект в тексте
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    return cleaned;
  }

  /**
   * Валидация структуры анализа
   */
  validateAnalysisStructure(analysis) {
    if (!analysis || typeof analysis !== 'object') {
      return false;
    }
    
    if (!Array.isArray(analysis.elements)) {
      return false;
    }
    
    // Проверяем хотя бы один элемент
    if (analysis.elements.length === 0) {
      return false;
    }
    
    // Проверяем структуру первого элемента
    const firstElement = analysis.elements[0];
    if (!firstElement.id || !firstElement.type) {
      return false;
    }
    
    return true;
  }

  /**
   * Задержка между попытками
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Проверка доступности API
   */
  async checkApiHealth() {
    try {
      await this.openai.models.list();
      const apiName = process.env.OPENROUTER_API_KEY ? 'OpenRouter API' : 'OpenAI API';
      return { status: 'healthy', message: `${apiName} доступен` };
    } catch (error) {
      const apiName = process.env.OPENROUTER_API_KEY ? 'OpenRouter API' : 'OpenAI API';
      return { status: 'unhealthy', message: `${apiName} недоступен: ${error.message}` };
    }
  }
}

export default VisionAnalyzer;
