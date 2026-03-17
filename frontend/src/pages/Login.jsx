import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuth'
import { Brain, Mail, Lock, User } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading } = useAuthStore()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    await login(email, password)
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-50 dark:bg-dark-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 mb-4">
            <Brain className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-dark-500 mt-2">Sign in to your ML Dashboard account</p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-10"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? (
              <>
                <span className="spinner w-4 h-4 mr-2" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
          
          <p className="text-center text-sm text-dark-500">
            Don't have an account?{' '}
            <Link to="/signup" className="link">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
