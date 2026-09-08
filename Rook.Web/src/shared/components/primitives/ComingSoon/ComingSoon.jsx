// Stand-in for a real page that hasn't been built yet — keeps every
// route/nav item resolving to something rather than erroring, so
// navigation can be wired and tested piece by piece rather than all at
// once. Used across employees/settings/profile, which is why it lives in
// shared/ rather than any one module's folder.
export function ComingSoon({ label }) {
  return (
    <div className="table-page">
      <div className="table-page__header">
        <div>
          <h1 className="table-page__title">{label}</h1>
          <p className="table-page__subtitle">This page hasn't been built yet.</p>
        </div>
      </div>
    </div>
  )
}
