// The clipboard copy feature (rowsToTsv, used by DataTable's cell-range
// selection) stays tab-delimited on purpose — that's the actual
// convention spreadsheet apps expect when pasting a copied grid back in.
// The file export below is CSV instead: more people recognize a .csv than
// a .tsv on sight, even though both are equally "real" formats to Excel.

// A column's `render` can return JSX (e.g. a value wrapped in a Tooltip),
// which isn't something a text export or a clipboard paste can use as-is.
// `col.exportValue(row)` is the escape hatch for that — falls back to the
// raw underlying field when a column doesn't need one.
function cellText(col, row) {
  const value = col.exportValue ? col.exportValue(row) : row[col.key]
  return value == null ? '' : String(value)
}

function rowsToTsv(columns, rows) {
  const header = columns.map((c) => c.label).join('\t')
  const lines = rows.map((row) => columns.map((col) => cellText(col, row)).join('\t'))
  return [header, ...lines].join('\r\n')
}

// Unlike tabs, commas show up in real data all the time (names, notes,
// addresses) — a field containing one has to be quoted per RFC 4180, or
// it silently splits into extra columns on open. Any embedded quote gets
// doubled, standard CSV escaping.
function csvEscape(value) {
  const str = String(value)
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

function rowsToCsv(columns, rows) {
  const header = columns.map((c) => csvEscape(c.label)).join(',')
  const lines = rows.map((row) => columns.map((col) => csvEscape(cellText(col, row))).join(','))
  return [header, ...lines].join('\r\n')
}

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function exportTableToExcel(filename, columns, rows) {
  const base = filename.replace(/\.(xls|xlsx|tsv|csv)$/i, '')
  // Leading BOM so Excel reads the file as UTF-8 rather than guessing
  // Latin-1 and mangling any non-ASCII characters — a well-known Excel+CSV
  // quirk that's otherwise easy to not notice until someone's name has an
  // accent in it.
  downloadTextFile(`${base}.csv`, `\uFEFF${rowsToCsv(columns, rows)}`, 'text/csv;charset=utf-8;')
}

export { cellText, rowsToTsv, exportTableToExcel }
