import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeUrl, setIframeUrl] = useState<string>('');

  // Создаем URL для iframe
  useEffect(() => {
    const url = `/api/components/render/${componentId}/${componentName}`;
    setIframeUrl(url);
    console.log('ComponentRenderer: URL iframe установлен:', url);
  }, [componentId, componentName]);

  // Обработчики событий iframe
  const handleIframeLoad = useCallback(() => {
    console.log('✅ iframe загружен успешно');
    console.log('iframe src:', iframeRef.current?.src);
    setLoading(false);
    setError(null);
  }, []);

  const handleIframeError = useCallback(() => {
    console.error('❌ Ошибка загрузки iframe');
    console.error('iframe src:', iframeRef.current?.src);
    setError('Ошибка загрузки компонента в iframe');
    setLoading(false);
  }, []);

  // Устанавливаем обработчики событий когда iframe готов
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframeUrl) return;

    console.log('ComponentRenderer: Устанавливаем обработчики событий iframe');
    
    iframe.addEventListener('load', handleIframeLoad);
    iframe.addEventListener('error', handleIframeError);

    // Таймаут на случай, если iframe не загрузится
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('⏰ Таймаут загрузки iframe');
        setError('Таймаут загрузки компонента');
        setLoading(false);
      }
    }, 10000); // 10 секунд

    return () => {
      clearTimeout(timeoutId);
      iframe.removeEventListener('load', handleIframeLoad);
      iframe.removeEventListener('error', handleIframeError);
    };
  }, [iframeUrl, handleIframeLoad, handleIframeError, loading]);

  if (loading) {
    return (
      <Box 
        sx={{ 
          height, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: '#f9f9f9',
          gap: 2
        }}
      >
        <CircularProgress size={24} />
        <Typography color="text.secondary" variant="body2">
          Загрузка компонента в iframe...
        </Typography>
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
          backgroundColor: '#ffebee',
          p: 2
        }}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          <Typography variant="body2" component="div">
            <strong>Ошибка загрузки компонента:</strong>
          </Typography>
          <Typography variant="body2" component="div">
            {error}
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        height,
        border: '1px solid #ddd',
        borderRadius: '4px',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        position: 'relative'
      }}
    >
      {iframeUrl && (
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '4px'
          }}
          title={`Component: ${componentName}`}
          sandbox="allow-scripts allow-same-origin"
          loading="lazy"
        />
      )}
    </Box>
  );
};

export default ComponentRenderer;
