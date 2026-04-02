import React from 'react';
import { Type } from 'lucide-react';

const FontSizePicker = ({ selectedSize = 'base', onChange }) => {
    const sizes = [
        { id: 'sm', label: 'Small', scale: 0.9 },
        { id: 'base', label: 'Medium', scale: 1.0 },
        { id: 'lg', label: 'Large', scale: 1.1 }
    ];

    return (
        <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-300">
                <Type size={16} />
                <span className="hidden sm:inline">Size: {sizes.find(s => s.id === selectedSize)?.label || 'Medium'}</span>
            </button>
            <div className="absolute top-full right-0 mt-2 w-32 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] flex flex-col gap-1">
                {sizes.map((size) => (
                    <button
                        key={size.id}
                        onClick={() => onChange(size.id)}
                        className={`px-3 py-2 text-sm text-left rounded-md transition-colors ${selectedSize === size.id ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-slate-50 text-slate-700'}`}
                    >
                        {size.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FontSizePicker;
