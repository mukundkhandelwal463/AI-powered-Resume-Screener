import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DummyResumeData } from '../assets/assets.js'
import ResumePreview from '../Components/ResumePreview.jsx'

const Preview = () => {
  const { resumeId } = useParams()
  const [resumeData, setResumeData] = useState(null)

  useEffect(() => {
    // Load resume data based on resumeId
    if (DummyResumeData && DummyResumeData._id === resumeId) {
      setResumeData(DummyResumeData)
      document.title = DummyResumeData.title
    }
  }, [resumeId])

  if (!resumeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading resume...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{resumeData.title}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Preview of your resume</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
          <ResumePreview 
            data={resumeData} 
            template={resumeData.template} 
            accentColor={resumeData.accent_color} 
            classes="print:p-0 print:m-0" 
          />
        </div>
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => window.print()} 
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all font-medium shadow-md"
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  )
}

export default Preview
