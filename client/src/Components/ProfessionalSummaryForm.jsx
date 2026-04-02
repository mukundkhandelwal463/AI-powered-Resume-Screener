import { Loader2, Sparkle } from 'lucide-react'
import React from 'react'

const ProfessionalSummaryForm = ({
  data,
  onChange,
  onGenerateSummary,
  isGenerating = false,
  professionalTitle = '',
  streamCategory = '',
}) => {
  const contextHint = professionalTitle
    ? `Using Professional Title: ${professionalTitle}`
    : streamCategory
      ? `Using ATS Category/Stream: ${streamCategory}`
      : 'Add Professional Title or ATS Category/Stream for best AI summary.'

  return (
    <div className= 'space-y-4'>
        <div className = 'flex items-center gap-2 text-lg font-semibold text-gray-800'>
            <div>
                <h3>Professional Summary</h3>
                <p className="text-sm text-gray-500">A brief overview of your skills and experience.</p>
                <p className="text-xs text-blue-600 mt-1">{contextHint}</p>

            </div>
        
        <button
            type="button"
            onClick={onGenerateSummary}
            disabled={isGenerating}
            className='flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm font-medium'
        >
            {isGenerating ? <Loader2 size={16} className='size-4 animate-spin' /> : <Sparkle size={16} className='size-4' />}
            {isGenerating ? 'Generating...' : 'AI Generate Summary'}

        </button>
        </div>
        <div className="mt-4">
            <textarea value={data || ""} onChange={(e) => onChange(e.target.value)} rows="4" className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" placeholder="Write a comprehensive summary of your professional background and career aspirations."></textarea>
            <p className="text-xs text-gray-500 mt-1 text-center">Try to keep your summary between 50-150 words for optimal impact.</p>
        </div>
    </div>
  )
}

export default ProfessionalSummaryForm
