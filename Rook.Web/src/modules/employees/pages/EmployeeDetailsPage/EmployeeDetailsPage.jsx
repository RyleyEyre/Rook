import './EmployeeDetailsPage.css'

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApiFetch } from '@services/api/useApiFetch.js'
import { getEmployeeById, getEmployees } from '@services/api/employeesApi.js'
import { Card } from '@shared/components/primitives/Card'
import { Banner } from '@shared/components/composite/Banner'
import { Skeleton } from '@shared/components/primitives/Skeleton'
import { Tooltip } from '@shared/components/primitives/Tooltip'
import { formatDate, formatDateTime, formatRelativeDate } from '@shared/utils/formatDate.js'

function Field({ label, value }) {
  return (
    <div className="employee-details-page__field">
      <span className="employee-details-page__field-label">{label}</span>
      <span className="employee-details-page__field-value">{value || value === 0 ? value : '\u2014'}</span>
    </div>
  )
}

export function EmployeeDetailsPage() {
  const { userId } = useParams()
  const apiFetch = useApiFetch()
  const navigate = useNavigate()

  // useApiFetch() returns a brand-new function every render (it's not
  // memoized) — so it can never sit in a useEffect dependency array
  // without that effect re-firing on every render it causes, which is
  // exactly the infinite-refetch loop this was doing. useResilientLoad
  // (used elsewhere in this codebase) sidesteps this the same way: keep
  // the latest apiFetch in a ref, updated every render, and never put it
  // in a dependency array — only the thing that should actually trigger
  // a reload (userId) goes there.
  const apiFetchRef = useRef(apiFetch)
  apiFetchRef.current = apiFetch

  const [employee, setEmployee] = useState(null)
  const [loadError, setLoadError] = useState(null)
  // Resolved separately from the detail fetch — GET /api/employees/{id}
  // only returns the manager's raw userId, no name alongside it the way
  // department/shift pattern do. The employee list already has every
  // name paired with a userId, so this reuses that rather than needing
  // any new backend endpoint. Best-effort: falls back to the raw id if
  // the lookup fails or the manager isn't found in it.
  const [managerName, setManagerName] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setEmployee(null)
      setLoadError(null)
      setManagerName(null)
      try {
        const data = await getEmployeeById(apiFetchRef.current, userId)
        if (cancelled) return
        setEmployee(data)
      } catch (err) {
        if (!cancelled) setLoadError(err.message)
      }
    }

    load()
    return () => { cancelled = true }
  }, [userId])

  useEffect(() => {
    if (!employee?.managerId) return
    let cancelled = false

    getEmployees(apiFetchRef.current)
      .then((list) => {
        if (cancelled) return
        const manager = list?.find((e) => e.userId === employee.managerId)
        if (manager) setManagerName(`${manager.firstName ?? ''} ${manager.lastName ?? ''}`.trim())
      })
      .catch(() => {}) // best-effort only — falls back to the raw id below

    return () => { cancelled = true }
  }, [employee?.managerId])

  return (
    <div className="table-page">
      <div className="table-page__header">
        <div>
          <button type="button" className="employee-details-page__back" onClick={() => navigate('/employees')}>
            {'\u2039'} Back to employees
          </button>
          <h1 className="table-page__title">
            {employee ? `${employee.firstName} ${employee.lastName}` : 'Employee'}
          </h1>
          {employee && (
            <p className="table-page__subtitle">
              {employee.role}{employee.departmentName ? ` \u00b7 ${employee.departmentName}` : ''}
            </p>
          )}
        </div>
      </div>

      {loadError && (
        <div className="table-page__banner-space">
          <Banner tone="error" title="Couldn't load this employee">{loadError}</Banner>
        </div>
      )}

      {!employee && !loadError && (
        <div className="employee-details-page__skeleton">
          <Skeleton height={38} />
          <Skeleton height={160} />
          <Skeleton height={160} />
          <Skeleton height={120} />
        </div>
      )}

      {employee && (
        <div className="employee-details-page__grid">
          <Card title="Profile">
            <div className="employee-details-page__fields">
              <Field label="First name" value={employee.firstName} />
              <Field label="Middle name" value={employee.middleName} />
              <Field label="Last name" value={employee.lastName} />
              <Field label="Username" value={employee.username} />
              <Field label="Email" value={employee.email} />
              <Field label="Role" value={employee.role} />
            </div>
          </Card>

          <Card title="Employment">
            <div className="employee-details-page__fields">
              <Field label="Department" value={employee.departmentName} />
              <Field label="Shift pattern" value={employee.shiftPatternName} />
              <Field
                label="Manager"
                value={
                  employee.managerId
                    ? (
                      <button type="button" className="employee-details-page__link" onClick={() => navigate(`/employees/${employee.managerId}`)}>
                        {managerName || employee.managerId}
                      </button>
                    )
                    : null
                }
              />
              <Field label="Start date" value={formatDate(employee.startDate)} />
              {employee.terminationDate && (
                <Field label="Termination date" value={formatDate(employee.terminationDate)} />
              )}
            </div>
          </Card>

          <Card title="System IDs">
            <div className="employee-details-page__fields">
              <Field label="Fusion ID" value={employee.fusionId} />
              <Field label="WCS ID" value={employee.wcsId} />
              <Field label="Voice Console ID" value={employee.voiceConsoleId} />
            </div>
          </Card>

          <Card title="Record info">
            <div className="employee-details-page__fields">
              <Field label="Created" value={formatDate(employee.createdAt)} />
              <Field label="Created by" value={employee.createdBy} />
              <Field
                label="Last edited"
                value={
                  formatRelativeDate(employee.lastEditedAt)
                    ? <Tooltip label={formatDateTime(employee.lastEditedAt)}>{formatRelativeDate(employee.lastEditedAt)}</Tooltip>
                    : null
                }
              />
              <Field label="Last edited by" value={employee.lastEditedBy} />
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
