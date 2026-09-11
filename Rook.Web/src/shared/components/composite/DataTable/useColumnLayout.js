import { useEffect, useMemo, useRef, useState } from 'react'
import { clearTableLayout, getTableLayout, saveTableLayout } from '@shared/utils/tableLayoutStorage.js'

const DEFAULT_COL_WIDTH = 160

// Computes actual per-column pixel widths for the <colgroup>, given
// however much space the table currently has to work with (excluding the
// select/menu/side-actions columns, which are fixed and handled by the
// caller). Re-runs any time available width changes (window resize,
// sidebar collapse) so "fill the table" stays true rather than being a
// one-time initial layout — right up until the user resizes anything, at
// which point every column gets pinned (see startResize) and this just
// returns those fixed widths untouched; there's no "flexible" column left
// to redistribute space to any more. If the sum of every column's floor
// (pinned width, or minWidth) already exceeds the available space,
// there's nothing left to give — everyone sits at their floor and the
// table overflows its container, which is exactly what should make the
// horizontal scrollbar appear rather than squeezing columns unreadably
// thin.
function computeColumnWidths({ availableWidth, columns, pinnedWidths, defaultMinWidth }) {
  const specs = columns.map((col) => ({
    key: col.key,
    minWidth: col.minWidth ?? defaultMinWidth,
    weight: col.width ?? DEFAULT_COL_WIDTH,
    pinned: pinnedWidths[col.key],
  }))

  const floorTotal = specs.reduce((sum, s) => sum + (s.pinned ?? s.minWidth), 0)
  if (availableWidth <= floorTotal) {
    return Object.fromEntries(specs.map((s) => [s.key, s.pinned ?? s.minWidth]))
  }

  const flexible = specs.filter((s) => s.pinned == null)

  if (flexible.length === 0) {
    // Every column is pinned (the user has resized at least once) and
    // there's room to spare — rather than leaving a gap of empty table
    // to the right, the last column absorbs it. This only fires when
    // shrinking has left slack; growing a column only ever *reduces* the
    // remaining space, so it can't land here.
    const result = Object.fromEntries(specs.map((s) => [s.key, s.pinned]))
    const total = specs.reduce((sum, s) => sum + s.pinned, 0)
    result[specs[specs.length - 1].key] += availableWidth - total
    return result
  }

  const pinnedTotal = specs.reduce((sum, s) => sum + (s.pinned ?? 0), 0)
  const remaining = availableWidth - pinnedTotal
  const weightTotal = flexible.reduce((sum, s) => sum + s.weight, 0) || 1

  const result = {}
  let flexTotal = 0
  let absorberKey = null
  let absorberShare = -Infinity

  // Rounding each column's share independently (unavoidable — a column
  // can't be 182.4px wide) can land the *sum* a pixel or two off the
  // actual target, in either direction. Track the largest column that
  // still has room above its own floor, so any leftover can be folded
  // into it — that's what makes the columns fill *exactly* to
  // availableWidth instead of a rounding residue tripping the scrollbar
  // on every single render.
  flexible.forEach((s) => {
    const raw = (s.weight / weightTotal) * remaining
    const share = Math.max(s.minWidth, Math.round(raw))
    result[s.key] = share
    flexTotal += share
    if (share > s.minWidth && share > absorberShare) {
      absorberShare = share
      absorberKey = s.key
    }
  })

  const leftover = remaining - flexTotal
  if (leftover !== 0 && absorberKey) {
    const floor = flexible.find((s) => s.key === absorberKey).minWidth
    result[absorberKey] = Math.max(floor, result[absorberKey] + leftover)
  }

  specs.forEach((s) => { if (s.pinned != null) result[s.key] = s.pinned })
  return result
}

