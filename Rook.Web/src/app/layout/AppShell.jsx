import { Outlet } from 'react-router-dom'
import { cn } from '@shared/utils/cn.js'
import { Header } from './Header.jsx'
import { Sidebar } from './Sidebar.jsx'
import './AppShell.css'

// Registered in App.jsx as a layout route wrapping the authenticated
// routes — renders the chosen nav style plus whichever child route
// matched, via <Outlet />.
export function AppShell({ layout = 'top' }) {
  const Nav = layout === 'top' ? Header : Sidebar
  return (
    <div className={cn('layout', `layout--${layout}`)}>
      <Nav />
      <div className="layout__content">
        <Outlet />
      </div>
    </div>
  )
}
