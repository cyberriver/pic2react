import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  Chip
} from '@mui/material'
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Restore as RestoreIcon
} from '@mui/icons-material'

interface Settings {
  openaiApiKey: string
  defaultReactVersion: string
  defaultTypeScript: boolean
  defaultUILibrary: string
  defaultStyling: string
  maxFileSize: number
  processingTimeout: number
  autoCleanup: boolean
  logLevel: string
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    openaiApiKey: '',
    defaultReactVersion: '18',
    defaultTypeScript: true,
    defaultUILibrary: 'none',
    defaultStyling: 'css',
    maxFileSize: 50,
    processingTimeout: 30,
    autoCleanup: true,
    logLevel: 'info'
  })

  const [saved, setSaved] = useState(false)

  const handleSettingChange = (key: keyof Settings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
    setSaved(false)
  }

  const handleSave = () => {
    // Сохранение настроек
    localStorage.setItem('react-generator-settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleRestore = () => {
    const defaultSettings: Settings = {
      openaiApiKey: '',
      defaultReactVersion: '18',
      defaultTypeScript: true,
      defaultUILibrary: 'none',
      defaultStyling: 'css',
      maxFileSize: 50,
      processingTimeout: 30,
      autoCleanup: true,
      logLevel: 'info'
    }
    setSettings(defaultSettings)
    setSaved(false)
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Настройки
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Настройте параметры генерации React компонентов
      </Typography>

      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Настройки сохранены
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* API настройки */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SettingsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  API настройки
                </Typography>
              </Box>
              
              <TextField
                fullWidth
                label="OpenAI API Key"
                type="password"
                value={settings.openaiApiKey}
                onChange={(e) => handleSettingChange('openaiApiKey', e.target.value)}
                helperText="Ключ для доступа к OpenAI Vision API"
                margin="normal"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Настройки генерации */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Настройки генерации
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Версия React по умолчанию</InputLabel>
                <Select
                  value={settings.defaultReactVersion}
                  onChange={(e) => handleSettingChange('defaultReactVersion', e.target.value)}
                  label="Версия React по умолчанию"
                >
                  <MenuItem value="16">React 16</MenuItem>
                  <MenuItem value="17">React 17</MenuItem>
                  <MenuItem value="18">React 18</MenuItem>
                  <MenuItem value="19">React 19</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>UI библиотека по умолчанию</InputLabel>
                <Select
                  value={settings.defaultUILibrary}
                  onChange={(e) => handleSettingChange('defaultUILibrary', e.target.value)}
                  label="UI библиотека по умолчанию"
                >
                  <MenuItem value="none">Pure CSS</MenuItem>
                  <MenuItem value="mui">Material-UI</MenuItem>
                  <MenuItem value="antd">Ant Design</MenuItem>
                  <MenuItem value="chakra">Chakra UI</MenuItem>
                  <MenuItem value="bootstrap">Bootstrap</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Стилизация по умолчанию</InputLabel>
                <Select
                  value={settings.defaultStyling}
                  onChange={(e) => handleSettingChange('defaultStyling', e.target.value)}
                  label="Стилизация по умолчанию"
                >
                  <MenuItem value="css">CSS</MenuItem>
                  <MenuItem value="scss">SCSS</MenuItem>
                  <MenuItem value="styled-components">Styled Components</MenuItem>
                  <MenuItem value="emotion">Emotion</MenuItem>
                  <MenuItem value="tailwind">Tailwind CSS</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.defaultTypeScript}
                    onChange={(e) => handleSettingChange('defaultTypeScript', e.target.checked)}
                  />
                }
                label="TypeScript по умолчанию"
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Настройки обработки */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Настройки обработки
              </Typography>
              
              <TextField
                fullWidth
                label="Максимальный размер файла (MB)"
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                margin="normal"
                inputProps={{ min: 1, max: 100 }}
              />

              <TextField
                fullWidth
                label="Таймаут обработки (секунды)"
                type="number"
                value={settings.processingTimeout}
                onChange={(e) => handleSettingChange('processingTimeout', parseInt(e.target.value))}
                margin="normal"
                inputProps={{ min: 10, max: 300 }}
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>Уровень логирования</InputLabel>
                <Select
                  value={settings.logLevel}
                  onChange={(e) => handleSettingChange('logLevel', e.target.value)}
                  label="Уровень логирования"
                >
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="warn">Warning</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="debug">Debug</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoCleanup}
                    onChange={(e) => handleSettingChange('autoCleanup', e.target.checked)}
                  />
                }
                label="Автоматическая очистка временных файлов"
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Информация о системе */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Информация о системе
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Версия приложения
                </Typography>
                <Chip label="0.1.0" color="primary" size="small" />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Node.js версия
                </Typography>
                <Chip label={process.version} color="default" size="small" />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Статус API
                </Typography>
                <Chip label="Подключен" color="success" size="small" />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary">
                Поддерживаемые форматы: PNG, JPG, JPEG, WEBP
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Максимальный размер файла: {settings.maxFileSize}MB
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Кнопки действий */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
        >
          Сохранить настройки
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<RestoreIcon />}
          onClick={handleRestore}
        >
          Сбросить к умолчанию
        </Button>
      </Box>
    </Box>
  )
}

export default Settings
