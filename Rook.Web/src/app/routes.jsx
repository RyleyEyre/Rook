// Aggregates every module's own routes.jsx into one flat list of
// { path, Component } entries for App.jsx's <Routes>. This is the one
// file in the app allowed to know about every module at once —
// individual modules never import each other.
import { LoginPage } from '@modules/auth/index.js'
import { employeesRoutes } from '@modules/employees/index.js'
import { settingsRoutes } from '@modules/settings/index.js'
import { profileRoutes } from '@modules/profile/index.js'

export { LoginPage }

export const appRoutes = [
  ...employeesRoutes,
  ...settingsRoutes,
  ...profileRoutes,
]

// dev/playground isn't a real feature — it's a living reference of the
// shared component kit — so its route is only ever registered in a dev
// build. `import.meta.env.DEV` is statically replaced with `false` in a
// production build, which lets Vite dead-code-eliminate this whole branch
// (including the dynamic import), so dev/playground's page chunk is never
// produced by `vite build` at all, not just unreachable at runtime.
if (import.meta.env.DEV) {
  const { playgroundRoutes } = await import('@dev/playground/index.js')
  appRoutes.push(...playgroundRoutes)
}
