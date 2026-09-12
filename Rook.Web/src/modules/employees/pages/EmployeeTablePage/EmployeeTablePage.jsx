import './EmployeeTablePage.css'

import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApiFetch } from '@services/api/useApiFetch.js'
import { useResilientLoad } from '@services/api/useResilientLoad.js'
import { useToast } from '@app/providers/ToastProvider.jsx'
import { getEmployees } from '@services/api/employeesApi.js'
import { DataTable } from '@shared/components/composite/DataTable'
import { TextInput } from '@shared/components/composite/Field'
import { Banner } from '@shared/components/composite/Banner'
import { Skeleton } from '@shared/components/primitives/Skeleton'
import { Menu } from '@shared/components/composite/Menu'
import { dateSortValue, formatDate, formatDateForExport } from '@shared/utils/formatDate.js'

function fullName(row) {
  return [row.firstName, row.lastName].filter(Boolean).join(' ') || '\u2014'
}

export function EmployeeTablePage() {
  const apiFetch = useApiFetch()
  const { push } = useToast()
  const navigate = useNavigate()

  const [employees, setEmployees] = useState(null) // null = still loading
  const [loadError, setLoadError] = useState(null)
  const [query, setQuery] = useState('')
  const tableRef = useRef(null)
  const [cellHighlightEnabled, setCellHighlightEnabled] = useState(true)

  // No real-time wiring for Employees yet (unlike Departments/Shift
  // Patterns) — plain fetch-on-load/fetch-on-action for now.
  async function loadEmployees() {
    try {
      const data = await getEmployees(apiFetch)
      setEmployees(data ?? [])
      setLoadError(null)
    } catch (err) {
      setLoadError(err.message)
      throw err // rethrow — useResilientLoad needs to see the failure to know a retry is due
    }
  }

  const { retryNow } = useResilientLoad(loadEmployees)

  const filtered = useMemo(() => {
    if (!employees) return []
    const q = query.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((e) => fullName(e).toLowerCase().includes(q) || (e.departmentName ?? '').toLowerCase().includes(q))
  }, [employees, query])

  function goToProfile(row) {
    navigate(`/employees/${row.userId}`)
  }

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      width: 220,
      sortValue: (row) => `${row.lastName ?? ''} ${row.firstName ?? ''}`.trim().toLowerCase(),
      render: (row) => fullName(row),
      // Double-click the name to drill in — the row menu's "View
      // profile" (below) is the other way in, since this table also
      // needs plain single-click free for bulk selection.
      drillTo: goToProfile,
    },
    {
      key: 'departmentName',
      label: 'Department',
      sortable: true,
      width: 180,
      render: (row) => row.departmentName ?? '\u2014',
    },
    {
      key: 'shiftPatternName',
      label: 'Shift Pattern',
      sortable: true,
      width: 160,
      render: (row) => row.shiftPatternName ?? '\u2014',
    },
    {
      key: 'startDate',
      label: 'Start Date',
      sortable: true,
      width: 150,
      sortValue: (row) => dateSortValue(row.startDate),
      exportValue: (row) => formatDateForExport(row.startDate),
      render: (row) => formatDate(row.startDate) ?? '\u2014',
    },
  ], []) // eslint-disable-line react-hooks/exhaustive-deps -- goToProfile is stable across renders (only depends on the navigate hook's own stable reference)

  return (
    <div className="table-page">
      <div className="table-page__header">
        <div>
          <h1 className="table-page__title">Employees</h1>
          <p className="table-page__subtitle">
            {employees ? `${employees.length} employee${employees.length === 1 ? '' : 's'}` : 'Loading\u2026'}
          </p>
        </div>
      </div>

      {loadError && (
        <div className="table-page__banner-space">
          <Banner tone="error" title="Couldn't load employees" dismissible onDismiss={() => setLoadError(null)}>
            {loadError}
          </Banner>
        </div>
      )}

      {employees === null ? (
        <div className="employee-table-page__skeleton">
          <Skeleton height={38} />
          <Skeleton height={320} />
        </div>
      ) : (
        <>
          <div className="table-toolbar">
            <TextInput
              icon="search"
              placeholder="Search employees…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search employees"
            />
            <Menu
              triggerSize={18}
              label="Table options"
              items={[
                { key: 'reset-widths', label: 'Reset column widths', icon: 'gear', onClick: () => tableRef.current?.resetColumnLayout() },
                {
                  key: 'refresh',
                  label: 'Refresh table',
                  icon: 'refresh',
                  onClick: async () => {
                    const success = await retryNow()
                    if (success) push({ tone: 'success', title: 'Table refreshed' })
                  },
                },
                { key: 'export', label: 'Export to Excel', icon: 'download', onClick: () => tableRef.current?.exportToExcel('employees') },
                {
                  key: 'toggle-highlight',
                  label: cellHighlightEnabled ? 'Disable cell highlighting' : 'Enable cell highlighting',
                  icon: 'gear',
                  onClick: () => tableRef.current?.toggleCellHighlight(),
                },
              ]}
            />
            <div className="table-toolbar__spacer" />
            {query && (
              <span className="table-toolbar__count">{filtered.length} of {employees.length}</span>
            )}
          </div>

          <DataTable
            ref={tableRef}
            onCellHighlightChange={setCellHighlightEnabled}
            tableId="employees"
            columns={columns}
            rows={filtered}
            rowKey={(row) => row.userId}
            actionsPosition="top"
            selectionMode="multi"
            showEdit={false}
            showDelete={false}
            // No bulk actions wired yet (bulk-assign department/shift
            // pattern etc. are coming later) — selection UI is on so
            // it's ready for them, it just has nothing to do yet.
            showActionsMenu
            rowActions={(row) => [
              { key: 'view', label: 'View profile', icon: 'chevronRight', onClick: () => goToProfile(row) },
            ]}
            rowFlag={(row) => !row.isProfileComplete && 'Profile incomplete'}
            recordLabel="employee"
            emptyMessage={query ? 'No employees match your search.' : 'No employees yet.'}
            showPagination
            pageSizeOptions={[50, 100, 250, 500]}
          />
        </>
      )}
    </div>
  )
}
