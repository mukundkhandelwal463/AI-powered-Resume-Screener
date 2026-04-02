import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon size={20} className="text-slate-600 dark:text-slate-400" />
      ) : (
        <Sun size={20} className="text-amber-400" />
      )}
    </button>
  );
};

export default ThemeToggle;