import './ShiftPatternsPage.css'

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApiFetch } from '@services/api/useApiFetch.js'
import { useLiveConnection } from '@services/realtime/useLiveConnection.js'
import { useResilientLoad } from '@services/api/useResilientLoad.js'
import { useToast } from '@app/providers/ToastProvider.jsx'
import { deleteShiftPattern, getShiftPatterns, updateShiftPattern } from '@services/api/shiftPatternsApi.js'
import { WeekSchedule } from '@shared/components/composite/WeekSchedule'
import { Modal } from '@shared/components/composite/Modal'
import { TextInput } from '@shared/components/composite/Field'
import { Button, IconButton } from '@shared/components/composite/Button'
import { HoldToConfirmIconButton } from '@shared/components/composite/HoldToConfirmButton'
import { Banner } from '@shared/components/composite/Banner'
import { Card } from '@shared/components/primitives/Card'
import { formatDate } from '@shared/utils/formatDate.js'
import { Skeleton } from '@shared/components/primitives/Skeleton'
import { Menu } from '@shared/components/composite/Menu'

// Preference-only, page-scoped — not the DataTable layout/tableId
// mechanism (this page doesn't use DataTable), just a plain sessionStorage
// flag so the 12h/24h choice survives page navigation within the session
// without needing a whole new persistence util for one boolean.
const TIME_FORMAT_KEY = 'rook:shift-patterns:time-format'

function getStoredTimeFormat() {
  try {
    const value = sessionStorage.getItem(TIME_FORMAT_KEY)
    return value === '24h' ? '24h' : '12h'
  } catch {
    return '12h'
  }
}

function setStoredTimeFormat(value) {
  try {
    sessionStorage.setItem(TIME_FORMAT_KEY, value)
  } catch {
    // Not worth surfacing — worst case the toggle just doesn't persist.
  }
}

