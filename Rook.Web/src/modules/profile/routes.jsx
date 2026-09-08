import { lazy } from 'react'

export const profileRoutes = [
  { path: '/profile', Component: lazy(() => import('./pages/ProfilePage/index.js')) },
]
