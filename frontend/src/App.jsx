import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './hooks/useAuth'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Datasets from './pages/Datasets'
import TrainModel from './pages/TrainModel'
import Models from './pages/Models'
import ModelDetail from './pages/ModelDetail'
import Predictions from './pages/Predictions'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Signup from './pages/Signup'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

export default function App() {
  const { isAuthenticated } = useAuthStore()
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <Login />
      } />
      <Route path="/signup" element={
        isAuthenticated ? <Navigate to="/" replace /> : <Signup />
      } />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="datasets" element={<Datasets />} />
        <Route path="train" element={<TrainModel />} />
        <Route path="models" element={<Models />} />
        <Route path="models/:id" element={<ModelDetail />} />
        <Route path="predictions" element={<Predictions />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
