import OpenAI from 'openai';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { readFileSync } from 'fs';
const visionConfig = JSON.parse(readFileSync(new URL('../config/vision.json', import.meta.url), 'utf8'));

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
    
    try {
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
      return JSON.parse(content);

    } catch (error) {
      logger.error('Ошибка OpenAI Vision API:', error);
      throw error;
    }
  }

  /**
   * Построение промпта для анализа
   */
  buildAnalysisPrompt(options = {}) {
    return `Проанализируй это изображение UI интерфейса и определи все видимые элементы. 

Верни результат в формате JSON со следующей структурой:
{
  "elements": [
    {
      "id": "unique_id",
      "type": "button|input|text|image|card|table|container|form|navigation|sidebar",
      "bbox": [x1, y1, x2, y2],
      "confidence": 0.95,
      "properties": {
        "width": 120,
        "height": 40,
        "backgroundColor": "#1976d2",
        "textColor": "#ffffff",
        "borderRadius": 4,
        "fontSize": 14,
        "fontWeight": "500"
      },
      "extractedText": "Click me"
    }
  ],
  "layout": {
    "type": "flexbox|grid|absolute",
    "direction": "row|column",
    "gap": 16,
    "padding": 24
  },
  "colors": {
    "primary": "#1976d2",
    "secondary": "#dc004e",
    "background": "#ffffff",
    "text": "#000000"
  },
  "typography": {
    "primaryFont": "Roboto",
    "primarySize": 14,
    "headingSizes": [24, 20, 16]
  }
}

Важно:
- Определи точные координаты bounding box для каждого элемента
- Извлеки весь видимый текст
- Определи цвета (hex коды)
- Оцени уверенность в каждом определении (0-1)
- Сгруппируй связанные элементы в контейнеры
- Определи общую структуру макета`;
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
        totalElements: analysis.elements?.length || 0,
        confidence: this.calculateOverallConfidence(analysis.elements || []),
        processingTime: Date.now()
      }
    };

    // Валидация и очистка элементов
    result.elements = result.elements.map((element, index) => ({
      ...element,
      id: element.id || `element_${index}`,
      confidence: Math.max(0, Math.min(1, element.confidence || 0.5)),
      bbox: this.validateBbox(element.bbox || [0, 0, 100, 100])
    }));

    return result;
  }

  /**
   * Валидация bounding box
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
