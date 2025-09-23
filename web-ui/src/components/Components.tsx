import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  LinearProgress
} from '@mui/material'
import {
  Code as CodeIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import ComponentPreview from './ComponentPreview'
import ComponentRenderer from './ComponentRenderer'

interface Component {
  id: string
  name: string
  type: string
  createdAt: string
  status: 'completed' | 'failed'
  quality: number
  iterations: number
  files: Array<{
    path: string
    content: string
    type: string
  }>
  metadata: {
    reactVersion: string
    typescript: boolean
    uiLibrary: string
    styling: string
    optimizationUsed: boolean
    strictEvaluation: boolean
  }
}

interface ProcessingJob {
  id: string
  imagePath: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  result?: {
    components: Component[]
    analysis: any
    tokens: any
    temperature: number
  }
}

const Components: React.FC = () => {
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null)
  const [previewFile, setPreviewFile] = useState<string>('')
  const [tabValue, setTabValue] = useState(0)
  const [components, setComponents] = useState<Component[]>([])
  const [loading, setLoading] = useState(true)
  const [originalImage, setOriginalImage] = useState<string>('')

  // Загрузка компонентов из API
  useEffect(() => {
    loadComponents()
  }, [])

  const loadComponents = async () => {
    try {
      setLoading(true)
      // Получаем список завершенных задач
      const response = await fetch('/api/images/status')
      const data = await response.json()
      
      if (data.success) {
        const completedJobs = data.data.filter((job: ProcessingJob) => job.status === 'completed')
        const allComponents: Component[] = []
        
        // Преобразуем задачи в компоненты
        for (const job of completedJobs) {
          if (job.result && job.result.components) {
            // Создаем компонент для каждой задачи
            const mainComponent: Component = {
              id: job.id,
              name: `Main${job.id}`,
              type: 'Main',
              createdAt: job.createdAt,
              status: 'completed',
              quality: 0.85, // Значение по умолчанию
              iterations: 5, // Значение по умолчанию
              files: job.result.components.map((comp: any) => ({
                name: comp.name,
                path: comp.path,
                content: '', // Будет загружено при необходимости
                type: comp.type
              })),
              metadata: {
                reactVersion: '18.0.0',
                typescript: true,
                uiLibrary: 'Material-UI',
                styling: 'CSS Modules',
                optimizationUsed: true,
                strictEvaluation: true
              }
            }
            
            allComponents.push(mainComponent)
          }
        }
        
        setComponents(allComponents)
      }
    } catch (error) {
      console.error('Ошибка загрузки компонентов:', error)
    } finally {
      setLoading(false)
    }
  }

  // Мок данные для демонстрации (если API недоступен)
  const mockComponents: Component[] = [
    {
      id: '1',
      name: 'Button',
      createdAt: '2024-01-20T10:30:00Z',
      status: 'completed',
      files: [
        {
          path: 'Button.tsx',
          content: `import React from 'react';\n\ninterface ButtonProps {\n  children: React.ReactNode;\n  onClick?: () => void;\n}\n\nconst Button: React.FC<ButtonProps> = ({ children, onClick }) => {\n  return (\n    <button \n      className="button"\n      onClick={onClick}\n    >\n      {children}\n    </button>\n  );\n};\n\nexport default Button;`,
          type: 'component'
        },
        {
          path: 'Button.css',
          content: `.button {\n  background-color: #1976d2;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  padding: 8px 16px;\n  cursor: pointer;\n}`,
          type: 'styles'
        }
      ],
      metadata: {
        reactVersion: '18',
        typescript: true,
        uiLibrary: 'none',
        styling: 'css'
      }
    },
    {
      id: '2',
      name: 'Card',
      createdAt: '2024-01-20T11:15:00Z',
      status: 'completed',
      files: [
        {
          path: 'Card.tsx',
          content: `import React from 'react';\n\ninterface CardProps {\n  title: string;\n  children: React.ReactNode;\n}\n\nconst Card: React.FC<CardProps> = ({ title, children }) => {\n  return (\n    <div className="card">\n      <h3 className="card-title">{title}</h3>\n      <div className="card-content">{children}</div>\n    </div>\n  );\n};\n\nexport default Card;`,
          type: 'component'
        }
      ],
      metadata: {
        reactVersion: '18',
        typescript: true,
        uiLibrary: 'none',
        styling: 'css'
      }
    }
  ]

  const handleViewComponent = async (component: Component) => {
    setSelectedComponent(component)
    setTabValue(0)
    
    // Загружаем содержимое первого файла
    console.log('Загружаем компонент:', component.id, 'файлы:', component.files)
    console.log('Первый файл:', component.files[0])
    if (component.files.length > 0 && component.files[0] && component.files[0].name) {
      try {
        const url = `/api/components/preview/${component.id}/${component.files[0].name}`
        console.log('Запрашиваем URL:', url)
        const fileResponse = await fetch(url)
        console.log('Ответ сервера:', fileResponse.status, fileResponse.ok)
        if (fileResponse.ok) {
          const fileData = await fileResponse.json()
          console.log('Данные файла:', fileData)
          if (fileData.success) {
            setPreviewFile(fileData.data.content)
            console.log('Содержимое файла установлено')
          }
        } else {
          console.error('Ошибка HTTP:', fileResponse.status, fileResponse.statusText)
          setPreviewFile('// Ошибка HTTP: ' + fileResponse.status)
        }
      } catch (error) {
        console.error('Ошибка загрузки файла:', error)
        setPreviewFile('// Ошибка загрузки файла: ' + error.message)
      }
    } else {
      console.log('Файлы не найдены или имя файла отсутствует')
      setPreviewFile('// Файл не найден')
    }
    
    // Загружаем оригинальное изображение для сравнения
    try {
      const imageUrl = `/api/images/original/${component.id}`
      console.log('Загружаем изображение:', imageUrl)
      const imageResponse = await fetch(imageUrl)
      console.log('Ответ изображения:', imageResponse.status, imageResponse.ok)
      if (imageResponse.ok) {
        const imageBlob = await imageResponse.blob()
        const imageObjectUrl = URL.createObjectURL(imageBlob)
        setOriginalImage(imageObjectUrl)
        console.log('Изображение загружено успешно')
      } else {
        console.error('Ошибка загрузки изображения:', imageResponse.status, imageResponse.statusText)
      }
    } catch (error) {
      console.error('Ошибка загрузки оригинального изображения:', error)
    }
  }

  const handleCloseDialog = () => {
    setSelectedComponent(null)
    setPreviewFile('')
  }

  const handleTabChange = async (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
    if (selectedComponent && selectedComponent.files[newValue] && selectedComponent.files[newValue].name) {
      try {
        const fileResponse = await fetch(`/api/components/preview/${selectedComponent.id}/${selectedComponent.files[newValue].name}`)
        if (fileResponse.ok) {
          const fileData = await fileResponse.json()
          if (fileData.success) {
            setPreviewFile(fileData.data.content)
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки файла:', error)
        setPreviewFile('// Ошибка загрузки файла')
      }
    } else {
      setPreviewFile('// Файл не найден')
    }
  }

  const getFileLanguage = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'tsx':
      case 'ts':
        return 'tsx'
      case 'jsx':
      case 'js':
        return 'jsx'
      case 'css':
        return 'css'
      case 'scss':
        return 'scss'
      case 'md':
        return 'markdown'
      default:
        return 'text'
    }
  }

  const handleDownload = (component: Component) => {
    // Создаем ZIP архив с файлами компонента
    console.log('Download component:', component.name)
  }

  const handleDelete = (componentId: string) => {
    console.log('Delete component:', componentId)
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Сгенерированные компоненты
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
        >
          Обновить
        </Button>
      </Box>

      {loading ? (
        <Box>
          <LinearProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Загрузка компонентов...
          </Typography>
        </Box>
      ) : (components.length === 0 ? (
        <Alert severity="info">
          <Typography variant="body1">
            Компоненты не найдены. Загрузите изображения для генерации компонентов.
          </Typography>
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {components.map((component) => (
            <Grid item xs={12} sm={6} md={4} key={component.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <CodeIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div">
                      {component.name}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Создан: {new Date(component.createdAt).toLocaleDateString('ru-RU')}
                  </Typography>

                  <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                    <Chip
                      label={`${component.type}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={`Качество: ${(component.quality * 100).toFixed(1)}%`}
                      size="small"
                      color={component.quality > 0.8 ? 'success' : component.quality > 0.6 ? 'warning' : 'error'}
                      variant="outlined"
                    />
                    <Chip
                      label={`Итераций: ${component.iterations}`}
                      size="small"
                      variant="outlined"
                    />
                    {component.metadata?.optimizationUsed && (
                      <Chip
                        label="Оптимизация"
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Файлов: {component.files.length}
                  </Typography>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewComponent(component)}
                  >
                    Просмотр
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(component)}
                  >
                    Скачать
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(component.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ))}

      {/* Диалог просмотра компонента */}
      <Dialog
        open={!!selectedComponent}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <CodeIcon sx={{ mr: 1 }} />
            {selectedComponent?.name}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedComponent && (
            <Box>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Код" icon={<CodeIcon />} />
                <Tab label="Сравнение" icon={<ViewIcon />} />
                {selectedComponent.files.map((file, index) => (
                  <Tab
                    key={index + 2}
                    label={file.path}
                    icon={<CodeIcon />}
                  />
                ))}
              </Tabs>
              
              <Box sx={{ mt: 2 }}>
                {tabValue === 0 && (
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '16px', 
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '14px',
                    fontFamily: 'Monaco, Menlo, monospace'
                  }}>
                    {previewFile}
                  </pre>
                )}
                
                {tabValue === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Сравнение с оригиналом
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Оригинальное изображение
                        </Typography>
                        {originalImage ? (
                          <Box 
                            sx={{ 
                              height: '400px', 
                              border: '1px solid #ddd', 
                              borderRadius: '4px',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#f9f9f9'
                            }}
                          >
                            <img 
                              src={originalImage} 
                              alt="Оригинал" 
                              style={{ 
                                maxWidth: '100%', 
                                maxHeight: '100%', 
                                objectFit: 'contain'
                              }} 
                            />
                          </Box>
                        ) : (
                          <Box 
                            sx={{ 
                              height: '400px', 
                              border: '1px dashed #ccc', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              borderRadius: '4px'
                            }}
                          >
                            <Typography color="text.secondary">
                              Загрузка изображения...
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Сгенерированный компонент
                        </Typography>
                        {selectedComponent.files.length > 0 && selectedComponent.files[0] && selectedComponent.files[0].name ? (
                          <ComponentRenderer
                            componentId={selectedComponent.id}
                            componentName={selectedComponent.files[0].name}
                            height="400px"
                          />
                        ) : (
                          <Box sx={{ 
                            height: '400px',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            backgroundColor: '#f9f9f9'
                          }}>
                            <Typography color="text.secondary">
                              Компонент не найден
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Качество: {(selectedComponent.quality * 100).toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Итераций оптимизации: {selectedComponent.iterations}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Тип: {selectedComponent.type}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}
                
                {tabValue > 1 && (
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '16px', 
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '14px',
                    fontFamily: 'Monaco, Menlo, monospace'
                  }}>
                    {selectedComponent.files[tabValue - 2]?.content || ''}
                  </pre>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Закрыть
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => selectedComponent && handleDownload(selectedComponent)}
          >
            Скачать
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Components
