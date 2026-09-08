import { lazy } from 'react'

export const playgroundRoutes = [
  { path: '/kitchen-sink', Component: lazy(() => import('./pages/KitchenSinkPage/index.js')) },
]
