import { useEffect, useMemo, useState } from 'react'

// Takes `sorted` (post-sort rows, from useTableSort) rather than raw
// `rows` — selectedRows and the select-all "are all currently visible
// rows selected" check both need to reflect what's actually on screen in
// its current order, not the caller's original array.
function useRowSelection({ sorted, rowKey, actionsPosition, selectionMode }) {
  const [selected, setSelected] = useState(() => new Set())

  // A prior selection can't carry across a mode switch (e.g. 3 rows picked
  // in multi mode are meaningless once you flip to single, or to side-icons
  // where there's no selection concept at all).
  useEffect(() => {
    setSelected(new Set())
  }, [actionsPosition, selectionMode])

  function toggleRow(key) {
    setSelected((prev) => {
      if (selectionMode === 'single') return prev.has(key) ? new Set() : new Set([key])
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const allKeys = useMemo(() => sorted.map(rowKey), [sorted, rowKey])
  const allSelected = allKeys.length > 0 && allKeys.every((k) => selected.has(k))

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(allKeys))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  const selectedRows = sorted.filter((row) => selected.has(rowKey(row)))

  return { selected, toggleRow, allSelected, toggleSelectAll, selectedRows, clearSelection }
}

export { useRowSelection }
