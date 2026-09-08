import { useEffect, useId, useMemo, useState } from 'react'
import { cn } from '@shared/utils/cn.js'
import { Icon } from '@shared/components/primitives/Icon'
import { Button, IconButton } from '@shared/components/composite/Button'
import { HoldToConfirmButton, HoldToConfirmIconButton } from '@shared/components/composite/HoldToConfirmButton'
import { Checkbox } from '@shared/components/composite/Field'
import { ConfirmModal } from '@shared/components/composite/ConfirmModal'

/**
 * Generic searchable/sortable/scrollable table, extracted from the Employee
 * Table so any page can reuse the same look with its own columns and data.
 *
 * Configurable per the brief:
 * - `actionsPosition`: 'side' (per-row Edit/Delete icons, like the Employee
 *   Table) or 'top' (a select column on each row + a toolbar above the
 *   table with bulk Edit/Delete icons).
 * - `selectionMode`: 'single' | 'multi' — only meaningful when
 *   actionsPosition is 'top'. 'single' renders a radio dot per row (native
 *   radio-group semantics enforce single selection); 'multi' renders
 *   checkboxes plus a "select all" checkbox in the header.
 * - `showEdit` / `showDelete`: independently show or hide each action —
 *   e.g. a read-only-but-deletable table, or an editable one nobody may
 *   delete from. Applies to both the side icons and the top toolbar.
 * - `showCreate` / `onCreate` / `createLabel`: an optional "+ Create"
 *   button in the same bar as the top toolbar (or its own slim bar, if
 *   actionsPosition is 'side' and there's no toolbar otherwise).
 * - `showDeselectAll`: a "Deselect all" control next to the selection
 *   count. It's also the only way to clear a 'single' selection — a native
 *   radio doesn't fire a change event when you click the one that's
 *   already checked, so without this there'd be no way to get back to
 *   "nothing selected" once you'd picked a row.
 * - `deleteConfirmSeconds`: how long Delete must be held before it fires.
 *   0 means an instant, un-confirmed delete on a single click — anything
 *   above 0 renders the press-and-hold fill button for that many seconds.
 *   The top toolbar's Delete control always looks the same regardless of
 *   selection count (no layout jump between "Hold to delete" and a plain
 *   button) — but completing it with more than one row selected doesn't
 *   delete anything yet. It opens `ConfirmModal` instead, which asks the
 *   user to type CONFIRM (not hold again — that already happened) before
 *   the actual delete, naming the exact count and record type
 *   (`recordLabel`/`recordLabelPlural`). A single row's delete never goes
 *   through the modal.
 *
 * Filtering/searching is left to the caller (pass in already-filtered
 * `rows`) since what fields to search is domain-specific; sorting is
 * handled internally since it only needs a key + optional comparator.
 */
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
}) {
  const instanceId = useId()
  const [sort, setSort] = useState(initialSort)
  const [selected, setSelected] = useState(() => new Set())
  // Snapshot of the rows a bulk delete was requested for, frozen at the
  // moment the modal opens — the modal stays open ~700ms after confirming
  // (to show the hold button's checkmark) while `selected` clears
  // immediately, so binding the modal to the live selection would flicker
  // its count to 0 mid-animation.
  const [pendingDelete, setPendingDelete] = useState(null)

  // A prior selection can't carry across a mode switch (e.g. 3 rows picked
  // in multi mode are meaningless once you flip to single, or to side-icons
  // where there's no selection concept at all).
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
  const showSelectCol = actionsPosition === 'top'
  const showActionsCol = actionsPosition === 'side' && (showEdit || showDelete)
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

  return (
    <div className="data-table-block">
      {showTopBar && (
        <div className="data-table-toolbar">
          {actionsPosition === 'top' ? (
            <div className="data-table-toolbar__left">
              <span className="data-table-toolbar__count">{selectedRows.length} selected</span>
              {showDeselectAll && (
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
          ) : <div className="data-table-toolbar__left" />}
          <div className="data-table-toolbar__actions">
            {showCreate && (
              <Button size="sm" icon="plus" onClick={() => onCreate?.()}>{createLabel}</Button>
            )}
            {actionsPosition === 'top' && showEdit && (
              <Button
                variant="secondary"
                size="sm"
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
                  size="sm"
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
        onConfirm={() => handleDelete(pendingDelete ?? [])}
      />

      <div className="table-wrap">
        <div className="table-scroll" style={{ maxHeight }}>
          <table className="data-table">
            <thead>
              <tr>
                {showSelectCol && (
                  <th className="data-table__select-col">
                    {selectionMode === 'multi' && (
                      <Checkbox checked={allSelected} onChange={toggleSelectAll} aria-label="Select all rows" />
                    )}
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(col.sortable && 'is-sortable', sort?.key === col.key && 'is-sorted')}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                    style={col.align ? { textAlign: col.align } : undefined}
                  >
                    <span className="th-inner">
                      {col.label}
                      {col.sortable && (
                        <Icon name={sort?.key === col.key ? (sort.dir === 'asc' ? 'sortUp' : 'sortDown') : 'sortBoth'} size={13} />
                      )}
                    </span>
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
                  <tr key={key} className={isSelected ? 'is-selected' : ''}>
                    {showSelectCol && (
                      <td className="data-table__select-col">
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
                    {columns.map((col) => (
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
