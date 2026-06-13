/**
 * Auth API Layer
 * Currently uses mock handlers.
 * To switch to real API: replace mockLogin with apiClient.post(...)
 */
import apiClient from './axios'
import { mockLogin, mockGetMe } from './mock/handlers'
import { API_ENDPOINTS } from '../utils/constants'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

/**
 * Login with email + password
 * Returns { user, token, expiresIn }
 */
export const loginApi = async (credentials) => {
  if (USE_MOCK) {
    return mockLogin(credentials)
  }
  return apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
}

/**
 * Get current authenticated user
 */
export const getMeApi = async (token) => {
  if (USE_MOCK) {
    return mockGetMe(token)
  }
  return apiClient.get(API_ENDPOINTS.AUTH.ME)
}

/**
 * Logout — invalidate server-side session if applicable
 */
export const logoutApi = async () => {
  if (USE_MOCK) {
    return { success: true }
  }
  return apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
}
