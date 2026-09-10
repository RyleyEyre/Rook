import { useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { cn } from '@shared/utils/cn.js'
import { Icon } from '@shared/components/primitives/Icon'
import { Button, IconButton } from '@shared/components/composite/Button'
import { HoldToConfirmButton, HoldToConfirmIconButton } from '@shared/components/composite/HoldToConfirmButton'
import { Checkbox } from '@shared/components/composite/Field'
import { ConfirmModal } from '@shared/components/composite/ConfirmModal'
import { Menu } from '@shared/components/composite/Menu'
import { clearTableLayout, getTableLayout, saveTableLayout } from '@shared/utils/tableLayoutStorage.js'

const DEFAULT_COL_WIDTH = 160
const DEFAULT_MIN_COL_WIDTH = 100
const SELECT_COL_WIDTH = 40
const MENU_COL_WIDTH = 44
const SIDE_ACTIONS_COL_WIDTH = 88

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

// showActionsMenu: independent of actionsPosition — a compact per-row
// "..." menu (Edit / Delete / whatever's in `rowActions`), replacing the
// per-row icon pair actionsPosition="side" would otherwise render so
// there's never two actions columns competing for the same slot. Can
// combine with actionsPosition="top" (select col + bulk toolbar *and* a
// per-row menu for quick single-row actions).
// rowActions: (row) => [{ key, label, icon?, onClick, variant?, disabled? }]
// getRecordName: (row) => string — only used when menuDeleteMode is
// 'confirm'; feeds ConfirmModal's "type the record's name" flow instead
// of falling back to its generic "type CONFIRM" one.
// menuDeleteMode: 'confirm' opens ConfirmModal (typed text, then hold).
// 'hold' skips the modal — Delete is its own press-and-hold button right
// inside the open menu.

export function DataTable({
  columns,
  rows,
  rowKey = (row) => row.id,
  actionsPosition = 'side',
  selectionMode = 'multi',
  showEdit = true,
  showDelete = true,
  showCreate = false,
  showDeselectAll = true,
  onCreate,
  createLabel = 'Create',
  deleteConfirmSeconds = 2,
  recordLabel = 'record',
  recordLabelPlural,
  onEdit,
  onDelete,
  initialSort = null,
  emptyMessage = 'No records to show.',
  maxHeight = 560,
  showSelectionCount = true,
  showActionsMenu = false,
  rowActions = () => [],
  getRecordName,
  menuDeleteMode = 'confirm',
  // Identifies this table instance for persisted column layout (order +
  // widths) — must be unique across the app, e.g. "departments". Without
  // one, resizing/reordering still works for the session but nothing is
  // saved, since there'd be no safe key to save it under (and no way to
  // avoid two different tables colliding on the same one).
  tableId,
  // Floor for every column, table-wide — below this, a column stops
  // shrinking and the table scrolls horizontally instead. Override per
  // column with `col.minWidth` for one that genuinely needs to be
  // narrower or wider than the rest (e.g. a boolean/icon-only column).
  minColumnWidth = DEFAULT_MIN_COL_WIDTH,
  // Both on by default — set either to false to opt a table out of that
  // one interaction (e.g. a small, fixed-shape table where letting
  // someone drag columns around wouldn't make sense).
  resizableColumns = true,
  reorderableColumns = true,
  // A ref the caller can use for imperative table actions — currently
  // just resetColumnLayout(), for a "reset column widths" menu item
  // living outside this component (e.g. next to a page's search bar).
  // React 19 accepts `ref` as a plain prop on function components, no
  // forwardRef wrapper needed.
  ref,
}) {
  const instanceId = useId()
  const [sort, setSort] = useState(initialSort)
  const [selected, setSelected] = useState(() => new Set())
  const [pendingDelete, setPendingDelete] = useState(null)

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

  useImperativeHandle(ref, () => ({
    // Back to the caller's original column order and the proportional
    // auto-fill widths — same state as a table that's never been touched.
    resetColumnLayout() {
      setColumnOrder(columns.map((c) => c.key))
      setColumnWidths({})
      clearTableLayout(tableId)
    },
  }), [columns, tableId])

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

  const showSelectCol = actionsPosition === 'top'
  // showActionsMenu takes over the rightmost per-row slot when it's on, so
  // the old side-icons rendering steps aside rather than doubling up.
  const showActionsCol = actionsPosition === 'side' && (showEdit || showDelete) && !showActionsMenu
  const showMenuCol = showActionsMenu

  const fixedColsWidth =
    (showSelectCol ? SELECT_COL_WIDTH : 0) +
    (showMenuCol ? MENU_COL_WIDTH : 0) +
    (showActionsCol ? SIDE_ACTIONS_COL_WIDTH : 0)

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

  useEffect(() => {
    setSelected(new Set())
  }, [actionsPosition, selectionMode])

  const sorted = useMemo(() => {
    if (!sort) return rows
    const column = columns.find((c) => c.key === sort.key)
    const getValue = column?.sortValue ?? ((row) => row[sort.key])
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = getValue(a)
      const bv = getValue(b)
      return String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true }) * dir
    })
  }, [rows, sort, columns])

  function toggleSort(key) {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  }

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

  const selectedRows = sorted.filter((row) => selected.has(rowKey(row)))
  const showTopBar = actionsPosition === 'top' || showCreate

  function handleDelete(targetRows) {
    onDelete?.(targetRows)
    setSelected(new Set())
  }

  function requestDelete() {
    if (selectedRows.length > 1) {
      setPendingDelete(selectedRows)
    } else {
      handleDelete(selectedRows)
    }
  }

  // A row menu click can't offer a hold-to-confirm gesture by itself the
  // way the side-icon and toolbar Delete controls do — a click is just a
  // click. So it goes through ConfirmModal instead, which supplies its
  // own hold-to-delete button at the end. deleteConfirmSeconds is still
  // the toggle: 0 means this table's delete is meant to be frictionless
  // everywhere, so skip the modal and delete immediately, same as the
  // plain (non-hold) IconButton/Button used elsewhere when it's 0.
  function requestDeleteFromMenu(row) {
    if (deleteConfirmSeconds <= 0) {
      handleDelete([row])
    } else {
      setPendingDelete([row])
    }
  }

  function buildRowMenuItems(row) {
    const items = []
    if (showEdit) items.push({ key: 'edit', label: 'Edit', icon: 'edit', onClick: () => onEdit?.(row) })

    const extra = rowActions(row)
    if (extra.length > 0) {
      // Dividers on both sides so custom actions read as their own group,
      // separate from Edit above and Delete below — not just more items
      // in the same undifferentiated list.
      if (items.length > 0) items.push({ key: 'divider-before-extra', type: 'divider' })
      items.push(...extra)
    }

    if (showDelete) {
      if (items.length > 0) items.push({ key: 'divider-before-delete', type: 'divider' })
      if (menuDeleteMode === 'hold') {
        items.push({
          key: 'delete',
          type: 'hold',
          label: 'Hold to delete',
          holdingLabel: 'Deleting…',
          doneLabel: 'Deleted',
          holdMs: deleteConfirmSeconds > 0 ? deleteConfirmSeconds * 1000 : 2000,
          onClick: () => handleDelete([row]),
        })
      } else {
        items.push({ key: 'delete', label: 'Delete', icon: 'trash', variant: 'danger', onClick: () => requestDeleteFromMenu(row) })
      }
    }
    return items
  }

  return (
    <div className="data-table-block">
      {showTopBar && (
        <div className="data-table-toolbar">
          <div className="data-table-toolbar__left">
            {showCreate && (
              <Button size="md" icon="plus" onClick={() => onCreate?.()}>{createLabel}</Button>
            )}
            {actionsPosition === 'top' && showSelectionCount && (
              <span className="data-table-toolbar__count">
                {selectedRows.length} selected
              </span>
            )}
            {actionsPosition === 'top' && showDeselectAll && (
              <button
                type="button"
                className="data-table-toolbar__deselect"
                disabled={selectedRows.length === 0}
                onClick={() => setSelected(new Set())}
              >
                Deselect all
              </button>
            )}
          </div>
          <div className="data-table-toolbar__actions">
            {actionsPosition === 'top' && showEdit && (
              <Button
                variant="secondary"
                size="md"
                icon="edit"
                disabled={selectedRows.length !== 1}
                onClick={() => onEdit?.(selectedRows[0])}
              >
                Edit
              </Button>
            )}
            {actionsPosition === 'top' && showDelete && (
              deleteConfirmSeconds > 0 ? (
                <HoldToConfirmButton
                  label="Hold to delete"
                  holdingLabel="Deleting…"
                  doneLabel={selectedRows.length > 1 ? 'Confirm below…' : 'Deleted'}
                  holdMs={deleteConfirmSeconds * 1000}
                  disabled={selectedRows.length === 0}
                  onConfirm={requestDelete}
                />
              ) : (
                <Button
                  variant="danger"
                  size="md"
                  icon="trash"
                  disabled={selectedRows.length === 0}
                  onClick={requestDelete}
                >
                  Delete
                </Button>
              )
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        count={pendingDelete?.length ?? 0}
        recordLabel={recordLabel}
        recordLabelPlural={recordLabelPlural}
        recordName={pendingDelete?.length === 1 ? getRecordName?.(pendingDelete[0]) : undefined}
        holdMs={deleteConfirmSeconds * 1000}
        onConfirm={() => handleDelete(pendingDelete ?? [])}
      />

      <div className="table-wrap">
        <div className="table-scroll" ref={scrollRef} style={{ maxHeight }}>
          <table className="data-table" style={{ width: tableWidth }}>
            <colgroup>
              {showSelectCol && <col style={{ width: SELECT_COL_WIDTH }} />}
              {showMenuCol && <col style={{ width: MENU_COL_WIDTH }} />}
              {orderedColumns.map((col) => (
                <col key={col.key} style={{ width: computedWidths[col.key] }} />
              ))}
              {showActionsCol && <col style={{ width: SIDE_ACTIONS_COL_WIDTH }} />}
            </colgroup>
            <thead>
              <tr>
                {showSelectCol && (
                  <th className="data-table__select-col">
                    {selectionMode === 'multi' && (
                      <Checkbox checked={allSelected} onChange={toggleSelectAll} aria-label="Select all rows" />
                    )}
                  </th>
                )}
                {showMenuCol && <th className="data-table__menu-col" />}
                {orderedColumns.map((col, index) => (
                  <th
                    key={col.key}
                    className={cn(
                      col.sortable && 'is-sortable',
                      sort?.key === col.key && 'is-sorted',
                      draggedKey === col.key && 'is-dragging',
                      dropBeforeKey === col.key && draggedKey !== col.key && 'show-insert-before',
                      dropBeforeKey === null && index === orderedColumns.length - 1 && 'show-insert-after',
                    )}
                    draggable={reorderableColumns}
                    onDragStart={(e) => handleDragStart(e, col.key)}
                    onDragOver={(e) => handleDragOver(e, col, index)}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                    style={col.align ? { textAlign: col.align } : undefined}
                  >
                    <span className="th-inner">
                      <span className="th-label">{col.label}</span>
                      {col.sortable && (
                        <Icon name={sort?.key === col.key ? (sort.dir === 'asc' ? 'sortUp' : 'sortDown') : 'sortBoth'} size={13} />
                      )}
                    </span>
                    {resizableColumns && (
                      <span
                        className="col-resize-handle"
                        draggable={false}
                        onMouseDown={(e) => startResize(e, col.key)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </th>
                ))}
                {showActionsCol && <th style={{ textAlign: 'right' }} />}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const key = rowKey(row)
                const isSelected = selected.has(key)
                return (
                  <tr
                    key={key}
                    className={cn(isSelected && 'is-selected', showSelectCol && 'is-row-clickable')}
                    onClick={showSelectCol ? () => toggleRow(key) : undefined}
                  >
                    {showSelectCol && (
                      <td className="data-table__select-col" onClick={(e) => e.stopPropagation()}>
                        {selectionMode === 'multi' ? (
                          <Checkbox checked={isSelected} onChange={() => toggleRow(key)} aria-label="Select row" />
                        ) : (
                          <label className="radio table-radio">
                            <input type="radio" name={`data-table-select-${instanceId}`} checked={isSelected} onChange={() => toggleRow(key)} />
                            <span className="radio__dot" />
                          </label>
                        )}
                      </td>
                    )}
                    {showMenuCol && (
                      <td className="data-table__menu-col" onClick={(e) => e.stopPropagation()}>
                        <div className="cell-actions">
                          <Menu items={buildRowMenuItems(row)} label="Row actions" align="start" />
                        </div>
                      </td>
                    )}
                    {orderedColumns.map((col) => (
                      <td key={col.key} style={col.align ? { textAlign: col.align } : undefined}>
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                    {showActionsCol && (
                      <td>
                        <div className="cell-actions">
                          {showEdit && <IconButton icon="edit" label="Edit" onClick={() => onEdit?.(row)} />}
                          {showDelete && (
                            deleteConfirmSeconds > 0 ? (
                              <HoldToConfirmIconButton
                                icon="trash"
                                label="Hold to delete"
                                holdMs={deleteConfirmSeconds * 1000}
                                onConfirm={() => handleDelete([row])}
                              />
                            ) : (
                              <IconButton icon="trash" label="Delete" variant="danger" onClick={() => handleDelete([row])} />
                            )
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
          {sorted.length === 0 && (
            <div className="table-empty">
              <p>{emptyMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
