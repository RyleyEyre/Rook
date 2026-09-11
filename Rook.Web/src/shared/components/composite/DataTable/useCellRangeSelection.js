import { useEffect, useRef, useState } from 'react'
import { cellText } from '@shared/utils/exportToExcel.js'
import { getTableLayout, saveTableLayout } from '@shared/utils/tableLayoutStorage.js'

// `scrollRef` is owned by useColumnLayout (it needs the same element for
// its own ResizeObserver) and passed in here rather than each hook
// creating its own ref to two different things pointing at the same DOM
// node — this hook only reads its bounding box for auto-scroll, never
// attaches it to anything itself.
function useCellRangeSelection({ tableId, sorted, orderedColumns, scrollRef, onCellHighlightChange }) {
  // Whether drag-to-select-a-cell-range (and its Ctrl/Cmd+C copy) is on
  // at all — lives in the same per-table saved layout as column order/
  // widths (see tableLayoutStorage.js's merge-on-save), rather than a
  // separate storage entry, since it's the same "remembered per tableId"
  // concept. Defaults on; a page's own menu can expose a way to turn it
  // off via the toggleCellHighlight ref method, for anyone who'd rather
  // just get native text selection back.
  const savedLayout = useRef(getTableLayout(tableId)).current
  const [cellHighlightEnabled, setCellHighlightEnabledState] = useState(() => savedLayout?.cellHighlightEnabled ?? true)

  // Excel-style rectangular cell selection + copy. Click-drag across data
  // cells (never the select/menu/side-actions columns — those aren't
  // "data") to select a block, then Ctrl/Cmd+C copies it as tab-separated
  // text, so pasting into an actual spreadsheet reproduces the same grid
  // — replacing the browser's default "just highlights running text
  // across cells, copies it as one flat line" behavior entirely.
  const [cellSelection, setCellSelection] = useState(null) // { anchorRow, anchorCol, endRow, endCol }
  const isSelectingRef = useRef(false)
  const rootRef = useRef(null)

  function setCellHighlightEnabled(next) {
    setCellHighlightEnabledState(next)
    saveTableLayout(tableId, { cellHighlightEnabled: next })
    onCellHighlightChange?.(next)
    if (!next) setCellSelection(null)
  }

  function toggleCellHighlight() {
    setCellHighlightEnabled(!cellHighlightEnabled)
  }

  // Tells a page mirroring this state (e.g. for a menu item's label) what
  // it actually starts as, including whatever was persisted — a page
  // can't know that itself since it lives inside this hook's own
  // seeded-from-storage state.
  useEffect(() => {
    onCellHighlightChange?.(cellHighlightEnabled)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startCellSelect(rowIndex, colIndex) {
    setCellSelection((sel) => {
      const isSameSingleCell = sel
        && sel.anchorRow === rowIndex && sel.anchorCol === colIndex
        && sel.endRow === rowIndex && sel.endCol === colIndex
      if (isSameSingleCell) {
        // Clicking the one cell that's already selected toggles it off —
        // also disarming isSelectingRef so a drag continuing from the
        // same mousedown doesn't immediately re-select; releasing and
        // starting a fresh mousedown elsewhere begins a new selection
        // normally.
        isSelectingRef.current = false
        return null
      }
      isSelectingRef.current = true
      return { anchorRow: rowIndex, anchorCol: colIndex, endRow: rowIndex, endCol: colIndex }
    })
  }
  function extendCellSelect(rowIndex, colIndex) {
    if (!isSelectingRef.current) return
    setCellSelection((sel) => (sel ? { ...sel, endRow: rowIndex, endCol: colIndex } : sel))
  }

  // Auto-scroll while dragging a selection past the table's edge — without
  // this, a table taller/wider than its visible area would be impossible
  // to select all the way to the far end of, since dragging past the
  // visible edge doesn't naturally scroll a container on its own.
  // scrollVelocityRef is the "how fast, which direction" state, updated on
  // every pointer move during a drag; a separate always-running interval
  // is what actually applies it — decoupled like this because scrolling
  // needs to keep happening even while the pointer itself is stationary
  // (held at the edge), which a plain mousemove-driven scroll wouldn't do.
  const scrollVelocityRef = useRef({ dx: 0, dy: 0 })
  const lastPointerRef = useRef({ x: 0, y: 0 })

  function updateAutoScroll(e) {
    lastPointerRef.current = { x: e.clientX, y: e.clientY }
    if (!isSelectingRef.current || !scrollRef.current) {
      scrollVelocityRef.current = { dx: 0, dy: 0 }
      return
    }
    const rect = scrollRef.current.getBoundingClientRect()
    const EDGE = 36
    const MAX_SPEED = 16
    const proximity = (dist) => Math.min(1, (EDGE - dist) / EDGE)

    let dy = 0
    if (e.clientY < rect.top + EDGE) dy = -MAX_SPEED * proximity(e.clientY - rect.top)
    else if (e.clientY > rect.bottom - EDGE) dy = MAX_SPEED * proximity(rect.bottom - e.clientY)

    let dx = 0
    if (e.clientX < rect.left + EDGE) dx = -MAX_SPEED * proximity(e.clientX - rect.left)
    else if (e.clientX > rect.right - EDGE) dx = MAX_SPEED * proximity(rect.right - e.clientX)

    scrollVelocityRef.current = { dx, dy }
  }

  useEffect(() => {
    window.addEventListener('mousemove', updateAutoScroll)
    return () => window.removeEventListener('mousemove', updateAutoScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      const { dx, dy } = scrollVelocityRef.current
      const el = scrollRef.current
      if (!el || (!dx && !dy)) return
      el.scrollTop += dy
      el.scrollLeft += dx
      // The pointer itself isn't moving while held at the edge, so no
      // mouseenter fires on newly-revealed cells — find whatever's now
      // under that stationary point and extend the selection to it
      // manually, same as if the pointer had genuinely dragged there.
      const target = document.elementFromPoint(lastPointerRef.current.x, lastPointerRef.current.y)
      const td = target?.closest('td[data-row-index]')
      if (td) extendCellSelect(Number(td.dataset.rowIndex), Number(td.dataset.colIndex))
    }, 16)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function onMouseUp() {
      isSelectingRef.current = false
      scrollVelocityRef.current = { dx: 0, dy: 0 }
    }
    // Clicking anywhere outside this table clears the selection — mainly
    // so a stray Ctrl+C somewhere else on the page (a different table, a
    // text field) doesn't get silently hijacked by a selection the user
    // has visually moved on from but never technically cleared.
    function onMouseDownOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setCellSelection(null)
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        isSelectingRef.current = false
        setCellSelection(null)
      }
    }
    window.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mousedown', onMouseDownOutside)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mousedown', onMouseDownOutside)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  useEffect(() => {
    function onCopy(e) {
      if (!cellHighlightEnabled || !cellSelection) return
      const minRow = Math.min(cellSelection.anchorRow, cellSelection.endRow)
      const maxRow = Math.max(cellSelection.anchorRow, cellSelection.endRow)
      const minCol = Math.min(cellSelection.anchorCol, cellSelection.endCol)
      const maxCol = Math.max(cellSelection.anchorCol, cellSelection.endCol)
      const lines = []
      for (let r = minRow; r <= maxRow; r++) {
        const row = sorted[r]
        if (!row) continue
        const cells = []
        for (let c = minCol; c <= maxCol; c++) {
          const col = orderedColumns[c]
          if (col) cells.push(cellText(col, row))
        }
        lines.push(cells.join('\t'))
      }
      e.clipboardData.setData('text/plain', lines.join('\n'))
      e.preventDefault()
    }
    document.addEventListener('copy', onCopy)
    return () => document.removeEventListener('copy', onCopy)
  }, [cellSelection, sorted, orderedColumns, cellHighlightEnabled])

  const selectionBounds = cellSelection && {
    minRow: Math.min(cellSelection.anchorRow, cellSelection.endRow),
    maxRow: Math.max(cellSelection.anchorRow, cellSelection.endRow),
    minCol: Math.min(cellSelection.anchorCol, cellSelection.endCol),
    maxCol: Math.max(cellSelection.anchorCol, cellSelection.endCol),
  }

  // The tinted background is still a plain class (composes fine, doesn't
  // affect layout either way) — but the selection-edge lines are computed
  // here as an inline box-shadow rather than border classes. Borders are
  // real layout, and under border-collapse a border on the *outer* edge
  // of the table (the rightmost column has no sibling to collapse into)
  // still adds its own width to the render — which the table's own
  // computed width has no way to know about, since that's worked out
  // purely from column content widths. The result was a real pixel or two
  // of bleed past the table's right edge. box-shadow: inset renders
  // inside the cell's existing box instead, so it can never add width —
  // and building the combined value here means up to four insets (a
  // single selected cell needs all of them at once) compose correctly,
  // which separate CSS classes each setting their own box-shadow
  // couldn't do without a combinatorial set of corner-case rules.
  function cellSelectionStyle(rowIndex, colIndex) {
    if (!selectionBounds) return undefined
    const { minRow, maxRow, minCol, maxCol } = selectionBounds
    if (rowIndex < minRow || rowIndex > maxRow || colIndex < minCol || colIndex > maxCol) return undefined
    const shadows = []
    if (rowIndex === minRow) shadows.push('inset 0 2px 0 0 var(--color-accent)')
    if (rowIndex === maxRow) shadows.push('inset 0 -2px 0 0 var(--color-accent)')
    if (colIndex === minCol) shadows.push('inset 2px 0 0 0 var(--color-accent)')
    if (colIndex === maxCol) shadows.push('inset -2px 0 0 0 var(--color-accent)')
    return shadows.length ? { boxShadow: shadows.join(', ') } : undefined
  }

  function isCellSelected(rowIndex, colIndex) {
    if (!selectionBounds) return false
    const { minRow, maxRow, minCol, maxCol } = selectionBounds
    return rowIndex >= minRow && rowIndex <= maxRow && colIndex >= minCol && colIndex <= maxCol
  }

  return {
    rootRef,
    cellSelection,
    setCellSelection,
    cellHighlightEnabled,
    toggleCellHighlight,
    startCellSelect,
    extendCellSelect,
    isCellSelected,
    cellSelectionStyle,
  }
}

export { useCellRangeSelection }
