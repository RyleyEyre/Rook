import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar.jsx'
import { TopBar } from './TopBar.jsx'
import { useOpenMenu } from './nav.js'
import './AppShell.css'

// Registered in App.jsx as a layout route wrapping the authenticated
// routes. The sidebar is the only page-navigation surface now (see
// nav.js) — the top bar is account/utility-level only (search,
// notifications, profile, logout), never page links.
//
// "Which sidebar submenu is open" is owned here rather than inside
// Sidebar itself, since TopBar's GlobalSearch needs to be able to close
// it too (clicking into search collapses whatever submenu is open) —
// that only works if both components share the same state instead of
// Sidebar keeping it private.
export function AppShell() {
  const nav = useOpenMenu()

  return (
    <div className="layout">
      <Sidebar openId={nav.openId} toggle={nav.toggle} close={nav.close} />
      <div className="layout__main">
        <TopBar onSearchFocus={nav.close} />
        <div className="layout__content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
