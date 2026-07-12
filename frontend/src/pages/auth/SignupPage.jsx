import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { Button, Input, Select } from '../../components/ui';

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

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, loading } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', gender: '' });

  const submit = async (e) => {
    e.preventDefault();
    const res = await signup(form);
    if (res.success) {
      toast.success('Account created!');
      navigate('/dashboard');
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F5F1]">
      {/* Brand panel — full-height left side */}
      <div
        className="relative hidden w-[45%] flex-col justify-between overflow-hidden p-12 xl:p-16 lg:flex"
        style={{ background: 'radial-gradient(130% 90% at 15% 0%, #1C3327 0%, #14231B 55%)' }}
      >
        <div className="flex items-center gap-2.5">
          <Mark />
          <span className="font-serif text-[22px] font-medium text-[#F3F1E9]">EcoSphere</span>
        </div>
        <div className="flex max-w-md flex-col gap-5">
          <h1 className="font-serif text-[44px] font-medium leading-[1.12] text-[#F3F1E9]">
            Join your team's <span className="italic text-[#5EA97E]">sustainability</span> journey.
          </h1>
          <p className="max-w-sm text-[15px] leading-relaxed text-[#9FAF9F]">
            Take part in CSR activities and challenges, earn XP and badges, and help your department
            climb the ESG leaderboard.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Legend color="#5EA97E" label="Environmental" />
          <Legend color="#7C93C4" label="Social" />
          <Legend color="#9D8AC9" label="Governance" />
          <Legend color="#C99A45" label="XP" />
        </div>
      </div>

      {/* Form — right side */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Mark size={24} />
            <span className="font-serif text-[20px] font-medium text-slate-800">EcoSphere</span>
          </div>
          <h2 className="font-serif text-[30px] font-medium text-slate-800">Create your account</h2>
          <p className="mt-1 text-[13px] text-slate-600">Join with your company email.</p>

          <form className="mt-7 space-y-4" onSubmit={submit}>
            <Input
              label="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
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
              placeholder="min 6 chars, letters + numbers"
              required
            />
            <Select
              label="Gender (optional)"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="">Prefer not to say</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </Select>
            <Button type="submit" loading={loading} className="w-full">Create account</Button>
          </form>

          <p className="mt-5 text-[12.5px] text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-emerald-600 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
