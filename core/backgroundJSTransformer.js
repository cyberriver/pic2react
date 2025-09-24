import fs from 'fs/promises';
import path from 'path';
import { transform } from '@babel/core';
import logger from '../utils/logger.js';

/**
 * BackgroundJSTransformer - Фоновый воркер для преобразования .tsx файлов в .js
 * Работает асинхронно в фоне, не блокируя основной процесс
 */
class BackgroundJSTransformer {
  constructor() {
    this.outputDir = './output';
    this.isProcessing = false;
    this.queue = [];
    this.hasStarted = false; // Флаг для предотвращения повторного запуска
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

      return cleanCode;
    } catch (error) {
      logger.error(`Ошибка трансформации компонента ${componentName}:`, error);
      throw error;
    }
  }

  /**
   * Преобразование одного .tsx файла в .js
   */
  async transformFile(tsxPath, jsPath) {
    try {
      // Проверяем, существует ли уже .js файл
      try {
        await fs.access(jsPath);
        logger.debug(`JavaScript файл уже существует: ${jsPath}`);
        return { success: true, skipped: true, path: jsPath };
      } catch {
        // Файл не существует, продолжаем
      }

      // Читаем TypeScript файл
      const tsxCode = await fs.readFile(tsxPath, 'utf8');
      
      // Трансформируем в JavaScript
      const jsCode = await this.transformToJavaScript(tsxCode, path.basename(tsxPath, '.tsx'));
      
      // Сохраняем JavaScript файл
      await fs.writeFile(jsPath, jsCode, 'utf8');
      
      logger.info(`✅ JavaScript файл создан: ${jsPath}`);
      return { success: true, skipped: false, path: jsPath };
    } catch (error) {
      logger.error(`❌ Ошибка преобразования файла ${tsxPath}:`, error);
      return { success: false, error: error.message, path: tsxPath };
    }
  }

  /**
   * Добавление задачи в очередь
   */
  addToQueue(task) {
    this.queue.push(task);
    logger.debug(`📋 Задача добавлена в очередь: ${task.tsxPath}`);
    
    // Запускаем обработку, если не запущена
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Обработка очереди задач
   */
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    logger.info(`🔄 Начинаем обработку очереди: ${this.queue.length} задач`);

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      
      try {
        const result = await this.transformFile(task.tsxPath, task.jsPath);
        
        if (result.success) {
          logger.debug(`✅ Задача выполнена: ${task.tsxPath}`);
        } else {
          logger.error(`❌ Задача не выполнена: ${task.tsxPath} - ${result.error}`);
        }
      } catch (error) {
        logger.error(`❌ Критическая ошибка в задаче ${task.tsxPath}:`, error);
      }

      // Небольшая пауза между задачами, чтобы не перегружать систему
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
    logger.info(`🎉 Обработка очереди завершена`);
  }

  /**
   * Преобразование всех .tsx файлов в директории (асинхронно)
   */
  async transformDirectoryAsync(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      const tsxFiles = files.filter(file => file.endsWith('.tsx'));
      
      if (tsxFiles.length === 0) {
        logger.debug(`📁 В директории ${dirPath} нет .tsx файлов`);
        return 0;
      }

      let addedToQueue = 0;

      // Проверяем каждый .tsx файл и добавляем в очередь только те, для которых нет .js
      for (const tsxFile of tsxFiles) {
        const tsxPath = path.join(dirPath, tsxFile);
        const jsPath = path.join(dirPath, tsxFile.replace('.tsx', '.js'));
        
        try {
          // Проверяем, существует ли .js файл
          await fs.access(jsPath);
          logger.debug(`⏭️ Пропускаем ${tsxFile} - .js файл уже существует`);
        } catch {
          // .js файла нет, добавляем в очередь
          this.addToQueue({ tsxPath, jsPath });
          addedToQueue++;
        }
      }

      if (addedToQueue > 0) {
        logger.info(`📋 Добавлено ${addedToQueue} из ${tsxFiles.length} .tsx файлов из ${dirPath} в очередь`);
      } else {
        logger.debug(`📁 Все .tsx файлы в ${dirPath} уже имеют .js версии`);
      }

      return addedToQueue;
    } catch (error) {
      logger.error(`Ошибка сканирования директории ${dirPath}:`, error);
      return 0;
    }
  }

  /**
   * Преобразование всех компонентов в output/ (асинхронно)
   */
  async transformAllComponentsAsync() {
    // Защита от повторного запуска
    if (this.hasStarted) {
      logger.debug('🔄 Фоновое преобразование уже запущено, пропускаем');
      return 0;
    }

    this.hasStarted = true;

    try {
      logger.info('🚀 Начинаем фоновое преобразование всех компонентов...');
      
      // Получаем все директории в output/
      const outputDirs = await fs.readdir(this.outputDir);
      let totalTasks = 0;

      for (const dir of outputDirs) {
        const dirPath = path.join(this.outputDir, dir);
        
        try {
          const stat = await fs.stat(dirPath);
          if (stat.isDirectory()) {
            const taskCount = await this.transformDirectoryAsync(dirPath);
            totalTasks += taskCount;
          }
        } catch (error) {
          logger.debug(`Пропускаем ${dir} (не директория или ошибка доступа)`);
        }
      }

      if (totalTasks > 0) {
        logger.info(`📋 Всего добавлено ${totalTasks} задач в очередь`);
      } else {
        logger.info(`📁 Все компоненты уже имеют .js версии, преобразование не требуется`);
      }
      return totalTasks;
    } catch (error) {
      logger.error('Ошибка сканирования output/:', error);
      this.hasStarted = false; // Сбрасываем флаг при ошибке
      return 0;
    }
  }

  /**
   * Преобразование компонентов для конкретной задачи (асинхронно)
   */
  async transformTaskComponentsAsync(taskId) {
    try {
      const taskDir = path.join(this.outputDir, taskId);
      
      // Проверяем существование директории
      await fs.access(taskDir);
      
      logger.info(`📋 Добавляем компоненты задачи ${taskId} в очередь`);
      const taskCount = await this.transformDirectoryAsync(taskDir);
      
      return taskCount;
    } catch (error) {
      logger.error(`Ошибка сканирования директории задачи ${taskId}:`, error);
      return 0;
    }
  }

  /**
   * Получение статуса воркера
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.queue.length,
      hasStarted: this.hasStarted,
      status: this.hasStarted ? 
        (this.queue.length === 0 && !this.isProcessing ? 'completed' : 'in_progress') : 
        'not_started'
    };
  }
}

export default BackgroundJSTransformer;
