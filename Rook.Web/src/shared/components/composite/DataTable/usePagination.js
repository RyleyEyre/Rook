import { useEffect, useState } from 'react'
import { getTableLayout, saveTableLayout } from '@shared/utils/tableLayoutStorage.js'

// Two genuinely different modes behind one API, matching the common
// "manualPagination" convention other table libraries use:
//
// - Client (manualPagination: false, the default) — DataTable already has
//   the full dataset in `rows` (like Departments' full, if capped-small,
//   list) and slices it into pages itself. Page/page-size state is
//   self-managed internally — nothing to wire up beyond showPagination.
//   The page-size *preference* (not the current page number — that one's
//   meant to reset, same as it would for any fresh search) persists in
//   the same per-tableId saved layout as column order/widths/cell-
//   highlighting (see tableLayoutStorage.js's merge-on-save), since it's
//   the same "remembered how I like to view this table" concept.
//
// - Server (manualPagination: true) — `rows` is already just the current
//   page's worth (the caller fetched exactly that from a paged endpoint,
//   e.g. a future Logs page). DataTable does no slicing of its own here;
//   it just renders whatever it's given and reports page/page-size
//   changes upward via onPaginationChange so the caller can fetch the
//   next page. page/pageSize/rowCount are then the caller's to own
//   (controlled) — persistence in this mode, if wanted, is the caller's
//   own responsibility too, since DataTable never actually owns that
//   state here to begin with.
function usePagination({
  rows,
  showPagination,
  manualPagination,
  tableId,
  pageSizeOptions,
  defaultPageSize,
  page: controlledPage,
  pageSize: controlledPageSize,
  rowCount: manualRowCount,
  onPaginationChange,
}) {
  const isControlled = controlledPage != null && controlledPageSize != null
  const [internalPage, setInternalPage] = useState(1)
  const [internalPageSize, setInternalPageSize] = useState(
    () => getTableLayout(tableId)?.pageSize ?? defaultPageSize ?? pageSizeOptions[0],
  )

  const page = isControlled ? controlledPage : internalPage
  const pageSize = isControlled ? controlledPageSize : internalPageSize

  // In manual/server mode the caller is the only one who knows the true
  // total (DataTable only ever sees one page of rows at a time there);
  // in client mode it's just however many rows were handed in.
  const rowCount = manualPagination ? (manualRowCount ?? 0) : rows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize))

  function setPage(next) {
    const clamped = Math.min(Math.max(1, next), pageCount)
    if (isControlled) onPaginationChange?.({ page: clamped, pageSize })
    else setInternalPage(clamped)
  }

  function setPageSize(next) {
    // A different page size can easily put the current page out of range
    // (e.g. going from 50/page to 250/page while sitting on page 4) —
    // resetting to page 1 is the same "start over" behavior changing a
    // search query already gets, rather than landing somewhere empty.
    if (isControlled) onPaginationChange?.({ page: 1, pageSize: next })
    else {
      setInternalPageSize(next)
      setInternalPage(1)
      saveTableLayout(tableId, { pageSize: next })
    }
  }

  // If the dataset shrinks (a filter, a delete) such that the page we're
  // sitting on no longer exists, snap back onto the last real page rather
  // than showing an empty page that technically doesn't exist anymore.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCount])

  if (!showPagination) {
    return {
      page: 1, pageSize: rows.length || 1, pageCount: 1, rowCount: rows.length,
      pagedRows: rows, setPage: () => {}, setPageSize: () => {},
    }
  }

  const pagedRows = manualPagination ? rows : rows.slice((page - 1) * pageSize, page * pageSize)

  return { page, pageSize, pageCount, rowCount, pagedRows, setPage, setPageSize }
}

export { usePagination }
