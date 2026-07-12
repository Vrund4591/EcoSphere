import { NavLink, Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { ROLE_LABELS } from '../../config/constants';

const DASHBOARD = { name: 'Dashboard', to: '/dashboard', dot: '#6E8072' };
const PILLARS = [
  { name: 'Environmental', to: '/environmental', dot: '#5EA97E' },
  { name: 'Social', to: '/social', dot: '#7C93C4' },
  { name: 'Governance', to: '/governance', dot: '#9D8AC9' },
  { name: 'Gamification', to: '/gamification', dot: '#C99A45' },
];
const COMPANY = [
  { name: 'Reports', to: '/reports', dot: '#6E8072', roles: ['ADMIN', 'MANAGER'] },
  { name: 'Settings', to: '/settings', dot: '#6E8072', roles: ['ADMIN'] },
];

function Mark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M 6.31 5.68 A 8.5 8.5 0 0 1 17.69 5.68" stroke="#5EA97E" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M 20.31 10.23 A 8.5 8.5 0 0 1 14.63 20.08" stroke="#7C93C4" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M 9.37 20.08 A 8.5 8.5 0 0 1 3.69 10.23" stroke="#9D8AC9" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.5" fill="#C99A45" />
    </svg>
  );
}

function Item({ item, onClose }) {
  return (
    <NavLink
      to={item.to}
      onClick={onClose}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors',
          isActive ? 'bg-[#2A4A37] text-white' : 'text-[#A9B8AB] hover:bg-[#1C3226]'
        )
      }
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.dot }} />
      {item.name}
    </NavLink>
  );
}

const Label = ({ children }) => (
  <span className="px-3 pb-1.5 pt-4 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6E8072]">
    {children}
  </span>
);

export default function Sidebar({ open, onClose }) {
  const { user } = useAuthStore();
  const can = (roles) => !roles || roles.includes(user?.role);
  const companyItems = COMPANY.filter((i) => can(i.roles));

  const xp = user?.xp || 0;
  const SPAN = 500; // XP per level
  const level = Math.floor(xp / SPAN) + 1;
  const inLevel = xp % SPAN;
  const pct = Math.round((inLevel / SPAN) * 100);
  const initials = (user?.name || 'U').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-[#14231B] px-3.5 py-5 transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-3 pb-4">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <Mark />
            <span className="font-serif text-[19px] font-medium text-[#F3F1E9]">EcoSphere</span>
          </Link>
          <button onClick={onClose} className="text-[#6E8072] lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          <Item item={DASHBOARD} onClose={onClose} />
          <Label>Pillars</Label>
          {PILLARS.map((i) => (
            <Item key={i.to} item={i} onClose={onClose} />
          ))}
          {companyItems.length > 0 && <Label>Company</Label>}
          {companyItems.map((i) => (
            <Item key={i.to} item={i} onClose={onClose} />
          ))}
        </nav>

        <div className="mt-3 rounded-[10px] bg-[#1C3226] p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3E5C49] text-[11.5px] font-semibold text-[#E8EFE8]">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-semibold text-[#F3F1E9]">{user?.name}</p>
              <p className="truncate text-[11px] text-[#9FAF9F]">{ROLE_LABELS[user?.role] || user?.role}</p>
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-[11px] font-semibold text-[#C99A45]">Level {level}</span>
            <span className="font-mono text-[11px] text-[#C6D2C6]">{xp.toLocaleString()} XP</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#0F1A14]">
            <div className="h-1 rounded-full bg-[#C99A45]" style={{ width: `${pct}%` }} />
          </div>
          <span className="mt-1 block font-mono text-[10px] text-[#6E8072]">
            {SPAN - inLevel} XP to Level {level + 1}
          </span>
        </div>
      </aside>
    </>
  );
}
