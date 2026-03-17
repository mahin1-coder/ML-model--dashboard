import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '../hooks/useAuth'
import { useThemeStore } from '../hooks/useTheme'
import { 
  LayoutDashboard, 
  Database, 
  Brain, 
  LineChart, 
  Settings, 
  LogOut,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Datasets', href: '/datasets', icon: Database },
  { name: 'Train Model', href: '/train', icon: Brain },
  { name: 'Models', href: '/models', icon: LineChart },
  { name: 'Predictions', href: '/predictions', icon: LineChart },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const { isDark, toggleTheme, initTheme } = useThemeStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  useEffect(() => {
    initTheme()
  }, [initTheme])
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-dark-900 border-r border-dark-200 dark:border-dark-700 transform transition-transform duration-200 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-dark-200 dark:border-dark-700">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold">ML Dashboard</span>
            </div>
            <button 
              className="lg:hidden p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400"
                    : "text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
          
          {/* User section */}
          <div className="p-4 border-t border-dark-200 dark:border-dark-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-semibold">
                  {user?.full_name?.[0] || user?.email?.[0] || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-xs text-dark-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={toggleTheme}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 btn-outline flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-dark-900/80 backdrop-blur border-b border-dark-200 dark:border-dark-700">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <button 
              className="lg:hidden p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex-1" />
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-dark-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
