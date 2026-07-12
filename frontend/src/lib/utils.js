import { clsx } from 'clsx';

export const cn = (...args) => clsx(args);

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export const fmtNum = (n) => new Intl.NumberFormat('en').format(Math.round(n || 0));

/** Download an array of objects as a CSV file (Tier-1 export, no dependency). */
export function downloadCSV(rows, filename = 'export.csv') {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Download rows as an .xlsx file (lazy-loads SheetJS to keep the main bundle small). */
export async function downloadExcel(rows, filename = 'export.xlsx') {
  if (!rows?.length) return;
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, filename);
}

/** Download rows as a PDF table (lazy-loads jsPDF + autotable). */
export async function downloadPDF(rows, filename = 'export.pdf', title = 'Report') {
  if (!rows?.length) return;
  const { default: jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ orientation: 'landscape' });
  const headers = Object.keys(rows[0]);
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  autoTable(doc, {
    head: [headers.map((h) => h.replace(/([A-Z])/g, ' $1').trim())],
    body: rows.map((r) => headers.map((h) => (r[h] == null ? '' : String(r[h])))),
    startY: 22,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [5, 150, 105] },
  });
  doc.save(filename);
}
