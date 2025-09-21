import winston from 'winston';
import path from 'path';
import fs from 'fs/promises';

/**
 * Настройка логгера Winston
 */
const createLogger = () => {
  // Создаем папку для логов если не существует
  const logsDir = './logs';
  fs.mkdir(logsDir, { recursive: true }).catch(() => {});

  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'react-generator' },
    transports: [
      // Консольный вывод
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),
      
      // Файл для всех логов
      new winston.transports.File({
        filename: path.join(logsDir, 'app.log'),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
      }),
      
      // Файл только для ошибок
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5
      })
    ]
  });

  // Обработка необработанных исключений
  logger.exceptions.handle(
    new winston.transports.File({ filename: path.join(logsDir, 'exceptions.log') })
  );

  // Обработка необработанных промисов
  logger.rejections.handle(
    new winston.transports.File({ filename: path.join(logsDir, 'rejections.log') })
  );

  return logger;
};

const logger = createLogger();

export default logger;
