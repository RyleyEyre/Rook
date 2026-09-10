const STORAGE_PREFIX = 'rook:datatable-layout:'

// { order: string[], widths: Record<string, number> } | null
function getTableLayout(tableId) {
  if (!tableId) return null
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + tableId)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveTableLayout(tableId, layout) {
  if (!tableId) return
  try {
    sessionStorage.setItem(STORAGE_PREFIX + tableId, JSON.stringify(layout))
  } catch {
    // sessionStorage can throw (quota, private-browsing edge cases) —
    // losing a saved column layout isn't worth surfacing an error over.
  }
}

function clearTableLayout(tableId) {
  if (!tableId) return
  try {
    sessionStorage.removeItem(STORAGE_PREFIX + tableId)
  } catch {
    // Same reasoning as saveTableLayout — not worth surfacing.
  }
}

export { getTableLayout, saveTableLayout, clearTableLayout }
