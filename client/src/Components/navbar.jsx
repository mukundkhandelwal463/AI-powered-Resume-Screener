import React from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, LayoutDashboard, FileText, Settings } from 'lucide-react';

const Navbar = () => {
  const user = {name: "Ravi", email: "ravi@example.com"}
  const navigate = useNavigate();

  const logoutUser = () => {
    navigate('/');
  }
  return (
    <nav className="w-full px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link to="/app" className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
              <FileText className="text-white size-6" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ResumeBuilder</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-1">
            <Link to="/app" className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <LayoutDashboard className="size-4" />
              <span>Dashboard</span>
            </Link>
            <Link to="/app" className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <FileText className="size-4" />
              <span>My Resumes</span>
            </Link>
            <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Settings className="size-4" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-slate-800 dark:text-slate-200 font-medium">{user.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 flex items-center justify-center border-2 border-white dark:border-slate-800 shadow">
              <User className="text-blue-600 dark:text-blue-400 size-5" />
            </div>
          </div>
          <button 
            onClick={logoutUser} 
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
