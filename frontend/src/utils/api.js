import axios from 'axios'

const BACKEND_URL = 'https://grand-presence-production-42e3.up.railway.app'

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth API
export const authApi = {
  login: (email, password) =>
    api.post('/api/auth/login', new URLSearchParams({ username: email, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).then((res) => {
      localStorage.setItem('access_token', res.data.access_token)
      return res
    }),
  signup: (data) => api.post('/api/auth/signup', data),
  me: () => api.get('/api/auth/me'),
  logout: () => { localStorage.removeItem('access_token') },
}

// Datasets API
export const datasetsApi = {
  list: () => api.get('/api/datasets/'),
  get: (id) => api.get(`/api/datasets/${id}`),
  preview: (id, rows = 10) => api.get(`/api/datasets/${id}/preview?rows=${rows}`),
  upload: (file, name, description) => {
    const form = new FormData()
    form.append('file', file)
    form.append('name', name)
    if (description) form.append('description', description)
    return api.post('/api/datasets/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  delete: (id) => api.delete(`/api/datasets/${id}`),
}

// Models API
export const modelsApi = {
  list: () => api.get('/api/models/'),
  get: (id) => api.get(`/api/models/${id}`),
  metrics: (id) => api.get(`/api/models/${id}/metrics`),
  train: (data) => api.post('/api/models/train', data),
  delete: (id) => api.delete(`/api/models/${id}`),
}

// Predictions API
export const predictionsApi = {
  single: (modelId, data) => api.post(`/api/predictions/${modelId}`, { features: data }),
  batch: (modelId, samples) => api.post(`/api/predictions/${modelId}/batch`, { samples }),
  history: () => api.get('/api/predictions/'),
}

// Billing API
export const billingApi = {
  subscription: () => api.get('/api/billing/subscription'),
  checkout: (plan) => api.post('/api/billing/checkout', { plan }),
  cancel: () => api.post('/api/billing/cancel'),
}

export default api
