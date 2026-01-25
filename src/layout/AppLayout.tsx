
import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { Menubar } from 'primereact/menubar'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { useAuth } from '../context/useAuth'
import pkg from '../../package.json'

export default function AppLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [aboutVisible, setAboutVisible] = useState(false)

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
    {
      label: 'Report Card',
      icon: 'pi pi-chart-bar',
      command: () => navigate('/report-card'),
      visible: !!user
    },
  ]

  const start = <div className="text-xl font-bold text-700 mr-4">Study Evaluate</div>

  const end = (
    <div className="flex align-items-center gap-2">
      <Button 
        icon="pi pi-info-circle" 
        rounded 
        text 
        severity="secondary" 
        aria-label="About" 
        onClick={() => setAboutVisible(true)}
        className="text-600 hover:bg-gray-100"
      />
      {user ? (
        <>
            <span className="text-sm text-600 mr-2">{user.email}</span>
            <Button label="Sign Out" icon="pi pi-sign-out" size="small" text onClick={() => signOut()} className="text-purple-600 hover:bg-purple-50 font-bold" />
        </>
      ) : (
        location.pathname !== '/login' && (
            <Link to="/login">
                <Button label="Login" icon="pi pi-sign-in" size="small" className="bg-primary border-none hover:bg-indigo-400 font-bold" />
            </Link>
        )
      )}
    </div>
  )

  return (
    <div className="min-h-screen flex flex-column">
      <div className="bg-white-alpha-80 backdrop-blur-md sticky top-0 z-5 shadow-1 mb-4" style={{ backdropFilter: 'blur(10px)' }}>
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

      <Dialog 
        header="About Study Evaluate" 
        visible={aboutVisible} 
        style={{ width: '30vw' }} 
        breakpoints={{ '960px': '75vw', '641px': '90vw' }} 
        onHide={() => setAboutVisible(false)}
        draggable={false}
        resizable={false}
      >
        <div className="flex flex-column align-items-center text-center p-4">
            <div className="bg-purple-50 border-circle w-4rem h-4rem flex align-items-center justify-content-center mb-3">
                <i className="pi pi-book text-3xl text-purple-500"></i>
            </div>
            <h2 className="text-xl font-bold m-0 mb-2 text-800">{pkg.name}</h2>
            <p className="text-500 m-0 mb-4">Version {pkg.version}</p>
            <p className="text-sm text-600 m-0 line-height-3">
                A comprehensive study evaluation tool powered by AI.
            </p>
        </div>
      </Dialog>
    </div>
  )
}
