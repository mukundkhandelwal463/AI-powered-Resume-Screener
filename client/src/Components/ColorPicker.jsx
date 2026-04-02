import { Palette, Check } from 'lucide-react';
import React from 'react'

const ColorPicker = ({selectedColor, onChange}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const colors = [
        { id: 'red', name: 'Red', hex: '#EF4444' },
        { id: 'blue', name: 'Blue', hex: '#3B82F6' },
        { id: 'green', name: 'Green', hex: '#22C55E' },

        { id: 'yellow', name: 'Yellow', hex: '#F59E0B' },

        { id: 'purple', name: 'Purple', hex: '#A855F7' },

        { id: 'pink', name: 'Pink', hex: '#EC4899' },

        { id: 'orange', name: 'Orange', hex: '#FB923C' },

        { id: 'teal', name: 'Teal', hex: '#20C997' },
        { id: 'gray', name: 'Gray', hex: '#6B7280' },
        { id: 'indigo', name: 'Indigo', hex: '#6366F1' },

        { id: 'lime', name: 'Lime', hex: '#A3E635' },

        { id: 'cyan', name: 'Cyan', hex: '#06B6D4' },

        { id: 'fuchsia', name: 'Fuchsia', hex: '#D946EF' },

        { id: 'crimson', name: 'Crimson', hex: '#DC2626' },

        { id: 'amber', name: 'Amber', hex: '#F59E0B' },
        { id: 'emerald', name: 'Emerald', hex: '#2DD4BF' },

        { id: 'sky', name: 'Sky', hex: '#0EA5E9' },

        { id: 'violet', name: 'Violet', hex: '#8B5CF6' },

        { id: 'rose', name: 'Rose', hex: '#EC4899' },

        { id: 'indigo', name: 'Indigo', hex: '#6366F1' },   

    ]

  return (
    <div className='relative'>
        <button onClick={()=> setIsOpen(!isOpen)} className='flex items-center gap-1 text-sm text-blue-600 font-medium bg-gradient-to-r from-blue-100 to-blue-200 px-3 py-2 rounded-md hover:from-blue-200 hover:to-blue-300 transition-all'>
            <Palette size={18} />
            <span className="max-sm:hidden md:inline">Color</span>
        </button>
        {isOpen && (
            <div className="absolute z-[60] top-full mt-2 right-0 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-3">
                <div className="grid grid-cols-5 gap-2">
                    {colors.map((color) => (
                        <div key={color.id} 
                             className={`w-10 h-10 rounded-full cursor-pointer flex items-center justify-center border border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform ${selectedColor === color.hex ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`} 
                             style={{ backgroundColor: color.hex }} 
                             setIsOpen={false}
                             onClick={() => { onChange(color.hex); setIsOpen(false); }}
                             title={color.name}>
                            {selectedColor === color.hex && (
                                <Check className='size-5 text-white drop-shadow-md' />
                            )}
                        </div>
                    ))}
                    <p className="text-xs text-gray-500 dark:text-gray-400 col-span-5 mt-2">{colors.name}</p>
                </div>
            </div>
        )}
    </div>
  )
}

export default ColorPicker
