import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../utils/api'
import toast from 'react-hot-toast'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const response = await authApi.login(email, password)
          const { access_token, refresh_token } = response.data
          
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)
          
          // Fetch user profile
          const userResponse = await authApi.me()
          
          set({ 
            user: userResponse.data, 
            isAuthenticated: true,
            isLoading: false 
          })
          
          toast.success('Welcome back!')
          return true
        } catch (error) {
          set({ isLoading: false })
          toast.error(error.response?.data?.detail || 'Login failed')
          return false
        }
      },
      
      signup: async (email, password, fullName) => {
        set({ isLoading: true })
        try {
          await authApi.signup({ email, password, full_name: fullName })
          toast.success('Account created! Please log in.')
          set({ isLoading: false })
          return true
        } catch (error) {
          set({ isLoading: false })
          toast.error(error.response?.data?.detail || 'Signup failed')
          return false
        }
      },
      
      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, isAuthenticated: false })
        toast.success('Logged out successfully')
      },
      
      checkAuth: async () => {
        const token = localStorage.getItem('access_token')
        if (!token) {
          set({ isAuthenticated: false, user: null })
          return
        }
        
        try {
          const response = await authApi.me()
          set({ user: response.data, isAuthenticated: true })
        } catch (error) {
          set({ isAuthenticated: false, user: null })
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        isAuthenticated: state.isAuthenticated,
        user: state.user 
      }),
    }
  )
)
