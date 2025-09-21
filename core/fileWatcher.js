import chokidar from 'chokidar';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { readFileSync } from 'fs';
const config = JSON.parse(readFileSync(new URL('../config/settings.json', import.meta.url), 'utf8'));

/**
 * FileWatcher - мониторинг папки incoming/ для новых изображений
 */
class FileWatcher extends EventEmitter {
  constructor() {
    super();
    this.watcher = null;
    this.isWatching = false;
    this.processedFiles = new Set();
    this.supportedExtensions = config.security.allowedExtensions;
  }

  /**
   * Запуск мониторинга папки incoming/
   */
  start() {
    if (this.isWatching) {
      logger.warn('FileWatcher уже запущен');
      return;
    }

    const incomingPath = config.paths.incoming;
    
    // Создаем папку если не существует
    fs.mkdir(incomingPath, { recursive: true }).catch(err => {
      logger.error('Ошибка создания папки incoming:', err);
    });

    this.watcher = chokidar.watch(incomingPath, {
      ignored: /(^|[\/\\])\../, // игнорируем скрытые файлы
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    this.watcher
      .on('add', (filePath) => this.handleNewFile(filePath))
      .on('change', (filePath) => this.handleFileChange(filePath))
      .on('error', (error) => this.handleError(error));

    this.isWatching = true;
    logger.info(`FileWatcher запущен для папки: ${incomingPath}`);
  }

  /**
   * Остановка мониторинга
   */
  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.isWatching = false;
    logger.info('FileWatcher остановлен');
  }

  /**
   * Обработка нового файла
   */
  async handleNewFile(filePath) {
    try {
      const fileName = path.basename(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      // Проверяем расширение файла
      if (!this.supportedExtensions.includes(ext)) {
        logger.warn(`Неподдерживаемый формат файла: ${fileName}`);
        return;
      }

      // Проверяем размер файла
      const stats = await fs.stat(filePath);
      if (stats.size > config.security.maxFileSize) {
        logger.warn(`Файл слишком большой: ${fileName} (${stats.size} bytes)`);
        return;
      }

      // Проверяем, не обрабатывали ли мы уже этот файл
      if (this.processedFiles.has(filePath)) {
        return;
      }

      this.processedFiles.add(filePath);

      const fileInfo = {
        id: uuidv4(),
        path: filePath,
        name: fileName,
        size: stats.size,
        extension: ext,
        timestamp: new Date(),
        status: 'detected'
      };

      logger.info(`Обнаружен новый файл: ${fileName}`);
      
      // Эмитим событие для обработки
      this.emit('fileAdded', fileInfo);

    } catch (error) {
      logger.error('Ошибка обработки нового файла:', error);
      this.emit('error', error);
    }
  }

  /**
   * Обработка изменения файла
   */
  async handleFileChange(filePath) {
    logger.info(`Файл изменен: ${path.basename(filePath)}`);
    // Удаляем из обработанных, чтобы переобработать
    this.processedFiles.delete(filePath);
    await this.handleNewFile(filePath);
  }

  /**
   * Обработка ошибок
   */
  handleError(error) {
    logger.error('Ошибка FileWatcher:', error);
    this.emit('error', error);
  }

  /**
   * Получение статуса мониторинга
   */
  getStatus() {
    return {
      isWatching: this.isWatching,
      processedFiles: this.processedFiles.size,
      supportedExtensions: this.supportedExtensions
    };
  }

  /**
   * Очистка списка обработанных файлов
   */
  clearProcessedFiles() {
    this.processedFiles.clear();
    logger.info('Список обработанных файлов очищен');
  }
}

export default FileWatcher;
