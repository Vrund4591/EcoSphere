import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { Button, Input } from '../../components/ui';

const DEMO = [
  { email: 'admin@ecosphere.com', password: 'Admin@123' },
  { email: 'sanjana@ecosphere.com', password: 'Manager@123' },
  { email: 'priya@ecosphere.com', password: 'Employee@123' },
];

function Mark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M 6.31 5.68 A 8.5 8.5 0 0 1 17.69 5.68" stroke="#5EA97E" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M 20.31 10.23 A 8.5 8.5 0 0 1 14.63 20.08" stroke="#7C93C4" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M 9.37 20.08 A 8.5 8.5 0 0 1 3.69 10.23" stroke="#9D8AC9" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.5" fill="#C99A45" />
    </svg>
  );
}

const Legend = ({ color, label }) => (
  <span className="flex items-center gap-1.5">
    <span className="h-[7px] w-[7px] rounded-full" style={{ background: color }} />
    <span className="text-[12px] text-[#C6D2C6]">{label}</span>
  </span>
);

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
    <div className="flex min-h-screen items-center justify-center bg-[#EAE8E0] lg:p-8">
      <div className="flex min-h-screen w-full overflow-hidden bg-[#F6F5F1] lg:min-h-[520px] lg:max-w-5xl lg:rounded-2xl lg:border lg:border-slate-300 lg:shadow-sm">
        {/* Brand panel */}
        <div className="hidden w-[46%] flex-col justify-center gap-9 bg-[#14231B] p-11 lg:flex">
          <div className="flex items-center gap-2.5">
            <Mark />
            <span className="font-serif text-[21px] font-medium text-[#F3F1E9]">EcoSphere</span>
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="font-serif text-[40px] font-medium leading-[1.15] text-[#F3F1E9]">
              One place for your company's <span className="italic text-[#5EA97E]">E</span>,{' '}
              <span className="italic text-[#7C93C4]">S</span> and <span className="italic text-[#9D8AC9]">G</span>.
            </h1>
            <p className="max-w-sm text-[14px] leading-relaxed text-[#9FAF9F]">
              Emissions, CSR, compliance and the score that rolls them up — with challenges and XP
              built into every module.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Legend color="#5EA97E" label="Environmental" />
            <Legend color="#7C93C4" label="Social" />
            <Legend color="#9D8AC9" label="Governance" />
            <Legend color="#C99A45" label="XP" />
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-sm">
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              <Mark size={24} />
              <span className="font-serif text-[20px] font-medium text-slate-800">EcoSphere</span>
            </div>
            <h2 className="font-serif text-[28px] font-medium text-slate-800">Sign in</h2>
            <p className="mt-1 text-[13px] text-slate-600">Use your company email.</p>

            <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
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
                required
              />
              <Button type="submit" loading={loading} className="w-full">Sign in</Button>
            </form>

            <p className="mt-5 text-[12.5px] text-slate-600">
              New here?{' '}
              <Link to="/signup" className="font-semibold text-emerald-600 hover:underline">Create an account</Link>
            </p>

            <div className="mt-5 rounded-[10px] border border-dashed border-slate-300 bg-slate-100 p-3.5">
              <p className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Demo accounts — tap to sign in
              </p>
              <div className="flex flex-col gap-1.5">
                {DEMO.map((d) => (
                  <button
                    key={d.email}
                    onClick={() => submit(d)}
                    className="text-left font-mono text-[11px] text-slate-600 hover:text-emerald-700"
                  >
                    {d.email} · {d.password}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
