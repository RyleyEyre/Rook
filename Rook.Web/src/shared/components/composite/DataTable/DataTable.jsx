import { useEffect, useId, useMemo, useState } from 'react'
import { cn } from '@shared/utils/cn.js'
import { Icon } from '@shared/components/primitives/Icon'
import { Button, IconButton } from '@shared/components/composite/Button'
import { HoldToConfirmButton, HoldToConfirmIconButton } from '@shared/components/composite/HoldToConfirmButton'
import { Checkbox } from '@shared/components/composite/Field'
import { ConfirmModal } from '@shared/components/composite/ConfirmModal'
import { Menu } from '@shared/components/composite/Menu'

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
  // Independent of actionsPosition — a compact per-row "..." menu (Edit /
  // Delete / whatever else is passed via `rowActions`), rather than either
  // of the two existing per-row-icons / bulk-toolbar layouts. Can be
  // combined with actionsPosition="top" (select col + bulk toolbar *and* a
  // per-row menu for quick single-row actions without selecting first), or
  // used on its own — when it's on, it replaces the old per-row icon pair
  // that actionsPosition="side" would otherwise render, so there's never
  // two actions columns fighting for the same rightmost slot.
  showActionsMenu = false,
  // (row) => [{ key, label, icon?, onClick, variant?: 'danger', disabled? }]
  // Extra items spliced in between Edit and Delete in the row menu — the
  // "arbitrary number of actions" hook. Ignored unless showActionsMenu.
  rowActions = () => [],
  // (row) => string — optional. Only consulted when menuDeleteMode is
  // 'confirm'. When provided, the menu's Delete uses ConfirmModal's "type
  // the record's name, then hold" flow instead of its generic "type
  // CONFIRM" one. Without it, falls back to the generic flow.
  getRecordName,
  // How the row menu's Delete item behaves — two full patterns, not a mix:
  // 'confirm' opens ConfirmModal (typed text, then hold, in a modal) same
  // as before. 'hold' skips the modal entirely — Delete renders as its own
  // press-and-hold fill button right inside the open menu, and finishing
  // the hold deletes immediately, no modal in between.
  menuDeleteMode = 'confirm',
}) {
  const instanceId = useId()
  const [sort, setSort] = useState(initialSort)
  const [selected, setSelected] = useState(() => new Set())
  const [pendingDelete, setPendingDelete] = useState(null)

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
  // showActionsMenu takes over the rightmost per-row slot when it's on, so
  // the old side-icons rendering steps aside rather than doubling up.
  const showActionsCol = actionsPosition === 'side' && (showEdit || showDelete) && !showActionsMenu
  const showMenuCol = showActionsMenu
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
                {showMenuCol && <th className="data-table__menu-col" />}
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
