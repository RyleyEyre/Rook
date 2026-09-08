import { lazy } from 'react'

export const employeesRoutes = [
  { path: '/employees', Component: lazy(() => import('./pages/EmployeeTablePage/index.js')) },
  { path: '/departments', Component: lazy(() => import('./pages/DepartmentsPage/index.js')) },
  { path: '/shift-patterns', Component: lazy(() => import('./pages/ShiftPatternsPage/index.js')) },
]
