import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Code as CodeIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material'

interface ComponentFile {
  path: string
  content: string
  type: string
}

interface ComponentPreviewProps {
  open: boolean
  onClose: () => void
  component: {
    id: string
    name: string
    files: ComponentFile[]
    metadata: {
      reactVersion: string
      typescript: boolean
      uiLibrary: string
      styling: string
    }
  } | null
}

const ComponentPreview: React.FC<ComponentPreviewProps> = ({ open, onClose, component }) => {
  const [activeTab, setActiveTab] = useState(0)
  const [previewMode, setPreviewMode] = useState<'code' | 'preview'>('code')

  if (!component) return null

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
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

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'component':
        return <CodeIcon />
      case 'styles':
        return <ViewIcon />
      case 'types':
        return <CodeIcon />
      case 'stories':
        return <PlayIcon />
      case 'test':
        return <CodeIcon />
      case 'docs':
        return <ViewIcon />
      default:
        return <CodeIcon />
    }
  }

  const renderCodePreview = () => {
    const file = component.files[activeTab]
    if (!file) return null

    return (
      <Box sx={{ height: '500px', overflow: 'auto' }}>
        <pre style={{
          background: '#f5f5f5',
          padding: '16px',
          borderRadius: '4px',
          fontSize: '14px',
          fontFamily: 'Monaco, Menlo, monospace',
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {file.content}
        </pre>
      </Box>
    )
  }

  const renderComponentPreview = () => {
    // Здесь можно добавить реальный рендер компонента
    // Пока что показываем заглушку
    return (
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        minHeight: '500px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: '#f5f5f5',
        borderRadius: 1
      }}>
        <PlayIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Предпросмотр компонента
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {component.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            React {component.metadata.reactVersion}
          </Typography>
          {component.metadata.typescript && (
            <Typography variant="caption" color="text.secondary">
              • TypeScript
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            • {component.metadata.uiLibrary}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            • {component.metadata.styling}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Здесь будет интерактивный предпросмотр компонента
        </Typography>
      </Box>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <CodeIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              {component.name}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="Переключить режим">
              <IconButton
                onClick={() => setPreviewMode(previewMode === 'code' ? 'preview' : 'code')}
                color="primary"
              >
                {previewMode === 'code' ? <PlayIcon /> : <CodeIcon />}
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {previewMode === 'code' ? (
          <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ px: 2 }}
              >
                {component.files.map((file, index) => (
                  <Tab
                    key={index}
                    label={file.path}
                    icon={getFileIcon(file.type)}
                    iconPosition="start"
                    sx={{ minHeight: 48 }}
                  />
                ))}
              </Tabs>
            </Box>
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              {renderCodePreview()}
            </Box>
          </>
        ) : (
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {renderComponentPreview()}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => {
            // Логика скачивания компонента
            console.log('Download component:', component.id)
          }}
        >
          Скачать
        </Button>
        <Button
          variant="contained"
          onClick={onClose}
        >
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ComponentPreview
