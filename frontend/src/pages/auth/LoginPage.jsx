import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { Button, Input } from '../../components/ui';

const DEMO = [
  { label: 'Admin', email: 'admin@ecosphere.com', password: 'Admin@123' },
  { label: 'Manager', email: 'sanjana@ecosphere.com', password: 'Manager@123' },
  { label: 'Employee', email: 'priya@ecosphere.com', password: 'Employee@123' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });

  const submit = async (creds) => {
    const c = creds || form;
    const res = await login(c.email, c.password);
    if (res.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-emerald-600 to-teal-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-2 text-2xl font-bold">
          <span className="text-3xl">🌱</span> EcoSphere
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Measure, manage & improve your ESG performance.
          </h1>
          <p className="mt-4 max-w-md text-emerald-50">
            Carbon accounting, CSR engagement, governance compliance and gamified sustainability —
            all in one unified dashboard.
          </p>
        </div>
        <p className="text-sm text-emerald-100">Odoo Hackathon '26 · ESG Management Platform</p>
      </div>

      {/* Form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="text-2xl font-bold text-slate-800">🌱 EcoSphere</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Access your ESG workspace</p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@ecosphere.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>
          </form>

          <div className="mt-6">
            <p className="mb-2 text-center text-xs text-slate-400">Quick demo login</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO.map((d) => (
                <button
                  key={d.label}
                  onClick={() => submit(d)}
                  className="rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:border-emerald-400 hover:text-emerald-700"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            No account?{' '}
            <Link to="/signup" className="font-medium text-emerald-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