export function ShiftPatternsPage() {
  const apiFetch = useApiFetch()
  const { push } = useToast()
  const navigate = useNavigate()

  const [patterns, setPatterns] = useState(null) // null = still loading
  const [loadError, setLoadError] = useState(null)
  const [query, setQuery] = useState('')
  const [timeFormat, setTimeFormat] = useState(getStoredTimeFormat)

  // Same reasoning as DepartmentsPage's staleBanner — the backend excludes
  // our own connection from its own ShiftPatternListChanged broadcast
  // (GroupExcept, keyed off the X-SignalR-Connection-Id header
  // useApiFetch attaches automatically), so this only ever fires for
  // someone else's change.
  const [staleBanner, setStaleBanner] = useState(false)

  // Rename only — day-by-day editing intentionally isn't exposed here.
  // Shift patterns are meant to be effectively immutable once their
  // schedule is set: if the days need to change, the workflow is create a
  // new pattern, migrate affected employees to it, then delete the old
  // one (which the RECORD_IN_USE check on DELETE already protects against
  // doing accidentally). A pure rename is cheap to support on top of that
  // — it just resends the pattern's existing `days` untouched alongside
  // the new name — so it's kept rather than forcing a full
  // recreate-and-migrate over a typo fix.
  const [renameTarget, setRenameTarget] = useState(null) // pattern | null
  const [renameValue, setRenameValue] = useState('')
  const [renameError, setRenameError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function loadShiftPatterns() {
    try {
      const data = await getShiftPatterns(apiFetch)
      setPatterns(data ?? [])
      setLoadError(null)
    } catch (err) {
      setLoadError(err.message)
      throw err // rethrow — useResilientLoad needs to see the failure to know a retry is due
    }
  }

  const { retryNow } = useResilientLoad(loadShiftPatterns)

  useLiveConnection('ShiftPatternList', {
    ShiftPatternListChanged: () => setStaleBanner(true),
  })

  const filtered = useMemo(() => {
    if (!patterns) return []
    const q = query.trim().toLowerCase()
    if (!q) return patterns
    return patterns.filter((p) => p.name.toLowerCase().includes(q))
  }, [patterns, query])

  async function handleRefresh() {
    setStaleBanner(false)
    retryNow()
  }

  function toggleTimeFormat() {
    const next = timeFormat === '12h' ? '24h' : '12h'
    setTimeFormat(next)
    setStoredTimeFormat(next)
  }

  function openRename(pattern) {
    setRenameTarget(pattern)
    setRenameValue(pattern.name)
    setRenameError(null)
  }

  function closeRename() {
    if (saving) return
    setRenameTarget(null)
  }

  async function submitRename(e) {
    e.preventDefault()
    const name = renameValue.trim()

    if (!name) {
      setRenameError('Name is required.')
      return
    }

    setSaving(true)
    setRenameError(null)

    try {
      // Full replace endpoint — must resend the pattern's existing `days`
      // unchanged, or they'd be wiped by this rename-only save.
      const updated = await updateShiftPattern(apiFetch, renameTarget.id, name, renameTarget.days)
      setPatterns((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
      push({ tone: 'success', title: 'Shift pattern renamed', message: `Saved as ${updated.name}.` })
      setRenameTarget(null)
    } catch (err) {
      if (err.status === 409 && err.problem?.errors?.some((e) => e.code === 'DUPLICATE_VALUE')) {
        setRenameError(err.message)
      } else {
        push({ tone: 'error', title: "Couldn't rename shift pattern", message: err.message })
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(pattern) {
    try {
      await deleteShiftPattern(apiFetch, pattern.id)
      setPatterns((prev) => prev.filter((p) => p.id !== pattern.id))
      push({ tone: 'success', title: 'Shift pattern deleted', message: `${pattern.name} was removed.` })
    } catch (err) {
      push({ tone: 'error', title: "Couldn't delete shift pattern", message: err.message })
      // Rethrown so HoldToConfirmIconButton shows its 'failed' animation
      // (red X, shake) rather than the green success checkmark — same
      // convention DepartmentsPage's delete handling now follows.
      throw err
    }
  }

  return (
    <div className="table-page">
      <div className="table-page__header">
        <div>
          <h1 className="table-page__title">Shift Patterns</h1>
          <p className="table-page__subtitle">
            {patterns ? `${patterns.length} pattern${patterns.length === 1 ? '' : 's'} \u00b7 a day missing from a pattern means not working that day` : 'Loading\u2026'}
          </p>
        </div>
      </div>

      {staleBanner && (
        <div className="table-page__banner-space">
          <Banner tone="info">
            <div className="shift-patterns-page__stale-banner">
              <span>The shift pattern list has changed elsewhere.</span>
              <Button size="sm" variant="secondary" icon="refresh" onClick={handleRefresh}>
                Refresh
              </Button>
            </div>
          </Banner>
        </div>
      )}

      {loadError && (
        <div className="table-page__banner-space">
          <Banner tone="error" title="Couldn't load shift patterns" dismissible onDismiss={() => setLoadError(null)}>
            {loadError}
          </Banner>
        </div>
      )}

      {patterns === null ? (
        <div className="shift-patterns-page__skeleton">
          <Skeleton height={38} />
          <Skeleton height={140} />
          <Skeleton height={140} />
        </div>
      ) : (
        <>
          <div className="table-toolbar">
            <TextInput
              icon="search"
              placeholder="Search shift patterns…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search shift patterns"
            />
            <Menu
              triggerSize={18}
              label="Shift pattern options"
              items={[
                {
                  key: 'refresh',
                  label: 'Refresh list',
                  icon: 'refresh',
                  onClick: async () => {
                    const success = await retryNow()
                    if (success) push({ tone: 'success', title: 'List refreshed' })
                  },
                },
                {
                  key: 'time-format',
                  label: timeFormat === '12h' ? 'Switch to 24-hour time' : 'Switch to 12-hour time',
                  icon: 'clock',
                  onClick: toggleTimeFormat,
                },
              ]}
            />
            <div className="table-toolbar__spacer" />
            {query && (
              <span className="table-toolbar__count">{filtered.length} of {patterns.length}</span>
            )}
          </div>

          <div className="shift-patterns-page__create-row">
            <Button icon="plus" onClick={() => navigate('/shift-patterns/new')}>New shift pattern</Button>
          </div>

          {filtered.length === 0 ? (
            <p className="shift-patterns-page__empty">
              {query ? 'No shift patterns match your search.' : 'No shift patterns yet.'}
            </p>
          ) : (
            <div className="shift-patterns-page__list">
              {filtered.map((pattern) => (
                <Card
                  key={pattern.id}
                  title={pattern.name}
                  description={`${pattern.employeeCount ?? 0} active employee${pattern.employeeCount === 1 ? '' : 's'} on this pattern \u00b7 Created ${formatDate(pattern.createdAt) ?? '\u2014'}`}
                  actions={(
                    <div className="shift-patterns-page__card-actions">
                      <IconButton icon="edit" label={`Rename ${pattern.name}`} onClick={() => openRename(pattern)} />
                      <HoldToConfirmIconButton
                        icon="trash"
                        label={`Delete ${pattern.name}`}
                        onConfirm={() => handleDelete(pattern)}
                      />
                    </div>
                  )}
                >
                  <WeekSchedule days={pattern.days} timeFormat={timeFormat} />
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        open={Boolean(renameTarget)}
        onClose={closeRename}
        title={renameTarget ? `Rename ${renameTarget.name}` : ''}
        footer={(
          <>
            <Button variant="secondary" onClick={closeRename} disabled={saving}>Cancel</Button>
            <Button onClick={submitRename} loading={saving}>Save changes</Button>
          </>
        )}
      >
        <form onSubmit={submitRename}>
          <TextInput
            label="Name"
            value={renameValue}
            onChange={(e) => { setRenameValue(e.target.value); setRenameError(null) }}
            error={renameError}
            autoFocus
            required
          />
        </form>
      </Modal>
    </div>
  )
}
