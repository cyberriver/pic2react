import React, { useState } from 'react'
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
  Alert
} from '@mui/material'
import {
  Code as CodeIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import ComponentPreview from './ComponentPreview'

interface Component {
  id: string
  name: string
  createdAt: string
  status: 'completed' | 'failed'
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
  }
}

const Components: React.FC = () => {
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null)
  const [previewFile, setPreviewFile] = useState<string>('')
  const [tabValue, setTabValue] = useState(0)

  // Мок данные для демонстрации
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

  const handleViewComponent = (component: Component) => {
    setSelectedComponent(component)
    setPreviewFile(component.files[0]?.content || '')
    setTabValue(0)
  }

  const handleCloseDialog = () => {
    setSelectedComponent(null)
    setPreviewFile('')
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
    if (selectedComponent) {
      setPreviewFile(selectedComponent.files[newValue]?.content || '')
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

      {mockComponents.length === 0 ? (
        <Alert severity="info">
          <Typography variant="body1">
            Компоненты не найдены. Загрузите изображения для генерации компонентов.
          </Typography>
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {mockComponents.map((component) => (
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
                      label={`React ${component.metadata.reactVersion}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    {component.metadata.typescript && (
                      <Chip
                        label="TypeScript"
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    )}
                    <Chip
                      label={component.metadata.styling}
                      size="small"
                      variant="outlined"
                    />
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
      )}

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
                {selectedComponent.files.map((file, index) => (
                  <Tab
                    key={index}
                    label={file.path}
                    icon={<CodeIcon />}
                  />
                ))}
              </Tabs>
              
              <Box sx={{ mt: 2 }}>
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
