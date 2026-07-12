import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { Sprout } from 'lucide-react';
import { Button, Input, Select } from '../../components/ui';

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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Sprout className="mx-auto h-8 w-8 text-emerald-600" />
          <h2 className="mt-2 text-2xl font-bold text-slate-800">Join EcoSphere</h2>
          <p className="mt-1 text-sm text-slate-500">Create your employee account</p>
        </div>
        <form className="space-y-4" onSubmit={submit}>
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
          <Button type="submit" loading={loading} className="w-full">
            Create account
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-emerald-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
