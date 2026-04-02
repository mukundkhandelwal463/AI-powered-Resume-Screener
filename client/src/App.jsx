// import { Home } from 'lucide-react'
import React from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import ResumeBuilder from './pages/ResumeBuilder.jsx'
import Preview from './pages/Preview.jsx'

const App = () => {
  return (
    <ThemeProvider>
      <Routes>
        <Route path='/app/builder/:resumeId' element={<ResumeBuilder />} />
        <Route path='/view/:resumeId' element={<Preview />} />
        <Route path='*' element={<Navigate to="/app/builder/default" replace />} />
      </Routes>
    </ThemeProvider>
  )
}

export default App
