import { useId, useImperativeHandle, useState } from 'react'
import { cn } from '@shared/utils/cn.js'
import { Icon } from '@shared/components/primitives/Icon'
import { Button, IconButton } from '@shared/components/composite/Button'
import { HoldToConfirmButton, HoldToConfirmIconButton } from '@shared/components/composite/HoldToConfirmButton'
import { Checkbox } from '@shared/components/composite/Field'
import { ConfirmModal } from '@shared/components/composite/ConfirmModal'
import { Menu } from '@shared/components/composite/Menu'
import { exportTableToExcel } from '@shared/utils/exportToExcel.js'
import { useTableSort } from './useTableSort.js'
import { useRowSelection } from './useRowSelection.js'
import { useColumnLayout } from './useColumnLayout.js'
import { useCellRangeSelection } from './useCellRangeSelection.js'

const DEFAULT_MIN_COL_WIDTH = 100
const SELECT_COL_WIDTH = 50 // 16px left padding + 18px radio/checkbox + 14px right padding, plus a couple to spare
const MENU_COL_WIDTH = 44
const SIDE_ACTIONS_COL_WIDTH = 88

// This component is an orchestrator, not where the logic lives — each of
// sorting, row selection, column layout (order/resize/persistence), and
// cell-range selection (drag-select/copy/highlight-toggle) is its own
// hook file alongside this one. That split exists because this component
// used to be ~850 lines covering ten-plus distinct concerns in one place;
// the public API (this component, one import, one consistent set of
// props) hasn't changed, only how the internals are organized.
//
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
  // Fires once on mount with the initial (possibly persisted) value, and
  // again on every toggle — lets a page mirror this state locally for
  // something like a menu item's label ("Disable"/"Enable cell
  // highlighting"), since the actual state lives inside this component.
  onCellHighlightChange,
  // A ref the caller can use for imperative table actions:
  // resetColumnLayout() and exportToExcel(filename) — both live here
  // rather than as toolbar props/buttons, since where the trigger UI for
  // each one lives (in DataTable's own toolbar vs. a page's own menu
  // next to its search bar) is a per-page layout choice, but the actual
  // logic needs this component's live sorted/ordered rows and columns
  // either way. React 19 accepts `ref` as a plain prop on function
  // components, no forwardRef wrapper needed.
  ref,
}) {
  const instanceId = useId()
  const [pendingDelete, setPendingDelete] = useState(null)

  const { sort, toggleSort, sorted } = useTableSort(rows, columns, initialSort)
  const { selected, toggleRow, allSelected, toggleSelectAll, selectedRows, clearSelection } =
    useRowSelection({ sorted, rowKey, actionsPosition, selectionMode })

  const showSelectCol = actionsPosition === 'top'
  // showActionsMenu takes over the rightmost per-row slot when it's on, so
  // the old side-icons rendering steps aside rather than doubling up.
  const showActionsCol = actionsPosition === 'side' && (showEdit || showDelete) && !showActionsMenu
  const showMenuCol = showActionsMenu
  const fixedColsWidth =
    (showSelectCol ? SELECT_COL_WIDTH : 0) +
    (showMenuCol ? MENU_COL_WIDTH : 0) +
    (showActionsCol ? SIDE_ACTIONS_COL_WIDTH : 0)

  const {
    orderedColumns, computedWidths, tableWidth, scrollRef,
    draggedKey, dropBeforeKey, handleDragStart, handleDragOver, handleDrop, handleDragEnd,
    startResize, resetColumnLayout,
  } = useColumnLayout({ columns, tableId, minColumnWidth, fixedColsWidth })

  const {
    rootRef, cellSelection, setCellSelection, cellHighlightEnabled, toggleCellHighlight,
    startCellSelect, extendCellSelect, cellSelectionClass,
  } = useCellRangeSelection({ tableId, sorted, orderedColumns, scrollRef, onCellHighlightChange })

  useImperativeHandle(ref, () => ({
    resetColumnLayout,
    // Exports whatever's currently visible — respects the live sort and
    // column order, not just the original `columns`/`rows` props — since
    // "export what I'm looking at" is the more useful default than
    // "export the untouched original data".
    exportToExcel(filename) {
      exportTableToExcel(filename ?? tableId ?? 'export', orderedColumns, sorted)
    },
    toggleCellHighlight,
  }), [resetColumnLayout, tableId, orderedColumns, sorted, toggleCellHighlight])

  const showTopBar = actionsPosition === 'top' || showCreate

  function handleDelete(targetRows) {
    onDelete?.(targetRows)
    clearSelection()
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
    <div className="data-table-block" ref={rootRef}>
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
                onClick={clearSelection}
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
          <table className={cn('data-table', !cellHighlightEnabled && 'cell-highlight-disabled')} style={{ width: tableWidth }}>
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
              {sorted.map((row, rowIndex) => {
                const key = rowKey(row)
                const isSelected = selected.has(key)
                return (
                  <tr
                    key={key}
                    className={cn(isSelected && 'is-selected', showSelectCol && 'is-row-clickable')}
                    onClick={showSelectCol ? () => toggleRow(key) : undefined}
                  >
                    {showSelectCol && (
                      <td
                        className="data-table__select-col"
                        onClick={(e) => { e.stopPropagation(); toggleRow(key); setCellSelection(null) }}
                      >
                        {selectionMode === 'multi' ? (
                          <Checkbox checked={isSelected} onChange={() => {}} disabled aria-label="Select row" />
                        ) : (
                          <label className="radio table-radio">
                            <input type="radio" name={`data-table-select-${instanceId}`} checked={isSelected} onChange={() => {}} disabled />
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
                    {orderedColumns.map((col, colIndex) => (
                      <td
                        key={col.key}
                        className={cellSelectionClass(rowIndex, colIndex)}
                        data-row-index={rowIndex}
                        data-col-index={colIndex}
                        style={col.align ? { textAlign: col.align } : undefined}
                        onMouseDown={cellHighlightEnabled ? () => startCellSelect(rowIndex, colIndex) : undefined}
                        onMouseEnter={cellHighlightEnabled ? () => extendCellSelect(rowIndex, colIndex) : undefined}
                      >
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
