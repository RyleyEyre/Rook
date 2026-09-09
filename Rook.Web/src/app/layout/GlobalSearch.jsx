import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@shared/utils/cn.js'
import { Icon } from '@shared/components/primitives/Icon'
import { NAV_ITEMS, flattenNavItems } from './nav.js'
import './NavLink.css'
import './GlobalSearch.css'

const PAGES = flattenNavItems(NAV_ITEMS)

export function GlobalSearch({ onFocusSearch }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const navigate = useNavigate()

  // Plain substring match on the label is enough for "dept" → Departments
  // (it's just the first four letters) without needing a fuzzy-match
  // library — sorted so a match at the start of the label (e.g. "emp" on
  // "Employees") ranks above one buried in the middle.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return PAGES
      .map((page) => ({ page, at: page.label.toLowerCase().indexOf(q) }))
      .filter((r) => r.at !== -1)
      .sort((a, b) => a.at - b.at)
      .slice(0, 8)
      .map((r) => r.page)
  }, [query])

  function goTo(page) {
    navigate(page.to)
    setQuery('')
    setOpen(false)
  }

  function onKeyDown(e) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => (i + 1) % results.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => (i - 1 + results.length) % results.length) }
    else if (e.key === 'Enter') { e.preventDefault(); goTo(results[activeIndex]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  const showPanel = open && query.trim().length > 0

  return (
    <div className="global-search">
      <Icon name="search" size={15} className="global-search__icon" />
      <input
        type="text"
        className="global-search__input"
        placeholder="Search pages…"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIndex(0) }}
        onFocus={() => { onFocusSearch?.(); if (query) setOpen(true) }}
        onKeyDown={onKeyDown}
        aria-label="Search pages"
      />

      {showPanel && (
        <>
          <div className="nav-scrim" onClick={() => setOpen(false)} />
          <div className="nav-dropdown__panel nav-dropdown__panel--below global-search__panel" role="listbox">
            {results.length === 0 ? (
              <div className="global-search__empty">No pages match "{query}".</div>
            ) : (
              results.map((page, i) => (
                <button
                  key={page.id}
                  type="button"
                  role="option"
                  aria-selected={i === activeIndex}
                  className={cn('nav-dropdown__item', i === activeIndex && 'is-active')}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goTo(page)}
                >
                  <Icon name={page.icon} size={15} />
                  <span>{page.label}</span>
                  {page.group && <span className="global-search__group">{page.group}</span>}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
