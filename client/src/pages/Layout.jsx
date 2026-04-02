import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../Components/navbar'

const Layout = () => {
  const location = useLocation()
  const isBuilderRoute = location.pathname.includes('/app/builder/')

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800'>
      {!isBuilderRoute && <Navbar />}
      <main className="pb-16">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
