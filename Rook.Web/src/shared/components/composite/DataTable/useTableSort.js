import { useMemo, useState } from 'react'

// `rows` sorted per the active column, in the order the caller declared
// them (columns.find), so `sortValue` overrides and default `row[key]`
// lookups both work regardless of any column reordering the person has
// done — sort logic doesn't care about visual column order.
function useTableSort(rows, columns, initialSort) {
  const [sort, setSort] = useState(initialSort)

  function toggleSort(key) {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  }

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

  return { sort, toggleSort, sorted }
}

export { useTableSort }
