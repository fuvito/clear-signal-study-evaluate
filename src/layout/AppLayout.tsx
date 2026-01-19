
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { Menubar } from 'primereact/menubar'
import { Button } from 'primereact/button'
import { useAuth } from '../context/useAuth'

export default function AppLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const items = [
    {
      label: 'Home',
      icon: 'pi pi-home',
      command: () => navigate('/'),
    },
    {
      label: 'Dashboard',
      icon: 'pi pi-th-large',
      command: () => navigate('/dashboard'),
      visible: !!user
    },
  ]

  const start = <div className="text-xl font-bold text-primary mr-4">Study Evaluate</div>

  const end = user ? (
    <div className="flex align-items-center gap-2">
        <span className="text-sm text-600 mr-2">{user.email}</span>
        <Button label="Sign Out" icon="pi pi-sign-out" size="small" text onClick={() => signOut()} />
    </div>
  ) : (
    location.pathname !== '/login' && (
        <Link to="/login">
            <Button label="Login" icon="pi pi-sign-in" size="small" />
        </Link>
    )
  )

  return (
    <div className="min-h-screen flex flex-column" style={{ backgroundColor: 'var(--surface-ground)' }}>
      <div className="surface-overlay shadow-2 mb-4">
        <div className="max-w-7xl mx-auto">
            <Menubar model={items} start={start} end={end} className="border-none bg-transparent" />
        </div>
      </div>
      <div className="flex-grow-1 px-4">
        <div className="max-w-7xl mx-auto">
            <Outlet />
        </div>
      </div>
      <div className="text-center p-4 text-500 text-sm mt-auto">
        &copy; {new Date().getFullYear()} Clear Signal Study Evaluate
      </div>
    </div>
  )
}
