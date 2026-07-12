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
