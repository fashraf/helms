import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import LoadingSpinner from '../components/ui/LoadingSpinner'

/**
 * PrivateRoute — wraps any route that requires authentication.
 *
 * Props:
 *   - children:      JSX to render when authenticated
 *   - roles:         (optional) array of allowed roles e.g. ['admin', 'manager']
 *   - redirectTo:    (optional) override the default /login redirect
 */
export default function PrivateRoute({
  children,
  roles,
  redirectTo = '/login',
}) {
  const { isAuthenticated, user, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-helm-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Not authenticated → send to login, preserve the intended URL
  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    )
  }

  // Role check
  if (roles && roles.length > 0) {
    const userRole = user?.role
    if (!roles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}
