export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const ROLES = { ADMIN: 'ADMIN', MANAGER: 'MANAGER', EMPLOYEE: 'EMPLOYEE' };
export const ROLE_LABELS = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
};

// Brand palette (emerald / sustainability green)
export const BRAND = '#059669';
export const CHART_COLORS = ['#059669', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];

export const STATUS_COLORS = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  ON_TRACK: 'bg-sky-100 text-sky-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  DRAFT: 'bg-slate-100 text-slate-600',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  ARCHIVED: 'bg-slate-100 text-slate-500',
  OPEN: 'bg-rose-100 text-rose-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  CLOSED: 'bg-slate-100 text-slate-600',
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-rose-100 text-rose-700',
};
