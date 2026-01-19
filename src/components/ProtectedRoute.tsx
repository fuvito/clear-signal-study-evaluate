
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { ProgressSpinner } from 'primereact/progressspinner'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
        <div className="flex justify-content-center align-items-center min-h-screen">
            <ProgressSpinner />
        </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
