import { API_URL } from './config.js'

// Every endpoint in the API responds with the standard envelope
// { success, message, data } on success, or ProblemDetails
// { status, title, detail, instance, errors? } on failure (see
// Rook-API-Departments-Employees-ShiftPatterns.md). This turns a fetch
// Response into either the unwrapped `data`, or a thrown Error carrying
// the parsed problem so callers can branch on `.status` / `.problem` and
// still have a sensible `.message` to show if they don't.
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

const departmentsUrl = (id) => `${API_URL}/api/departments${id != null ? `/${id}` : ''}`

// apiFetch is the hook returned by useApiFetch() — it already attaches the
// auth header and handles 401-refresh-retry, so these functions stay
// "dumb" the same way authApi.js's do: given an apiFetch, do the request.

export async function getDepartments(apiFetch) {
  const response = await apiFetch(departmentsUrl())
  return unwrap(response)
}

export async function createDepartment(apiFetch, name) {
  const response = await apiFetch(departmentsUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  return unwrap(response)
}

export async function updateDepartment(apiFetch, id, name) {
  const response = await apiFetch(departmentsUrl(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  return unwrap(response)
}

export async function deleteDepartment(apiFetch, id) {
  const response = await apiFetch(departmentsUrl(id), { method: 'DELETE' })
  return unwrap(response)
}