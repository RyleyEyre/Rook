const STORAGE_PREFIX = 'rook:datatable-layout:'

// { order: string[], widths: Record<string, number>, cellHighlightEnabled?: boolean } | null
function getTableLayout(tableId) {
  if (!tableId) return null
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + tableId)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Merges `partial` into whatever's already saved rather than overwriting
// the whole entry — column order/width (useColumnLayout) and
// cell-highlight-enabled (useCellRangeSelection) share this one saved
// entry per tableId but are now two independent hooks, neither of which
// knows the other's current value. A plain overwrite would mean whichever
// hook saves second wins outright, silently discarding the other's last
// change. Merging lets each hook save just the field(s) it owns.
function saveTableLayout(tableId, partial) {
  if (!tableId) return
  try {
    const existing = getTableLayout(tableId) ?? {}
    sessionStorage.setItem(STORAGE_PREFIX + tableId, JSON.stringify({ ...existing, ...partial }))
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
