import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Alert } from '@mui/material';

interface ComponentRendererProps {
  componentId: string;
  componentName: string;
  height?: string;
}

const ComponentRenderer: React.FC<ComponentRendererProps> = ({ 
  componentId, 
  componentName, 
  height = '400px' 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAndRenderComponent = async () => {
      try {
        setLoading(true);
        setError(null);

        // Получаем чистый код компонента
        const response = await fetch(`/api/components/clean/${componentId}/${componentName}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Ошибка загрузки компонента');
        }

        const { code } = data.data;

        // Создаем изолированный контейнер для рендеринга
        if (containerRef.current) {
          // Очищаем контейнер
          containerRef.current.innerHTML = '';

          // Создаем React root
          const root = ReactDOM.createRoot(containerRef.current);

          try {
            // Выполняем код компонента в безопасном контексте
            const ComponentFunction = new Function('React', code + `; return ${componentName};`)(React);
            
            // Рендерим компонент
            root.render(React.createElement(ComponentFunction));
            
          } catch (renderError) {
            console.error('Ошибка рендеринга компонента:', renderError);
            root.render(
              React.createElement(Alert, { severity: 'error' }, 
                `Ошибка рендеринга: ${renderError.message}`
              )
            );
          }
        }

      } catch (err) {
        console.error('Ошибка загрузки компонента:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    };

    loadAndRenderComponent();
  }, [componentId, componentName]);

  if (loading) {
    return (
      <Box 
        sx={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: '#f9f9f9'
        }}
      >
        <Typography color="text.secondary">Загрузка компонента...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        sx={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: '#ffebee'
        }}
      >
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box 
      ref={containerRef}
      sx={{ 
        height,
        border: '1px solid #ddd',
        borderRadius: '4px',
        overflow: 'auto',
        backgroundColor: '#ffffff'
      }}
    />
  );
};

export default ComponentRenderer;
