import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Box,
  Typography,
  Button,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material'

interface FileUploadProps {
  onUpload: (files: File[]) => void
}

interface FileWithPreview extends File {
  preview?: string
  id: string
  originalFile?: File
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(file),
      originalFile: file // Сохраняем оригинальный файл
    }))
    
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Симуляция прогресса загрузки
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Используем оригинальные File объекты
      const fileObjects = files.map(file => file.originalFile || file)
      await onUpload(fileObjects)

      setUploadProgress(100)
      setTimeout(() => {
        setFiles([])
        setUploading(false)
        setUploadProgress(0)
      }, 1000)

    } catch (error) {
      console.error('Upload error:', error)
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const clearFiles = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })
    setFiles([])
  }

  return (
    <Box>
      {/* Зона загрузки */}
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Отпустите файлы здесь' : 'Перетащите изображения сюда'}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          или нажмите для выбора файлов
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Поддерживаемые форматы: PNG, JPG, JPEG, WEBP (макс. 50MB)
        </Typography>
      </Box>

      {/* Список файлов */}
      {files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1">
              Выбранные файлы ({files.length})
            </Typography>
            <Button size="small" onClick={clearFiles}>
              Очистить все
            </Button>
          </Box>
          
          <List dense>
            {files.map((file) => (
              <ListItem key={file.id} divider>
                <Box
                  component="img"
                  src={file.preview}
                  alt={file.name}
                  sx={{
                    width: 40,
                    height: 40,
                    objectFit: 'cover',
                    borderRadius: 1,
                    mr: 2
                  }}
                />
                <ListItemText
                  primary={file.name}
                  secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => removeFile(file.id)}
                    disabled={uploading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Прогресс загрузки */}
      {uploading && (
        <Box sx={{ mt: 2 }}>
          <Box display="flex" alignItems="center" mb={1}>
            <CheckCircleIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="body2">
              Загрузка файлов...
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {/* Кнопка загрузки */}
      {files.length > 0 && !uploading && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="contained"
            onClick={handleUpload}
            startIcon={<UploadIcon />}
            size="large"
          >
            Загрузить {files.length} файл(ов)
          </Button>
        </Box>
      )}

      {/* Предупреждения */}
      {files.length > 10 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Загружено много файлов. Обработка может занять некоторое время.
        </Alert>
      )}
    </Box>
  )
}

export default FileUpload
