import { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, ChevronDown } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/authStore';
import { notificationsAPI } from '../../services/api';
import { ROLE_LABELS } from '../../config/constants';
import { cn } from '../../lib/utils';

function Bells() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const load = async () => {
    try {
      const { data } = await notificationsAPI.getAll();
      setItems(data.data.notifications || []);
      setUnread(data.data.unread || 0);
    } catch { /* ignore */ }
  };
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAll = async () => {
    await notificationsAPI.markAll();
    load();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
            <span className="text-sm font-semibold text-slate-700">Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-emerald-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">No notifications</p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={cn('border-b border-slate-50 px-4 py-2.5', !n.read && 'bg-emerald-50/40')}
                >
                  <p className="text-sm font-medium text-slate-700">{n.title}</p>
                  <p className="text-xs text-slate-500">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Bells />
            <div className="flex items-center gap-2 rounded-lg px-2 py-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500">{ROLE_LABELS[user?.role] || user?.role}</p>
              </div>
              <button
                onClick={onLogout}
                title="Logout"
                className="ml-1 rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
