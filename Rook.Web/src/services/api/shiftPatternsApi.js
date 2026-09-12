import { API_URL } from './config.js'

// Same envelope-unwrapping convention as departmentsApi.js — each API
// service file keeps its own copy of this rather than sharing one, since
// there's nothing here that varies per-entity anyway and it keeps each
// file readable on its own.
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

const shiftPatternsUrl = (id) => `${API_URL}/api/shift-patterns${id != null ? `/${id}` : ''}`

// apiFetch is the hook returned by useApiFetch() — already attaches the
// auth header, the X-SignalR-Connection-Id header, and handles the
// 401-refresh-retry, so these stay "dumb" the same way departmentsApi.js's
// do: given an apiFetch, do the request.

export async function getShiftPatterns(apiFetch) {
  const response = await apiFetch(shiftPatternsUrl())
  return unwrap(response)
}

// `days`: [{ dayOfWeek, startTime, endTime }] — pass the full array every
// time. The API replaces `days` wholesale on both create and update;
// there's no partial "just this day" endpoint (see PUT below).
export async function createShiftPattern(apiFetch, name, days) {
  const response = await apiFetch(shiftPatternsUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, days }),
  })
  return unwrap(response)
}

// Full replace of `days` — the caller MUST pass the complete day list it
// wants to end up with, not just the days that changed. A rename-only
// call still needs to resend the pattern's existing `days` unchanged, or
// they'll be wiped.
export async function updateShiftPattern(apiFetch, id, name, days) {
  const response = await apiFetch(shiftPatternsUrl(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, days }),
  })
  return unwrap(response)
}

export async function deleteShiftPattern(apiFetch, id) {
  const response = await apiFetch(shiftPatternsUrl(id), { method: 'DELETE' })
  return unwrap(response)
}
