import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { loginApi, logoutApi } from '../api/auth'
import { ROLE_REDIRECT } from '../utils/constants'

/**
 * useAuth — primary hook for authentication operations
 * Combines Zustand state with API calls and navigation side-effects.
 */
export function useAuth() {
  const navigate = useNavigate()
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login: storeLogin,
    logout: storeLogout,
    setLoading,
    setError,
    clearError,
    hasRole,
    isAdmin,
  } = useAuthStore()

  /**
   * Attempt login with email + password.
   * On success: stores token + user, navigates to role default page.
   * On failure: surfaces error message.
   */
  const login = useCallback(
    async ({ email, password, rememberMe = false }) => {
      setLoading(true)
      clearError()
      try {
        const { user: userData, token: jwt } = await loginApi({ email, password })
        storeLogin(userData, jwt)

        if (rememberMe) {
          localStorage.setItem('helms-remember-email', email)
        } else {
          localStorage.removeItem('helms-remember-email')
        }

        const redirectTo = ROLE_REDIRECT[userData.role] ?? '/dashboard'
        navigate(redirectTo, { replace: true })
      } catch (err) {
        setError(err.message ?? 'Login failed. Please try again.')
      }
    },
    [navigate, storeLogin, setLoading, setError, clearError]
  )

  /**
   * Logout — clears state and redirects to login.
   */
  const logout = useCallback(async () => {
    try {
      await logoutApi()
    } catch {
      // Swallow API errors on logout
    } finally {
      storeLogout()
      navigate('/login', { replace: true })
    }
  }, [storeLogout, navigate])

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
    hasRole,
    isAdmin,
  }
}

export default useAuth
