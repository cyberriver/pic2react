import React from 'react'
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  IconButton,
  Typography,
  LinearProgress,
  Alert,
  Paper
} from '@mui/material'
import {
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material'
// import { formatDistanceToNow } from 'date-fns'
// import { ru } from 'date-fns/locale'

interface QueueItem {
  id: string
  fileName: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  error?: string
}

interface ProcessingQueueProps {
  queue: QueueItem[]
}

const ProcessingQueue: React.FC<ProcessingQueueProps> = ({ queue }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <ScheduleIcon color="warning" />
      case 'processing':
        return <PlayIcon color="primary" />
      case 'completed':
        return <CheckCircleIcon color="success" />
      case 'failed':
        return <ErrorIcon color="error" />
      default:
        return <ScheduleIcon color="disabled" />
    }
  }

  const getStatusChip = (status: string) => {
    const statusMap = {
      queued: { label: 'В очереди', color: 'warning' as const },
      processing: { label: 'Обработка', color: 'primary' as const },
      completed: { label: 'Завершено', color: 'success' as const },
      failed: { label: 'Ошибка', color: 'error' as const }
    }

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.queued

    return (
      <Chip
        icon={getStatusIcon(status)}
        label={statusInfo.label}
        color={statusInfo.color}
        size="small"
        variant="outlined"
      />
    )
  }

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'только что';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин назад`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ч назад`;
      return `${Math.floor(diffInSeconds / 86400)} дн назад`;
    } catch {
      return 'Неизвестно';
    }
  }

  const handleViewResult = (item: QueueItem) => {
    if (item.status === 'completed') {
      // Открыть модальное окно с результатом
      console.log('View result for:', item.id)
    }
  }

  const handleDownload = (item: QueueItem) => {
    if (item.status === 'completed') {
      // Скачать сгенерированные файлы
      console.log('Download result for:', item.id)
    }
  }

  if (queue.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
        <Typography variant="body1" color="text.secondary">
          Очередь обработки пуста
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Загрузите изображения для начала генерации компонентов
        </Typography>
      </Paper>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Очередь обработки ({queue.length})
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Обновляется в реальном времени
        </Typography>
      </Box>

      <List sx={{ maxHeight: 400, overflow: 'auto' }}>
        {queue.map((item, index) => (
          <ListItem
            key={item.id}
            divider={index < queue.length - 1}
            sx={{
              bgcolor: item.status === 'processing' ? 'action.hover' : 'transparent',
              borderRadius: 1,
              mb: 1
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Box display="flex" alignItems="center" mb={1}>
                <Box sx={{ mr: 2 }}>
                  {getStatusIcon(item.status)}
                </Box>
                <ListItemText
                  primary={item.fileName}
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Создано: {formatTime(item.createdAt)}
                      </Typography>
                      {item.completedAt && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                          Завершено: {formatTime(item.completedAt)}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <Box sx={{ mr: 2 }}>
                  {getStatusChip(item.status)}
                </Box>
              </Box>

              {/* Прогресс для обрабатываемых файлов */}
              {item.status === 'processing' && (
                <Box sx={{ mb: 1 }}>
                  <LinearProgress />
                  <Typography variant="caption" color="text.secondary">
                    Анализ изображения и генерация компонента...
                  </Typography>
                </Box>
              )}

              {/* Ошибка для неудачных файлов */}
              {item.status === 'failed' && item.error && (
                <Alert severity="error" sx={{ mb: 1 }}>
                  {item.error}
                </Alert>
              )}

              {/* Действия для завершенных файлов */}
              {item.status === 'completed' && (
                <Box display="flex" gap={1}>
                  <IconButton
                    size="small"
                    onClick={() => handleViewResult(item)}
                    color="primary"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDownload(item)}
                    color="primary"
                  >
                    <DownloadIcon />
                  </IconButton>
                </Box>
              )}
            </Box>
          </ListItem>
        ))}
      </List>

      {/* Статистика */}
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Статистика: {queue.filter(item => item.status === 'completed').length} завершено, {' '}
          {queue.filter(item => item.status === 'processing').length} обрабатывается, {' '}
          {queue.filter(item => item.status === 'failed').length} с ошибками
        </Typography>
      </Box>
    </Box>
  )
}

export default ProcessingQueue
