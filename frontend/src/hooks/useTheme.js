import { create } from 'zustand'

export const useThemeStore = create((set, get) => ({
  isDark: localStorage.getItem('theme') === 'dark' || 
          (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches),
  
  toggleTheme: () => {
    const newIsDark = !get().isDark
    set({ isDark: newIsDark })
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
    
    if (newIsDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  },
  
  initTheme: () => {
    const isDark = get().isDark
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  },
}))
