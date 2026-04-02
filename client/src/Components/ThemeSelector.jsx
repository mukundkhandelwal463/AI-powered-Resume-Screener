import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Palette, Check, Sun, Moon, Monitor } from 'lucide-react';

const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { id: 'light', name: 'Light', icon: Sun, color: 'bg-blue-500' },
    { id: 'dark', name: 'Dark', icon: Moon, color: 'bg-gray-700' },
    { id: 'system', name: 'System', icon: Monitor, color: 'bg-gradient-to-r from-blue-500 to-purple-500' },
  ];

  const currentTheme = themes.find(t => t.id === theme) || themes[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
      >
        <Palette size={18} />
        <span className="hidden sm:inline text-sm font-medium">{currentTheme.name} Mode</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-2">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              return (
                <button
                  key={themeOption.id}
                  onClick={() => {
                    setTheme(themeOption.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    theme === themeOption.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{themeOption.name}</span>
                  {theme === themeOption.id && <Check size={16} className="ml-auto text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;