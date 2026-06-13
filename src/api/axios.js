import axios from 'axios'
import useAuthStore from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request: attach Bearer token ─────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response: handle 401 globally ────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response.data,       // unwrap `.data` for convenience
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.replace('/login')
    }
    const message =
      error.response?.data?.message ??
      error.message ??
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

export default apiClient