// `fixedColsWidth` (the select/menu/side-actions columns' combined width)
// is computed by the caller, not here — it depends on actionsPosition/
// showActionsMenu/showEdit/showDelete, none of which are column-layout
// concerns, they're just numbers this hook needs to know how much of the
// available width is actually up for grabs.
function useColumnLayout({ columns, tableId, minColumnWidth, fixedColsWidth }) {
  // Column order + widths, seeded once from whatever was last saved for
  // this tableId (sessionStorage today — see tableLayoutStorage.js for
  // why it's centralized there). Mirrored into refs alongside state so a
  // resize/reorder gesture can persist "the other piece" (order while
  // resizing, widths while reordering) without stale closures, without
  // needing an effect that would otherwise fire on every drag frame.
  //
  // `columnWidths` only ever holds *manually resized* (pinned) columns —
  // everything else is computed fresh on every render by
  // computeColumnWidths, it never lives in this state at all.
  const savedLayout = useMemo(() => getTableLayout(tableId), [tableId])
  const [columnOrder, setColumnOrderState] = useState(() => savedLayout?.order ?? columns.map((c) => c.key))
  const [columnWidths, setColumnWidthsState] = useState(() => savedLayout?.widths ?? {})
  const orderRef = useRef(columnOrder)
  const widthsRef = useRef(columnWidths)

  function setColumnOrder(next) {
    orderRef.current = next
    setColumnOrderState(next)
  }
  function setColumnWidths(next) {
    widthsRef.current = next
    setColumnWidthsState(next)
  }
  function persistLayout() {
    saveTableLayout(tableId, { order: orderRef.current, widths: widthsRef.current })
  }

  // The caller's `columns` prop stays the source of truth for what
  // columns exist and how — this just reorders them per the saved
  // layout, dropping any saved keys that no longer exist (a column that
  // got removed from the page) and appending any that do exist but
  // weren't in a saved layout yet (a column added after someone already
  // saved a layout, or no layout saved at all).
  const orderedColumns = useMemo(() => {
    const byKey = new Map(columns.map((c) => [c.key, c]))
    const known = columnOrder.filter((key) => byKey.has(key)).map((key) => byKey.get(key))
    const missing = columns.filter((c) => !columnOrder.includes(c.key))
    return [...known, ...missing]
  }, [columns, columnOrder])

  // Tracks how much horizontal room the table actually has, so columns
  // can fill it by default and reflow when that room changes — a plain
  // window-resize listener would miss the sidebar being collapsed, which
  // changes this container's width without the window itself resizing.
  const scrollRef = useRef(null)
  const [availableWidth, setAvailableWidth] = useState(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => setAvailableWidth(entries[0].contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const computedWidths = useMemo(
    () => computeColumnWidths({
      // -1px safety margin: guards against sub-pixel measurement rounding
      // from ResizeObserver itself landing a hair over the real available
      // space, which would trip the scrollbar for no visible reason.
      availableWidth: Math.max(0, availableWidth - fixedColsWidth - 1),
      columns: orderedColumns,
      pinnedWidths: columnWidths,
      defaultMinWidth: minColumnWidth,
    }),
    [availableWidth, fixedColsWidth, orderedColumns, columnWidths, minColumnWidth],
  )

  // Explicit rather than left to `width: auto` to infer from the colgroup
  // — table-layout:fixed's interaction with an auto table width is one of
  // the genuinely inconsistent corners of the table layout spec across
  // engines. Computing the exact total ourselves and setting it directly
  // removes that ambiguity: it matches availableWidth when everything
  // fits, and legitimately exceeds it (forcing the scrollbar) when it's
  // supposed to overflow — never silently squeezed back down by the
  // browser's own idea of what "auto" should do here.
  const tableWidth = fixedColsWidth + orderedColumns.reduce((sum, c) => sum + (computedWidths[c.key] ?? 0), 0)

  function getMinWidth(key) {
    return columns.find((c) => c.key === key)?.minWidth ?? minColumnWidth
  }

  const [draggedKey, setDraggedKey] = useState(null)
  // Where the dragged column would land if dropped right now — the key
  // it would sit *before*, or null meaning "at the very end". Driven by
  // which half of the hovered header the pointer is over, not which
  // column it's over, so this reads as "insert into this gap" rather
  // than "swap with this column".
  const [dropBeforeKey, setDropBeforeKey] = useState(undefined)

  function handleDragStart(e, key) {
    setDraggedKey(key)
    e.dataTransfer.effectAllowed = 'move'
  }
  function handleDragOver(e, col, index) {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const overRightHalf = e.clientX - rect.left > rect.width / 2
    const beforeKey = overRightHalf ? (orderedColumns[index + 1]?.key ?? null) : col.key
    setDropBeforeKey(beforeKey)
  }
  function handleDrop(e) {
    e.preventDefault()
    const beforeKey = dropBeforeKey
    setDropBeforeKey(undefined)
    setDraggedKey(null)
    if (!draggedKey || beforeKey === undefined) return
    const remaining = orderedColumns.map((c) => c.key).filter((k) => k !== draggedKey)
    let insertAt = beforeKey === null ? remaining.length : remaining.indexOf(beforeKey)
    if (insertAt === -1) insertAt = remaining.length
    remaining.splice(insertAt, 0, draggedKey)
    setColumnOrder(remaining)
    persistLayout()
  }
  function handleDragEnd() {
    setDraggedKey(null)
    setDropBeforeKey(undefined)
  }

  function startResize(e, key) {
    e.preventDefault()
    e.stopPropagation() // don't also toggle sort on a sortable header
    const startX = e.clientX

    // The moment ANY resize begins, freeze every column at its current
    // (live, proportionally-filled) width — turning the whole table from
    // "flexible, fills the container" into "fixed, sized by the user"
    // in one shot. Without this, only the dragged column would pin,
    // and the others would keep reflowing to share whatever's left —
    // exactly the sibling-shrinking behavior that shouldn't happen.
    // Widening a column after this should only grow the table's total
    // width (triggering the scrollbar once it exceeds the container),
    // never steal space from a column the user didn't touch. A no-op
    // past the first resize, since every column is already pinned by then.
    const snapshot = { ...widthsRef.current }
    orderedColumns.forEach((col) => {
      if (snapshot[col.key] == null) snapshot[col.key] = computedWidths[col.key]
    })
    setColumnWidths(snapshot)

    const startWidth = snapshot[key]
    const floor = getMinWidth(key)
    let latestWidth = startWidth

    function onMove(moveEvent) {
      latestWidth = Math.max(floor, startWidth + (moveEvent.clientX - startX))
      setColumnWidths({ ...widthsRef.current, [key]: latestWidth })
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      persistLayout()
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // Back to the caller's original column order and the proportional
  // auto-fill widths — same state as a table that's never been touched.
  function resetColumnLayout() {
    setColumnOrder(columns.map((c) => c.key))
    setColumnWidths({})
    clearTableLayout(tableId)
  }

  return {
    orderedColumns,
    computedWidths,
    tableWidth,
    scrollRef,
    draggedKey,
    dropBeforeKey,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    startResize,
    resetColumnLayout,
  }
}

export { useColumnLayout }
