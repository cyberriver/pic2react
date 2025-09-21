import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

// Импорт модулей
import FileWatcher from '../core/fileWatcher.js';
import VisionAnalyzer from '../core/visionAnalyzer.js';
import ProjectAnalyzer from '../core/projectAnalyzer.js';
import CodeGenerator from '../core/codeGenerator.js';
import MockGenerator from '../core/mockGenerator.js';
import logger from '../utils/logger.js';

// Загрузка переменных окружения
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Основной класс приложения React Component Generator
 */
class ReactGeneratorApp {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    
    this.port = process.env.PORT || 3001;
    
    // Инициализация модулей
    this.fileWatcher = new FileWatcher();
    this.visionAnalyzer = new VisionAnalyzer();
    this.projectAnalyzer = new ProjectAnalyzer();
    this.codeGenerator = new CodeGenerator();
    this.mockGenerator = new MockGenerator();
    
    // Очередь обработки
    this.processingQueue = [];
    this.isProcessing = false;
    
    // Настройка multer для загрузки файлов
    this.upload = multer({
      storage: multer.diskStorage({
        destination: 'incoming/',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = path.extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        }
      }),
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error('Только изображения (JPEG, JPG, PNG, WEBP) разрешены'));
        }
      }
    });
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
    this.setupFileWatcher();
  }

  /**
   * Настройка middleware
   */
  setupMiddleware() {
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true
    }));
    
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    // Статические файлы
    this.app.use('/static', express.static(path.join(__dirname, '../output')));
    this.app.use('/web-ui', express.static(path.join(__dirname, '../web-ui/dist')));
    
    // Логирование запросов
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  /**
   * Настройка маршрутов API
   */
  setupRoutes() {
    logger.debug('Настройка API маршрутов...');
    // API маршруты
    this.app.use('/api', this.createApiRoutes());
    
    logger.debug('Настройка веб-интерфейса...');
    // Веб-интерфейс
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../web-ui/dist/index.html'));
    });
    
    logger.debug('Настройка обработки 404...');
    // Обработка 404
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Маршрут не найден' });
    });
    
    // Обработка ошибок
    this.app.use((err, req, res, next) => {
      logger.error('Ошибка сервера:', err);
      res.status(500).json({ 
        error: 'Внутренняя ошибка сервера',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Что-то пошло не так'
      });
    });
  }

  /**
   * Создание API маршрутов
   */
  createApiRoutes() {
    const router = express.Router();

    // Получение списка проектов
    router.get('/projects', async (req, res) => {
      try {
        const projects = await this.projectAnalyzer.getAnalyzedProjects();
        res.json({ success: true, data: projects });
      } catch (error) {
        logger.error('Ошибка получения проектов:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Анализ проекта
    router.post('/projects/analyze', async (req, res) => {
      try {
        const { projectPath } = req.body;
        if (!projectPath) {
          return res.status(400).json({ success: false, error: 'Путь к проекту не указан' });
        }

        const analysis = await this.projectAnalyzer.analyzeProject(projectPath);
        res.json({ success: true, data: analysis });
      } catch (error) {
        logger.error('Ошибка анализа проекта:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Загрузка изображения
    router.post('/images/upload', this.upload.single('image'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ 
            success: false, 
            error: 'Файл изображения не найден' 
          });
        }

        const { originalname, filename, path: filePath } = req.file;
        const { projectPath } = req.body;
        
        logger.info(`Загружен файл: ${originalname} -> ${filename}`);

        // Добавление в очередь обработки
        const job = {
          id: filename,
          imagePath: filePath,
          originalName: originalname,
          projectPath: projectPath || null,
          status: 'queued',
          createdAt: new Date()
        };
        
        this.processingQueue.push(job);
        this.io.to('queue-updates').emit('queue-updated', {
          total: this.processingQueue.length,
          processing: this.isProcessing
        });
        
        // Запуск обработки если не активна
        if (!this.isProcessing) {
          this.processQueue();
        }
        
        res.json({ 
          success: true, 
          data: { 
            imageId: filename, 
            message: 'Изображение добавлено в очередь обработки' 
          } 
        });
        
      } catch (error) {
        logger.error('Ошибка загрузки изображения:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Ошибка загрузки изображения' 
        });
      }
    });

    // Статус обработки изображения
    router.get('/images/status/:id', (req, res) => {
      const { id } = req.params;
      const job = this.processingQueue.find(j => j.id === id);
      
      if (!job) {
        return res.status(404).json({ 
          success: false, 
          error: 'Задача не найдена' 
        });
      }

      res.json({ success: true, data: job });
    });

    // Получение сгенерированного компонента
    router.get('/components/:id', (req, res) => {
      const { id } = req.params;
      const job = this.processingQueue.find(j => j.id === id);
      
      if (!job) {
        return res.status(404).json({ 
          success: false, 
          error: 'Компонент не найден' 
        });
      }

      if (job.status !== 'completed') {
        return res.status(400).json({ 
          success: false, 
          error: 'Компонент еще не готов' 
        });
      }

      res.json({ success: true, data: job.result });
    });

    // Запуск генерации с параметрами
    router.post('/generate', async (req, res) => {
      try {
        const { imageId, projectConfig, options } = req.body;
        
        if (!imageId || !projectConfig) {
          return res.status(400).json({ 
            success: false, 
            error: 'ID изображения и конфигурация проекта обязательны' 
          });
        }

        const job = this.processingQueue.find(j => j.id === imageId);
        if (!job) {
          return res.status(404).json({ 
            success: false, 
            error: 'Задача не найдена' 
          });
        }

        // Обновляем конфигурацию и перезапускаем обработку
        job.projectConfig = projectConfig;
        job.options = options;
        job.status = 'queued';
        
        this.processQueue();

        res.json({ 
          success: true, 
          data: { 
            message: 'Генерация запущена с новыми параметрами' 
          }
        });

      } catch (error) {
        logger.error('Ошибка запуска генерации:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Проверка здоровья системы
    router.get('/health', async (req, res) => {
      try {
        const visionHealth = await this.visionAnalyzer.checkApiHealth();
        
        res.json({
          success: true,
          data: {
            status: 'healthy',
            timestamp: new Date(),
            services: {
              fileWatcher: this.fileWatcher.getStatus(),
              visionAnalyzer: visionHealth,
              processingQueue: {
                total: this.processingQueue.length,
                processing: this.isProcessing
              }
            }
          }
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: 'Ошибка проверки здоровья системы' 
        });
      }
    });

    return router;
  }

  /**
   * Настройка Socket.IO обработчиков
   */
  setupSocketHandlers() {
    logger.debug('Настройка Socket.io обработчиков...');
    this.io.on('connection', (socket) => {
      logger.info('Клиент подключен:', socket.id);

      // Подписка на обновления очереди
      socket.on('subscribe-queue', () => {
        socket.join('queue-updates');
        socket.emit('queue-status', {
          total: this.processingQueue.length,
          processing: this.isProcessing
        });
      });

      // Отписка от обновлений
      socket.on('unsubscribe-queue', () => {
        socket.leave('queue-updates');
      });

      socket.on('disconnect', () => {
        logger.info('Клиент отключен:', socket.id);
      });
    });
  }

  /**
   * Настройка FileWatcher
   */
  setupFileWatcher() {
    this.fileWatcher.on('fileAdded', async (fileInfo) => {
      logger.info('Новый файл обнаружен:', fileInfo.name);
      
      // Добавляем в очередь обработки
      const job = {
        id: fileInfo.id,
        imagePath: fileInfo.path,
        fileName: fileInfo.name,
        status: 'queued',
        createdAt: new Date()
      };
      
      this.processingQueue.push(job);
      this.processQueue();
      
      // Уведомляем клиентов
      this.io.to('queue-updates').emit('file-added', fileInfo);
    });

    this.fileWatcher.on('error', (error) => {
      logger.error('Ошибка FileWatcher:', error);
    });
  }

  /**
   * Обработка очереди
   */
  async processQueue() {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const job = this.processingQueue.find(j => j.status === 'queued');
    
    if (!job) {
      this.isProcessing = false;
      return;
    }

    try {
      job.status = 'processing';
      this.notifyQueueUpdate();

      logger.info(`Начинаем обработку: ${job.id}`);

      // 1. Анализ изображения
      const analysis = await this.visionAnalyzer.analyzeImage(job.imagePath);
      job.analysis = analysis;

      // 2. Анализ проекта (если указан)
      let projectConfig = null;
      if (job.projectPath) {
        projectConfig = this.projectAnalyzer.getGenerationConfig(job.projectPath);
      } else {
        // Конфигурация по умолчанию
        projectConfig = {
          reactVersion: '18',
          typescript: true,
          uiLibrary: 'none',
          styling: 'css'
        };
      }

      // 3. Генерация mock данных
      const mockData = this.mockGenerator.generateComponentMock(analysis, job.options);
      job.mockData = mockData;

      // 4. Загрузка шаблонов
      await this.codeGenerator.loadTemplates();

      // 5. Генерация компонента
      const result = await this.codeGenerator.generateComponent(
        analysis, 
        projectConfig, 
        { ...job.options, mockData }
      );

      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();

      logger.info(`Обработка завершена: ${job.id}`);

    } catch (error) {
      logger.error(`Ошибка обработки ${job.id}:`, error);
      job.status = 'failed';
      job.error = error.message;
      job.failedAt = new Date();
    } finally {
      this.isProcessing = false;
      this.notifyQueueUpdate();
      
      // Продолжаем обработку очереди
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  /**
   * Уведомление об обновлении очереди
   */
  notifyQueueUpdate() {
    this.io.to('queue-updates').emit('queue-updated', {
      total: this.processingQueue.length,
      processing: this.isProcessing,
      jobs: this.processingQueue.map(job => ({
        id: job.id,
        status: job.status,
        createdAt: job.createdAt
      }))
    });
  }

  /**
   * Сохранение изображения
   */
  async saveImage(imageData, fileName) {
    const fs = await import('fs/promises');
    const incomingDir = path.join(process.cwd(), 'incoming');
    
    // Создаем папку если не существует
    await fs.mkdir(incomingDir, { recursive: true });
    
    // Сохраняем файл
    const filePath = path.join(incomingDir, fileName);
    const buffer = Buffer.from(imageData, 'base64');
    await fs.writeFile(filePath, buffer);
    
    return fileName.replace(/\.[^/.]+$/, ''); // Возвращаем имя без расширения
  }

  /**
   * Запуск сервера
   */
  async start() {
    try {
      logger.info('Инициализация React Component Generator...');
      logger.debug('Настройка CORS...');
      
      // Настройка CORS
      this.app.use(cors({
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true
      }));
      
      logger.debug('Настройка middleware...');
      this.app.use(express.json());
      this.app.use(express.static('web-ui/dist'));
      this.app.use('/output', express.static('output'));
      
      logger.debug('Настройка маршрутов...');
      this.setupRoutes();
      
      logger.debug('Настройка Socket.io...');
      this.setupSocketHandlers();
      
      logger.debug('Загрузка шаблонов...');
      await this.codeGenerator.loadTemplates();
      logger.info('Загружено шаблонов: 6');
      
      logger.debug('Анализ проектов...');
      await this.projectAnalyzer.analyzeAllProjects();
      
      logger.debug('Запуск FileWatcher...');
      this.fileWatcher.start();
      logger.info(`FileWatcher запущен для папки: ./incoming`);
      
      logger.debug('Запуск сервера...');
      this.server.listen(this.port, () => {
        logger.info(`🚀 React Component Generator запущен на порту ${this.port}`);
        logger.info(`📁 Мониторинг папки: ${path.join(process.cwd(), 'incoming')}`);
        logger.info(`🌐 Веб-интерфейс: http://localhost:${this.port}`);
        logger.info(`📊 API: http://localhost:${this.port}/api`);
      });

      // Обработка ошибок сервера
      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`Порт ${this.port} уже используется. Попробуйте другой порт.`);
          logger.error('Возможно, другой процесс уже запущен на этом порту.');
        } else {
          logger.error('Ошибка сервера:', error);
        }
        process.exit(1);
      });

    } catch (error) {
      logger.error('Ошибка запуска приложения:', error);
      logger.error('Stack trace:', error.stack);
      process.exit(1);
    }
  }

  /**
   * Остановка сервера
   */
  async stop() {
    try {
      this.fileWatcher.stop();
      this.server.close();
      logger.info('Сервер остановлен');
    } catch (error) {
      logger.error('Ошибка остановки сервера:', error);
    }
  }
}

// Создание и запуск приложения
const app = new ReactGeneratorApp();

// Обработка сигналов завершения
process.on('SIGINT', async () => {
  logger.info('Получен сигнал SIGINT, завершаем работу...');
  await app.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Получен сигнал SIGTERM, завершаем работу...');
  await app.stop();
  process.exit(0);
});

// Запуск приложения
app.start().catch(error => {
  logger.error('Критическая ошибка:', error);
  process.exit(1);
});

export default app;
