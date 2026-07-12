import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { departmentsAPI, categoriesAPI, settingsAPI, usersAPI } from '../services/api';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Modal,
  Badge,
  PageLoader,
  EmptyState,
} from '../components/ui';
import { cn } from '../lib/utils';

const TABS = ['Users', 'Departments', 'Categories', 'ESG Configuration', 'Notifications'];

function Toggle({ checked, onChange, label, hint }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-11 rounded-full transition-colors', checked ? 'bg-emerald-500' : 'bg-slate-300')}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}

/* ------------------ Departments ------------------ */
function Departments() {
  const [rows, setRows] = useState(null);
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null); // null | {} | row
  const [form, setForm] = useState({});

  const load = async () => {
    const [d, u] = await Promise.all([
      departmentsAPI.getAll({ all: true }),
      usersAPI.getAll({ limit: 100 }),
    ]);
    setRows(d.data.data.departments);
    setUsers(u.data.data.data.filter((x) => x.role !== 'EMPLOYEE'));
  };
  useEffect(() => {
    load();
  }, []);

  const open = (row) => {
    setForm(row ? { ...row } : { name: '', code: '', status: 'ACTIVE' });
    setModal(row || {});
  };
  const save = async () => {
    try {
      if (form.id) await departmentsAPI.update(form.id, form);
      else await departmentsAPI.create(form);
      toast.success('Saved');
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };
  const remove = async (id) => {
    if (!confirm('Delete this department?')) return;
    try {
      await departmentsAPI.remove(id);
      toast.success('Deleted');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  if (!rows) return <PageLoader />;
  return (
    <Card
      title="Departments"
      action={
        <Button size="sm" onClick={() => open(null)}>
          <Plus className="h-4 w-4" /> New
        </Button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Code</th>
              <th className="py-2 pr-4">Head</th>
              <th className="py-2 pr-4">Parent</th>
              <th className="py-2 pr-4">Members</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-b border-slate-50">
                <td className="py-2 pr-4 font-medium text-slate-700">{d.name}</td>
                <td className="py-2 pr-4">{d.code}</td>
                <td className="py-2 pr-4">{d.head?.name || '—'}</td>
                <td className="py-2 pr-4">{d.parentDepartment?.code || '—'}</td>
                <td className="py-2 pr-4">{d._count?.members ?? 0}</td>
                <td className="py-2 pr-4"><Badge status={d.status} /></td>
                <td className="py-2">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => open(d)} className="p-1.5 text-slate-400 hover:text-emerald-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(d.id)} className="p-1.5 text-slate-400 hover:text-rose-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={form.id ? 'Edit Department' : 'New Department'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Code" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Select label="Head" value={form.headId || ''} onChange={(e) => setForm({ ...form, headId: e.target.value })}>
            <option value="">— none —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </Select>
          <Select
            label="Parent department"
            value={form.parentDepartmentId || ''}
            onChange={(e) => setForm({ ...form, parentDepartmentId: e.target.value })}
          >
            <option value="">— none —</option>
            {rows.filter((r) => r.id !== form.id).map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
          <Select label="Status" value={form.status || 'ACTIVE'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </Modal>
    </Card>
  );
}

/* ------------------ Categories ------------------ */
function Categories() {
  const [rows, setRows] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const load = async () => {
    const { data } = await categoriesAPI.getAll();
    setRows(data.data.categories);
  };
  useEffect(() => {
    load();
  }, []);

  const open = (row) => {
    setForm(row ? { ...row } : { name: '', type: 'CSR_ACTIVITY', status: 'ACTIVE' });
    setModal(row || {});
  };
  const save = async () => {
    try {
      if (form.id) await categoriesAPI.update(form.id, form);
      else await categoriesAPI.create(form);
      toast.success('Saved');
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };
  const remove = async (id) => {
    if (!confirm('Delete this category?')) return;
    await categoriesAPI.remove(id);
    toast.success('Deleted');
    load();
  };

  if (!rows) return <PageLoader />;
  return (
    <Card
      title="Categories"
      action={
        <Button size="sm" onClick={() => open(null)}>
          <Plus className="h-4 w-4" /> New
        </Button>
      }
    >
      {rows.length === 0 ? (
        <EmptyState title="No categories yet" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-slate-50">
                  <td className="py-2 pr-4 font-medium text-slate-700">{c.name}</td>
                  <td className="py-2 pr-4">
                    <Badge>{c.type === 'CSR_ACTIVITY' ? 'CSR Activity' : 'Challenge'}</Badge>
                  </td>
                  <td className="py-2 pr-4"><Badge status={c.status} /></td>
                  <td className="py-2">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => open(c)} className="p-1.5 text-slate-400 hover:text-emerald-600">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(c.id)} className="p-1.5 text-slate-400 hover:text-rose-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={form.id ? 'Edit Category' : 'New Category'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Type" value={form.type || 'CSR_ACTIVITY'} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="CSR_ACTIVITY">CSR Activity</option>
            <option value="CHALLENGE">Challenge</option>
          </Select>
          <Select label="Status" value={form.status || 'ACTIVE'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </Modal>
    </Card>
  );
}

/* ------------------ ESG Config + Notifications ------------------ */
function ConfigForm({ notificationsTab }) {
  const [s, setS] = useState(null);
  const load = async () => setS((await settingsAPI.get()).data.data.setting);
  useEffect(() => {
    load();
  }, []);
  const save = async () => {
    try {
      await settingsAPI.update(s);
      toast.success('Settings saved');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };
  if (!s) return <PageLoader />;

  if (notificationsTab) {
    return (
      <Card title="Notification Settings">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">In-app notifications</p>
          <Toggle
            label="New compliance issues"
            hint="Notify the owner + admins when a compliance issue is raised"
            checked={s.notifyComplianceIssue}
            onChange={(v) => setS({ ...s, notifyComplianceIssue: v })}
          />
          <Toggle
            label="CSR / Challenge approval decisions"
            hint="Notify employees when their participation is approved or rejected"
            checked={s.notifyApprovals}
            onChange={(v) => setS({ ...s, notifyApprovals: v })}
          />
          <Toggle
            label="Policy acknowledgement reminders"
            hint="Notify employees who haven't acknowledged a policy"
            checked={s.notifyPolicyReminders}
            onChange={(v) => setS({ ...s, notifyPolicyReminders: v })}
          />
          <Toggle
            label="Badge unlocks"
            hint="Notify employees the moment they earn a badge"
            checked={s.notifyBadgeUnlocks}
            onChange={(v) => setS({ ...s, notifyBadgeUnlocks: v })}
          />
          <p className="pt-2 text-sm font-semibold text-slate-700">Email</p>
          <Toggle
            label="Email alerts for new compliance issues"
            hint="Send an email (in addition to in-app) when a compliance issue is raised"
            checked={s.emailAlertsComplianceIssues}
            onChange={(v) => setS({ ...s, emailAlertsComplianceIssues: v })}
          />
          <Button onClick={save}>Save</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card title="ESG Configuration">
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Score weighting (%)</p>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Environmental" type="number" value={s.weightEnv} onChange={(e) => setS({ ...s, weightEnv: +e.target.value })} />
            <Input label="Social" type="number" value={s.weightSocial} onChange={(e) => setS({ ...s, weightSocial: +e.target.value })} />
            <Input label="Governance" type="number" value={s.weightGov} onChange={(e) => setS({ ...s, weightGov: +e.target.value })} />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Total: {s.weightEnv + s.weightSocial + s.weightGov}% (used to weight the overall ESG score)
          </p>
        </div>
        <div className="space-y-3">
          <Toggle label="Auto emission calculation" hint="Auto-compute CO₂ from quantity × emission factor" checked={s.autoEmissionCalc} onChange={(v) => setS({ ...s, autoEmissionCalc: v })} />
          <Toggle label="Require evidence for CSR approval" hint="Block approval without an attached proof file" checked={s.evidenceRequiredForCSR} onChange={(v) => setS({ ...s, evidenceRequiredForCSR: v })} />
          <Toggle label="Auto-award badges" hint="Grant badges the moment XP / challenge thresholds are met" checked={s.autoAwardBadges} onChange={(v) => setS({ ...s, autoAwardBadges: v })} />
        </div>
        <Button onClick={save}>Save configuration</Button>
      </div>
    </Card>
  );
}

/* ------------------ Users (admin RBAC) ------------------ */
function UsersAdmin() {
  const [rows, setRows] = useState(null);
  const [depts, setDepts] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const load = async () => {
    const [u, d] = await Promise.all([
      usersAPI.getAll({ limit: 100 }),
      departmentsAPI.getAll({ all: true }),
    ]);
    setRows(u.data.data.data);
    setDepts(d.data.data.departments);
  };
  useEffect(() => {
    load();
  }, []);

  const open = (row) => {
    setForm(
      row
        ? { ...row, departmentId: row.departmentId || '' }
        : { name: '', email: '', password: '', role: 'EMPLOYEE', departmentId: '' }
    );
    setModal(row || {});
  };

  const save = async () => {
    try {
      if (form.id) {
        await usersAPI.update(form.id, {
          name: form.name,
          role: form.role,
          departmentId: form.departmentId,
          isActive: form.isActive,
        });
      } else {
        await usersAPI.create(form);
      }
      toast.success('Saved');
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };
  const remove = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await usersAPI.remove(id);
      toast.success('Deleted');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  if (!rows) return <PageLoader />;
  return (
    <Card
      title="Users & Roles"
      action={
        <Button size="sm" onClick={() => open(null)}>
          <Plus className="h-4 w-4" /> New user
        </Button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Department</th>
              <th className="py-2 pr-4">XP</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-slate-50">
                <td className="py-2 pr-4 font-medium text-slate-700">{u.name}</td>
                <td className="py-2 pr-4 text-slate-500">{u.email}</td>
                <td className="py-2 pr-4"><Badge>{u.role}</Badge></td>
                <td className="py-2 pr-4">{u.department?.name || '—'}</td>
                <td className="py-2 pr-4">{u.xp}</td>
                <td className="py-2 pr-4">
                  <Badge status={u.isActive ? 'ACTIVE' : 'ARCHIVED'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                </td>
                <td className="py-2">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => open(u)} className="p-1.5 text-slate-400 hover:text-emerald-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(u.id)} className="p-1.5 text-slate-400 hover:text-rose-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={form.id ? 'Edit User' : 'New User'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input
            label="Email"
            type="email"
            value={form.email || ''}
            disabled={!!form.id}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {!form.id && (
            <Input
              label="Password"
              type="password"
              value={form.password || ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="min 6 chars, letters + numbers"
            />
          )}
          <Select label="Role" value={form.role || 'EMPLOYEE'} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </Select>
          <Select
            label="Department"
            value={form.departmentId || ''}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
          >
            <option value="">— none —</option>
            {depts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
          {form.id && (
            <Select
              label="Status"
              value={form.isActive ? 'true' : 'false'}
              onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          )}
        </div>
      </Modal>
    </Card>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState('Users');
  return (
    <div>
      <PageHeader title="⚙ Settings" subtitle="Configuration & administration" />
      <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === t ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'Users' && <UsersAdmin />}
      {tab === 'Departments' && <Departments />}
      {tab === 'Categories' && <Categories />}
      {tab === 'ESG Configuration' && <ConfigForm />}
      {tab === 'Notifications' && <ConfigForm notificationsTab />}
    </div>
  );
}
