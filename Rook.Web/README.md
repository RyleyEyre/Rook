# Rook.Web

The real Rook web app — talks to the actual backend (`VITE_API_URL` in `.env`), unlike the `rook-ui` playground this shares its design system with. Follows the same feature-based/vertical-slice folder structure `rook-ui` was built around, so a finished page in the playground drops into this app's matching `modules/*/pages/` slot with minimal changes.

## Run it

```
npm install
npm run dev
```

Needs a running backend at the URL in `.env` (`VITE_API_URL`) to actually sign in — there's no mock layer here, this is the real thing.

## Architecture

```
src/
  app/            the shell: providers, routing, top-level layout
    App.jsx              <Routes> table + the auth-loading gate
    routes.jsx           aggregates every module's routes.jsx into one flat route list
    providers/
      AuthProvider.jsx   real JWT session state — access/refresh tokens, role, profile
      ToastProvider.jsx + .css
    layout/
      AppShell.jsx + .css     layout route: picks Header or Sidebar, renders <Outlet/>
      Header.jsx + .css       top-bar nav (react-router Link/useLocation)
      Sidebar.jsx + .css      left-rail nav
      NavLink.css             the nav-link/dropdown look shared by Header + Sidebar
      nav.js                 NAV_ITEMS, useOpenMenu(), isItemActive()

  shared/         the design-system kit — identical structure to rook-ui's
    components/primitives/   Avatar, Badge, Card, ComingSoon, Icon, ProgressBar, Skeleton, Tabs, Tooltip
    components/composite/    Banner, Button, ConfirmModal, DataTable, Field, HoldToConfirmButton, Modal
    styles/                  tokens/theme/accents + the cross-cutting files (see rook-ui's README for the
                              full per-file rationale — these are the same files, kept in sync by hand)
    utils/                   cn.js, formatName.js

  services/       infrastructure, no JSX — the real backend integration
    api/
      config.js            API_URL / HUB_URL from .env
      authApi.js           login / logout / refreshTokens against the real API
      userApi.js           saveUserProfile
      useApiFetch.js       fetch wrapper that retries once on a 401 after refreshing tokens
    realtime/
      useLiveConnection.js  SignalR hub connection hook — the singleton real-time
                             service the architecture calls for; this is the first
                             place in either project that actually needed one

  modules/        the real features — one folder per business domain
    auth/         pages/LoginPage, routes.jsx, index.js
    employees/    pages/{EmployeeTablePage,DepartmentsPage,ShiftPatternsPage} — currently
                  ComingSoon placeholders, ready to be replaced with rook-ui's finished versions
    settings/     pages/SettingsPage — ComingSoon placeholder
    profile/      pages/ProfilePage — ComingSoon placeholder

  dev/            developer-only tooling, never shipped to production
    playground/   pages/KitchenSinkPage — the shared component reference, gated
                  behind import.meta.env.DEV in both app/routes.jsx and app/layout/nav.js
```

**The one rule that matters:** a module never imports another module's internals. The only things a module may import across that boundary are `@shared/*` and `@services/*`. `app/` is the only place allowed to know about every module at once (`app/routes.jsx`).

**Path aliases** (`vite.config.js`): `@app`, `@shared`, `@services`, `@modules`, `@dev` — same names as `rook-ui`, so a finished component or page moves between the two projects with zero import-path edits.

**Real routing.** Unlike `rook-ui` (which deliberately avoids a router — see its README), this app has real URL-based navigation and protected routes, so it uses `react-router-dom`. Each module's `routes.jsx` still exports `React.lazy()`-loaded pages the same way `rook-ui`'s do; `app/routes.jsx` just flattens them into `{ path, Component }` entries for `App.jsx`'s `<Routes>` instead of a page-id lookup table.

**Placeholder pages.** `EmployeeTablePage`, `DepartmentsPage`, `ShiftPatternsPage`, `SettingsPage`, and `ProfilePage` currently render `shared/components/primitives/ComingSoon` — a one-line "not built yet" stand-in — so every nav item and route resolves to something instead of erroring. The page and file names match `rook-ui`'s finished versions exactly, so building the real page here is a matter of porting that file in and wiring it to real data (`@services/api/*`) instead of the mock in `rook-ui`.

**Login page.** Deliberately simpler than the version in `rook-ui`/`component-export` — no "remember me," no forgot-password link, no demo-credentials footer. Those were reference-app conveniences; this one only has what a real sign-in screen needs (username, password, submit, and the actual error states the real API returns).
