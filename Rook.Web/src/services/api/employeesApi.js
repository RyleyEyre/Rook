import { API_URL } from './config.js'

// Same envelope-unwrapping convention as departmentsApi.js/shiftPatternsApi.js
// — each API service file keeps its own copy rather than sharing one.
async function unwrap(response) {
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(
      body?.errors?.[0]?.message || body?.detail || body?.title || 'Something went wrong.'
    )
    error.status = response.status
    error.problem = body
    throw error
  }

  return body?.data ?? null
}

const employeesUrl = (id) => `${API_URL}/api/employees${id != null ? `/${id}` : ''}`

// apiFetch is the hook returned by useApiFetch() — already attaches the
// auth header, so these stay "dumb" the same way the other API files do.

// Lean summary shape — { userId, firstName, lastName, departmentName,
// shiftPatternName, startDate, isProfileComplete, createdAt, lastEditedAt }.
// No pagination/server-side search — the whole list comes back (capped at
// ~500 rows by design), same as Departments/Shift Patterns.
export async function getEmployees(apiFetch) {
  const response = await apiFetch(employeesUrl())
  return unwrap(response)
}

// Full detail shape — everything the summary has, plus username, email,
// middleName, role, departmentId, shiftPatternId, managerId, fusionId,
// wcsId, voiceConsoleId, terminationDate, createdBy, lastEditedBy.
// Read-only for now — no create/update/delete here yet.
export async function getEmployeeById(apiFetch, userId) {
  const response = await apiFetch(employeesUrl(userId))
  return unwrap(response)
}
