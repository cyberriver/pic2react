import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Chip,
  Paper
} from '@mui/material'
import {
  Upload as UploadIcon,
  Code as CodeIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
// import { io, Socket } from 'socket.io-client'
import FileUpload from './FileUpload'
import ProcessingQueue from './ProcessingQueue'
import ProjectSelector from './ProjectSelector'

interface QueueItem {
  id: string
  fileName: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  error?: string
}

interface SystemStats {
  totalProcessed: number
  successRate: number
  averageProcessingTime: number
  activeJobs: number
}

const Dashboard: React.FC = () => {
  const [socket, setSocket] = useState<any>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')

  // Подключение к WebSocket (отключено для упрощения)
  useEffect(() => {
    // const newSocket = io('http://localhost:3001')
    // setSocket(newSocket)
    // 
    // newSocket.on('connect', () => {
    //   console.log('Connected to server')
    // })
    // 
    // newSocket.on('queue-updated', (data) => {
    //   setQueue(data.jobs || [])
    // })
    // 
    // newSocket.on('file-added', (fileInfo) => {
    //   console.log('New file added:', fileInfo)
    // })
    // 
    // return () => {
    //   newSocket.close()
    // }
  }, [])

  // Получение статистики системы
  const { data: stats, isLoading: statsLoading } = useQuery<SystemStats>({
    queryKey: ['system-stats'],
    queryFn: async () => {
      const response = await fetch('/api/health')
      const data = await response.json()
      return {
        totalProcessed: data.data.services.processingQueue.total || 0,
        successRate: 95, // Мок данные
        averageProcessingTime: 15, // Мок данные
        activeJobs: data.data.services.processingQueue.processing ? 1 : 0
      }
    },
    refetchInterval: 5000
  })

  // Получение списка проектов
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects')
      const data = await response.json()
      return data.data || []
    }
  })

  const handleFileUpload = async (files: File[]) => {
    for (const file of files) {
      const formData = new FormData()
      formData.append('image', file)
      
      try {
        const response = await fetch('http://localhost:3001/api/images/upload', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          throw new Error('Upload failed')
        }
      } catch (error) {
        console.error('Upload error:', error)
      }
    }
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Дашборд
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Загрузите изображения UI элементов для автоматической генерации React компонентов
      </Typography>

      <Grid container spacing={3}>
        {/* Статистика */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <CodeIcon color="primary" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">
                        {stats?.totalProcessed || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Обработано
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">
                        {stats?.successRate || 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Успешность
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <SpeedIcon color="info" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">
                        {stats?.averageProcessingTime || 0}с
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Среднее время
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <UploadIcon color="warning" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">
                        {stats?.activeJobs || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Активных задач
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Выбор проекта */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Выбор проекта
              </Typography>
              <ProjectSelector
                projects={projects || []}
                selectedProject={selectedProject}
                onProjectChange={setSelectedProject}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Загрузка файлов */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Загрузка изображений
              </Typography>
              <FileUpload onUpload={handleFileUpload} />
            </CardContent>
          </Card>
        </Grid>

        {/* Очередь обработки */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Очередь обработки
              </Typography>
              <ProcessingQueue queue={queue} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard
