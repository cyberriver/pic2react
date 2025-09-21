import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Box, Container, AppBar, Toolbar, Typography, CssBaseline } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from './components/Dashboard'
import Components from './components/Components'
import Settings from './components/Settings'
import Navigation from './components/Navigation'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <CssBaseline />
          
          {/* Навигация */}
          <Navigation />
          
          {/* Основной контент */}
          <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider' }}>
              <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
                  React Component Generator
                </Typography>
              </Toolbar>
            </AppBar>
            
            <Container maxWidth="xl" sx={{ flexGrow: 1, py: 3 }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/components" element={<Components />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Container>
          </Box>
        </Box>
      </Router>
    </QueryClientProvider>
  )
}

export default App
