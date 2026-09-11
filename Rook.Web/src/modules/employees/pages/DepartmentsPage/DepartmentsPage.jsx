import './DepartmentsPage.css'

import { useMemo, useState, useRef } from 'react'
import { useApiFetch } from '@services/api/useApiFetch.js'
import { useLiveConnection } from '@services/realtime/useLiveConnection.js'
import { useResilientLoad } from '@services/api/useResilientLoad.js'
import { useToast } from '@app/providers/ToastProvider.jsx'
import { createDepartment, deleteDepartment, getDepartments, updateDepartment } from '@services/api/departmentsApi.js'
import { DataTable } from '@shared/components/composite/DataTable'
import { Modal } from '@shared/components/composite/Modal'
import { TextInput } from '@shared/components/composite/Field'
import { Button } from '@shared/components/composite/Button'
import { Banner } from '@shared/components/composite/Banner'
import { Skeleton } from '@shared/components/primitives/Skeleton'
import { Tooltip } from '@shared/components/primitives/Tooltip'
import { Menu } from '@shared/components/composite/Menu'
import { dateSortValue, formatDate, formatDateForExport, formatDateTime, formatRelativeDate } from '@shared/utils/formatDate.js'

const columns = [
  { key: 'name', label: 'Name', sortable: true, width: 220 },
  {
    key: 'employeeCount',
    label: 'Employees',
    sortable: true,
    align: 'right',
    width: 120,
    render: (row) => row.employeeCount ?? 0,
  },
  {
    key: 'createdAt',
    label: 'Created',
    sortable: true,
    width: 160,
    sortValue: (row) => dateSortValue(row.createdAt),
    exportValue: (row) => formatDateForExport(row.createdAt),
    render: (row) => formatDate(row.createdAt) ?? '—',
  },
  {
    key: 'lastEditedAt',
    label: 'Last Edited',
    sortable: true,
    width: 160,
    sortValue: (row) => dateSortValue(row.lastEditedAt),
    exportValue: (row) => formatDateForExport(row.lastEditedAt),
    render: (row) => {
      const relative = formatRelativeDate(row.lastEditedAt)
      return relative
        ? <Tooltip label={formatDateTime(row.lastEditedAt)}>{relative}</Tooltip>
        : '—'
    },
  },
]

// Keeps the toast readable even in the (currently unreachable, since this
// page's DataTable is selectionMode="single") case of a multi-row delete —
// spelling out a dozen names would just make the toast unreadable.
function formatNameList(names) {
  if (names.length <= 3) return names.join(', ')
  return `${names.slice(0, 3).join(', ')}, and ${names.length - 3} more`
}

