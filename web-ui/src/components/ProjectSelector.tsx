import React from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Alert
} from '@mui/material'
import { Code as CodeIcon, Settings as SettingsIcon } from '@mui/icons-material'

interface Project {
  path: string
  name: string
  reactVersion: string
  typescript: boolean
  uiLibrary: string
  styling: string
}

interface ProjectSelectorProps {
  projects: Project[]
  selectedProject: string
  onProjectChange: (projectPath: string) => void
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProject,
  onProjectChange
}) => {
  const selectedProjectData = projects.find(p => p.path === selectedProject)

  const getUILibraryLabel = (uiLibrary: string) => {
    const labels: { [key: string]: string } = {
      'mui': 'Material-UI',
      'antd': 'Ant Design',
      'chakra': 'Chakra UI',
      'bootstrap': 'Bootstrap',
      'none': 'Pure CSS'
    }
    return labels[uiLibrary] || uiLibrary
  }

  const getStylingLabel = (styling: string) => {
    const labels: { [key: string]: string } = {
      'css': 'CSS',
      'scss': 'SCSS',
      'styled-components': 'Styled Components',
      'emotion': 'Emotion',
      'tailwind': 'Tailwind CSS'
    }
    return labels[styling] || styling
  }

  if (projects.length === 0) {
    return (
      <Alert severity="info">
        <Typography variant="body2">
          Проекты не найдены. Поместите React проекты в папку <code>packages/</code>
        </Typography>
      </Alert>
    )
  }

  return (
    <Box>
      <FormControl fullWidth>
        <InputLabel>Выберите проект</InputLabel>
        <Select
          value={selectedProject}
          onChange={(e) => onProjectChange(e.target.value)}
          label="Выберите проект"
        >
          {projects.map((project) => (
            <MenuItem key={project.path} value={project.path}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <CodeIcon sx={{ mr: 1 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1">
                    {project.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {project.path}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Chip
                    label={`React ${project.reactVersion}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  {project.typescript && (
                    <Chip
                      label="TS"
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedProjectData && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Конфигурация проекта
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
            <Chip
              icon={<CodeIcon />}
              label={`React ${selectedProjectData.reactVersion}`}
              color="primary"
              size="small"
            />
            {selectedProjectData.typescript && (
              <Chip
                label="TypeScript"
                color="secondary"
                size="small"
              />
            )}
            <Chip
              label={getUILibraryLabel(selectedProjectData.uiLibrary)}
              color="default"
              size="small"
            />
            <Chip
              label={getStylingLabel(selectedProjectData.styling)}
              color="default"
              size="small"
            />
          </Box>

          <Typography variant="body2" color="text.secondary">
            Компоненты будут сгенерированы с учетом настроек этого проекта
          </Typography>
        </Box>
      )}

      {!selectedProject && projects.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Выберите проект для настройки генерации компонентов
          </Typography>
        </Alert>
      )}
    </Box>
  )
}

export default ProjectSelector
