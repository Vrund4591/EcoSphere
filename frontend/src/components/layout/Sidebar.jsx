import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Leaf,
  Users,
  ShieldCheck,
  Trophy,
  FileBarChart,
  Settings as SettingsIcon,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

const NAV = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { name: 'Environmental', to: '/environmental', icon: Leaf, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { name: 'Social', to: '/social', icon: Users, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { name: 'Governance', to: '/governance', icon: ShieldCheck, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { name: 'Gamification', to: '/gamification', icon: Trophy, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { name: 'Reports', to: '/reports', icon: FileBarChart, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Settings', to: '/settings', icon: SettingsIcon, roles: ['ADMIN'] },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuthStore();
  const items = NAV.filter((i) => i.roles.includes(user?.role));

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <span className="text-lg font-bold text-slate-800">
              Eco<span className="text-emerald-600">Sphere</span>
            </span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-100'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4 text-xs text-slate-400">
          EcoSphere · ESG Platform
        </div>
      </aside>
    </>
  );
}
