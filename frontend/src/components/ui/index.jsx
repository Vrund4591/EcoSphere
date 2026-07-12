import { useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { STATUS_COLORS } from '../../config/constants';

/* ---------------- Button ---------------- */
const BTN = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
  secondary: 'bg-white border border-slate-300 text-slate-700 hover:border-slate-400',
  outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
};
export function Button({ variant = 'primary', size = 'md', loading, className, children, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm',
        BTN[variant],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/* ---------------- Input / Select / Textarea ---------------- */
export function Field({ label, error, children }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>}
      {children}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}
const control =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
export function Input({ label, error, className, ...props }) {
  return (
    <Field label={label} error={error}>
      <input className={cn(control, className)} {...props} />
    </Field>
  );
}
export function Select({ label, error, children, className, ...props }) {
  return (
    <Field label={label} error={error}>
      <select className={cn(control, 'bg-white', className)} {...props}>
        {children}
      </select>
    </Field>
  );
}
export function Textarea({ label, error, className, ...props }) {
  return (
    <Field label={label} error={error}>
      <textarea className={cn(control, className)} rows={3} {...props} />
    </Field>
  );
}

/* ---------------- Card ---------------- */
export function Card({ title, action, className, children }) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          {action}
        </div>
      )}
      <div className={title ? 'p-5' : 'p-5'}>{children}</div>
    </div>
  );
}

/* ---------------- Badge ---------------- */
export function Badge({ status, children, className }) {
  const key = (status || children || '').toString().toUpperCase().replace(/\s+/g, '_');
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium',
        STATUS_COLORS[key] || 'bg-slate-100 text-slate-600',
        className
      )}
    >
      {children || status}
    </span>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 w-full rounded-xl bg-white shadow-xl',
          size === 'lg' ? 'max-w-2xl' : 'max-w-md'
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Misc ---------------- */
export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-emerald-600', className)} />;
}
export function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
export function EmptyState({ icon, title = 'Nothing here yet', hint }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-2 text-4xl">{icon || '🌱'}</div>
      <p className="font-medium text-slate-700">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-400">{hint}</p>}
    </div>
  );
}
const ACCENTS = {
  emerald: 'bg-emerald-50 text-emerald-600',
  sky: 'bg-sky-50 text-sky-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  violet: 'bg-violet-50 text-violet-600',
};
export function StatCard({ label, value, sub, icon, accent = 'emerald' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-slate-800">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        {icon && <div className={cn('rounded-lg p-2', ACCENTS[accent] || ACCENTS.emerald)}>{icon}</div>}
      </div>
    </div>
  );
}
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-serif text-[26px] font-medium text-slate-800">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* Score gauge (colored by value) */
export function ScoreBar({ value = 0, label }) {
  const color = value >= 75 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div>
      {label && (
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-slate-600">{label}</span>
          <span className="font-semibold text-slate-800">{Math.round(value)}</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}