export function DepartmentsPage() {
  const apiFetch = useApiFetch()
  const { push } = useToast()

  const [departments, setDepartments] = useState(null) // null = still loading
  const [loadError, setLoadError] = useState(null)
  const [query, setQuery] = useState('')
  const tableRef = useRef(null)
  const [cellHighlightEnabled, setCellHighlightEnabled] = useState(true)

  // The backend now excludes the calling connection from its own
  // ListChanged broadcast (GroupExcept, keyed off the connection id we
  // send on every mutating request — see useApiFetch.js). So if this event
  // fires here, it's genuinely someone else's change, never our own echo —
  // no client-side guessing needed any more.
  const [staleBanner, setStaleBanner] = useState(false)

  const [modal, setModal] = useState(null) // { mode: 'create' | 'edit', department? } | null
  const [formName, setFormName] = useState('')
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function loadDepartments() {
    try {
      const data = await getDepartments(apiFetch)
      setDepartments(data ?? [])
      setLoadError(null)
    } catch (err) {
      setLoadError(err.message)
      throw err // rethrow — useResilientLoad needs to see the failure to know a retry is due
    }
  }

  // Auto-refreshes this page's data the moment the app's shared
  // connection comes back after an outage — no manual action needed. The
  // "been down too long, sign the person out" decision doesn't live here
  // any more; that's useConnectivityWatchdog, called once in App.jsx so
  // it tracks outages across page navigation, not per-page like this used
  // to.
  const { retryNow } = useResilientLoad(loadDepartments)

  useLiveConnection('DepartmentList', {
    ListChanged: () => setStaleBanner(true),
  })

  const filtered = useMemo(() => {
    if (!departments) return []
    const q = query.trim().toLowerCase()
    if (!q) return departments
    return departments.filter((d) => d.name.toLowerCase().includes(q))
  }, [departments, query])

  function openCreate() {
    setModal({ mode: 'create' })
    setFormName('')
    setFormError(null)
  }

  function openEdit(department) {
    setModal({ mode: 'edit', department })
    setFormName(department.name)
    setFormError(null)
  }

  function closeModal() {
    if (saving) return
    setModal(null)
  }

  async function handleRefresh() {
    setStaleBanner(false)
    retryNow()
  }

  async function submitForm(e) {
    e.preventDefault()
    const name = formName.trim()

    if (!name) {
      setFormError('Department name is required.')
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      if (modal.mode === 'create') {
        const created = await createDepartment(apiFetch, name)
        setDepartments((prev) => [...(prev ?? []), created])
        push({ tone: 'success', title: 'Department created', message: `${created.name} has been added.` })
      } else {
        const updated = await updateDepartment(apiFetch, modal.department.id, name)
        setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
        push({ tone: 'success', title: 'Department updated', message: `Saved as ${updated.name}.` })
      }
      setModal(null)
    } catch (err) {
      if (err.status === 409 && err.problem?.errors?.some((e) => e.code === 'DUPLICATE_VALUE')) {
        setFormError(err.message)
      } else {
        push({ tone: 'error', title: `Couldn't ${modal.mode === 'create' ? 'create' : 'update'} department`, message: err.message })
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(rows) {
    const results = await Promise.allSettled(rows.map((row) => deleteDepartment(apiFetch, row.id)))

    const deletedIds = new Set()
    const deletedNames = []
    let firstError = null

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        deletedIds.add(rows[i].id)
        deletedNames.push(rows[i].name)
      } else if (!firstError) {
        firstError = result.reason
      }
    })

    if (deletedIds.size) {
      setDepartments((prev) => prev.filter((d) => !deletedIds.has(d.id)))
      push({
        tone: 'success',
        title: deletedIds.size === 1 ? 'Department deleted' : `${deletedIds.size} departments deleted`,
        message: formatNameList(deletedNames),
      })
    }

    if (firstError) {
      push({ tone: 'error', title: "Couldn't delete department", message: firstError.message })
    }
  }

  return (
    <div className="table-page">
      <div className="table-page__header">
        <div>
          <h1 className="table-page__title">Departments</h1>
          <p className="table-page__subtitle">
            {departments ? `${departments.length} department${departments.length === 1 ? '' : 's'}` : 'Loading…'}
          </p>
        </div>
      </div>

      {staleBanner && (
        <div className="table-page__banner-space">
          <Banner tone="info">
            <div className="departments-page__stale-banner">
              <span>The department list has changed elsewhere.</span>
              <Button size="sm" variant="secondary" icon="refresh" onClick={handleRefresh}>
                Refresh
              </Button>
            </div>
          </Banner>
        </div>
      )}

      {loadError && (
        <div className="table-page__banner-space">
          <Banner tone="error" title="Couldn't load departments" dismissible onDismiss={() => setLoadError(null)}>
            {loadError}
          </Banner>
        </div>
      )}

      {departments === null ? (
        <div className="departments-page__skeleton">
          <Skeleton height={38} />
          <Skeleton height={220} />
        </div>
      ) : (
        <>
          <div className="table-toolbar">
            <TextInput
              icon="search"
              placeholder="Search departments…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search departments"
            />
            <Menu
              triggerSize={18}
              label="Table options"
              items={[
                { key: 'reset-widths', label: 'Reset column widths', icon: 'grid', onClick: () => tableRef.current?.resetColumnLayout() },
                {
                  key: 'refresh',
                  label: 'Refresh table',
                  icon: 'refresh',
                  onClick: async () => {
                    const success = await retryNow()
                    if (success) push({ tone: 'success', title: 'Table refreshed' })
                  },
                },
                { key: 'export', label: 'Export to Excel', icon: 'download', onClick: () => tableRef.current?.exportToExcel('departments') },
                {
                  key: 'toggle-highlight',
                  label: cellHighlightEnabled ? 'Disable cell highlighting' : 'Enable cell highlighting',
                  icon: 'grid',
                  onClick: () => tableRef.current?.toggleCellHighlight(),
                },
              ]}
            />
            <div className="table-toolbar__spacer" />
            {query && (
              <span className="table-toolbar__count">{filtered.length} of {departments.length}</span>
            )}
          </div>

          <DataTable
            ref={tableRef}
            onCellHighlightChange={setCellHighlightEnabled}
            tableId="departments"
            columns={columns}
            rows={filtered}
            actionsPosition="top"
            selectionMode="single"
            showCreate
            showDeselectAll={false}
            showSelectionCount={false}
            showSelected={false}
            createLabel="New Department"
            onCreate={openCreate}
            onEdit={openEdit}
            onDelete={handleDelete}
            recordLabel="department"
            deleteConfirmSeconds={2}
            emptyMessage={query ? 'No departments match your search.' : 'No departments yet.'}
          />
        </>
      )}

      <Modal
        open={Boolean(modal)}
        onClose={closeModal}
        title={modal?.mode === 'create' ? 'New Department' : 'Edit Department'}
        footer={(
          <>
            <Button variant="secondary" onClick={closeModal} disabled={saving}>Cancel</Button>
            <Button onClick={submitForm} loading={saving}>
              {modal?.mode === 'create' ? 'Create' : 'Save changes'}
            </Button>
          </>
        )}
      >
        <form onSubmit={submitForm}>
          <TextInput
            label="Name"
            value={formName}
            onChange={(e) => { setFormName(e.target.value); setFormError(null) }}
            error={formError}
            autoFocus
            required
          />
        </form>
      </Modal>
    </div>
  )
}
