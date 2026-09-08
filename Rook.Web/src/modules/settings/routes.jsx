import { lazy } from 'react'

export const settingsRoutes = [
  { path: '/settings', Component: lazy(() => import('./pages/SettingsPage/index.js')) },
]
