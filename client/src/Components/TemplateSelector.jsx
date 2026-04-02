import React, { useState } from 'react'
import { Layout, Check } from 'lucide-react'

const TemplateSelector = ({selectedTemplate, onChange}) => {
    const [isOpen, setIsOpen] = useState(false);
    const templates = [
    { id: 'classic', name: 'Classic', preview: 'A clean, traditional layout suitable for all professions.' },
    { id: 'modern', name: 'Modern', preview: 'A sleek, contemporary design with a minimalist aesthetic.' },
    { id: 'minimal-image', name: 'Minimal with Image', preview: 'A simple layout that includes a profile image for a personal touch.' },
    { id: 'minimal', name: 'Minimal', preview: 'An ultra-clean design focusing on content with ample white space.' },

  ];
  return (
    <div className='relative'>
        <button onClick={()=> setIsOpen(!isOpen)} className='flex items-center gap-1 text-sm text-blue-600 font-medium bg-gradient-to-r from-blue-100 to-blue-200 px-3 py-2 rounded-md hover:from-blue-200 hover:to-blue-300 transition-all'>

            <Layout size={16} />
            <span className="max-sm:hidden md:inline">Template: </span>

        </button>
        {isOpen && (
            <div className="absolute z-[60] top-full mt-2 right-0 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                {templates.map((template) => (
                    <div key={template.id} onClick={() => { onChange(template.id); setIsOpen(false); }} className={`p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-start ${selectedTemplate === template.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                        <div className="flex-1">
                            <h3 className={`font-medium ${selectedTemplate === template.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>{template.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{template.preview}</p>
                        </div>
                        {selectedTemplate === template.id && (
                            <Check className='size-4 text-blue-600 mt-1 shrink-0' />
                        )}
                    </div>
                ))}
            </div>
        )}
    </div>
  )
}

export default TemplateSelector
