import fs from 'fs/promises';
import path from 'path';
import { transform } from '@babel/core';
import logger from '../utils/logger.js';

/**
 * JSTransformerWorker - Преобразует существующие .tsx файлы в .js файлы
 * Используется для миграции старых компонентов на новую архитектуру
 */
class JSTransformerWorker {
  constructor() {
    this.outputDir = './output';
  }

  /**
   * Трансформация TypeScript/JSX кода в JavaScript
   */
  async transformToJavaScript(tsxCode, componentName) {
    try {
      const result = transform(tsxCode, {
        presets: [
          ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
          ['@babel/preset-react', { runtime: 'automatic' }]
        ],
        filename: `${componentName}.tsx`
      });

      if (!result || !result.code) {
        throw new Error('Ошибка трансформации Babel');
      }

      // Очищаем код от import/export и TypeScript интерфейсов
      const cleanCode = result.code
        .replace(/import React from 'react';/g, '// React уже загружен')
        .replace(/export default [^;]+;/g, '')
        .replace(/interface\s+\w+\s*\{[^}]*\}/g, '') // Удаляем TypeScript интерфейсы
        .replace(/type\s+\w+\s*=\s*[^;]+;/g, '') // Удаляем TypeScript типы
        .replace(/:\s*React\.FC<[^>]+>/g, '') // Удаляем типизацию React.FC<Props>
        .replace(/:\s*\w+Props/g, '') // Удаляем ссылки на Props интерфейсы
        .replace(/className={\`([^`]+)\${([^}]+)}\`}/g, 'className={"$1" + $2}')
        .replace(/className={\`([^`]+)\`}/g, 'className={"$1"}');

      logger.info(`🔄 Компонент ${componentName} трансформирован в JavaScript`);
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
      // Читаем TypeScript файл
      const tsxCode = await fs.readFile(tsxPath, 'utf8');
      
      // Трансформируем в JavaScript
      const jsCode = await this.transformToJavaScript(tsxCode, path.basename(tsxPath, '.tsx'));
      
      // Сохраняем JavaScript файл
      await fs.writeFile(jsPath, jsCode, 'utf8');
      
      logger.info(`✅ Файл преобразован: ${tsxPath} → ${jsPath}`);
      return jsPath;
    } catch (error) {
      logger.error(`Ошибка преобразования файла ${tsxPath}:`, error);
      throw error;
    }
  }

  /**
   * Преобразование всех .tsx файлов в директории
   */
  async transformDirectory(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      const tsxFiles = files.filter(file => file.endsWith('.tsx'));
      
      if (tsxFiles.length === 0) {
        logger.info(`📁 В директории ${dirPath} нет .tsx файлов`);
        return [];
      }

      logger.info(`🔄 Найдено ${tsxFiles.length} .tsx файлов в ${dirPath}`);

      const results = [];
      for (const tsxFile of tsxFiles) {
        const tsxPath = path.join(dirPath, tsxFile);
        const jsPath = path.join(dirPath, tsxFile.replace('.tsx', '.js'));
        
        try {
          await this.transformFile(tsxPath, jsPath);
          results.push({ tsxFile, jsPath, success: true });
        } catch (error) {
          logger.error(`❌ Ошибка преобразования ${tsxFile}:`, error.message);
          results.push({ tsxFile, jsPath, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      logger.info(`✅ Преобразовано ${successCount}/${tsxFiles.length} файлов в ${dirPath}`);
      
      return results;
    } catch (error) {
      logger.error(`Ошибка преобразования директории ${dirPath}:`, error);
      throw error;
    }
  }

  /**
   * Преобразование всех компонентов в output/
   */
  async transformAllComponents() {
    try {
      logger.info('🚀 Начинаем преобразование всех компонентов...');
      
      // Получаем все директории в output/
      const outputDirs = await fs.readdir(this.outputDir);
      const componentDirs = outputDirs.filter(dir => {
        // Проверяем, что это директория (не файл)
        return fs.stat(path.join(this.outputDir, dir)).then(stat => stat.isDirectory()).catch(() => false);
      });

      if (componentDirs.length === 0) {
        logger.info('📁 В output/ нет директорий с компонентами');
        return [];
      }

      logger.info(`📁 Найдено ${componentDirs.length} директорий с компонентами`);

      const allResults = [];
      for (const dir of componentDirs) {
        const dirPath = path.join(this.outputDir, dir);
        try {
          const results = await this.transformDirectory(dirPath);
          allResults.push({ directory: dir, results });
        } catch (error) {
          logger.error(`❌ Ошибка преобразования директории ${dir}:`, error.message);
          allResults.push({ directory: dir, results: [], error: error.message });
        }
      }

      const totalSuccess = allResults.reduce((sum, dir) => 
        sum + dir.results.filter(r => r.success).length, 0
      );
      const totalFiles = allResults.reduce((sum, dir) => 
        sum + dir.results.length, 0
      );

      logger.info(`🎉 Преобразование завершено: ${totalSuccess}/${totalFiles} файлов успешно преобразованы`);
      
      return allResults;
    } catch (error) {
      logger.error('Ошибка преобразования всех компонентов:', error);
      throw error;
    }
  }

  /**
   * Преобразование компонентов для конкретной задачи
   */
  async transformTaskComponents(taskId) {
    try {
      const taskDir = path.join(this.outputDir, taskId);
      
      // Проверяем существование директории
      await fs.access(taskDir);
      
      logger.info(`🔄 Преобразуем компоненты для задачи ${taskId}`);
      const results = await this.transformDirectory(taskDir);
      
      return results;
    } catch (error) {
      logger.error(`Ошибка преобразования компонентов для задачи ${taskId}:`, error);
      throw error;
    }
  }
}

export default JSTransformerWorker;
