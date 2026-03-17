import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuth'
import { Brain, Mail, Lock, User } from 'lucide-react'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const { signup, isLoading } = useAuthStore()
  const navigate = useNavigate()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await signup(email, password, fullName)
    if (success) {
      navigate('/login')
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-50 dark:bg-dark-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 mb-4">
            <Brain className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-dark-500 mt-2">Start training ML models in minutes</p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          <div>
            <label htmlFor="fullName" className="label">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input pl-10"
                placeholder="Enter your name"
              />
            </div>
          </div>
          
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
                placeholder="Create a password (min 8 characters)"
                required
                minLength={8}
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
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
          
          <p className="text-center text-sm text-dark-500">
            Already have an account?{' '}
            <Link to="/login" className="link">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
