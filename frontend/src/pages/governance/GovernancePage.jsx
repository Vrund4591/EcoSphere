import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, Bell, AlertTriangle, Shield, FileText, ClipboardCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { policiesAPI, acknowledgementsAPI, auditsAPI, complianceIssuesAPI } from '../../services/governance';
import { departmentsAPI, usersAPI } from '../../services/api';
import { PageHeader, Card, Button, Input, Select, Textarea, Modal, Badge, PageLoader, EmptyState } from '../../components/ui';
import { cn } from '../../lib/utils';
import { fmtDate } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

const TABS = ['Policies', 'Acknowledgements', 'Audits', 'Compliance Issues'];

const SEVERITY_ICONS = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-rose-100 text-rose-700',
};

/* ============================================================
   Tab 1 — Policies
   ============================================================ */
function Policies() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [rows, setRows] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const load = async () => {
    const res = await policiesAPI.getAll();
    setRows(res.data.data.data);
  };
  useEffect(() => { load(); }, []);

  const open = (row) => {
    setForm(
      row
        ? { ...row }
        : { title: '', description: '', pillar: 'GOVERNANCE', version: '', effectiveDate: '', status: 'ACTIVE' }
    );
    setModal(row || {});
  };

  const save = async () => {
    try {
      if (form.id) await policiesAPI.update(form.id, form);
      else await policiesAPI.create(form);
      toast.success('Policy saved');
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this policy?')) return;
    try {
      await policiesAPI.remove(id);
      toast.success('Policy deleted');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const acknowledge = async (id) => {
    try {
      await policiesAPI.acknowledge(id);
      toast.success('Policy acknowledged');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Acknowledge failed');
    }
  };

  const remind = async (id) => {
    try {
      const res = await policiesAPI.remind(id);
      const count = res.data.data.notifiedCount;
      toast.success(`Reminder sent to ${count} user${count !== 1 ? 's' : ''}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Remind failed');
    }
  };

  if (!rows) return <PageLoader />;

  return (
    <Card
      title="Policies"
      action={
        isAdmin && (
          <Button size="sm" onClick={() => open(null)}>
            <Plus className="h-4 w-4" /> New Policy
          </Button>
        )
      }
    >
      {rows.length === 0 ? (
        <EmptyState title="No policies yet" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Pillar</th>
                <th className="py-2 pr-4">Version</th>
                <th className="py-2 pr-4">Effective Date</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Ack Count</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="py-2 pr-4 font-medium text-slate-700">{p.title}</td>
                  <td className="py-2 pr-4">
                    <Badge status={p.pillar}>{p.pillar}</Badge>
                  </td>
                  <td className="py-2 pr-4">{p.version || '—'}</td>
                  <td className="py-2 pr-4">{fmtDate(p.effectiveDate)}</td>
                  <td className="py-2 pr-4"><Badge status={p.status} /></td>
                  <td className="py-2 pr-4">{p._count?.acknowledgements ?? 0}</td>
                  <td className="py-2">
                    <div className="flex justify-end gap-1">
                      {isAdmin && (
                        <>
                          <button onClick={() => remind(p.id)} className="p-1.5 text-slate-400 hover:text-amber-600" title="Send reminder">
                            <Bell className="h-4 w-4" />
                          </button>
                          <button onClick={() => open(p)} className="p-1.5 text-slate-400 hover:text-emerald-600">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => remove(p.id)} className="p-1.5 text-slate-400 hover:text-rose-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {!isAdmin && (
                        <button onClick={() => acknowledge(p.id)} className="p-1.5 text-slate-400 hover:text-emerald-600" title="Acknowledge">
                          <Check className="h-4 w-4" />
                        </button>
                      )}
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
        title={form.id ? 'Edit Policy' : 'New Policy'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Select label="Pillar" value={form.pillar || 'GOVERNANCE'} onChange={(e) => setForm({ ...form, pillar: e.target.value })}>
            <option value="ENVIRONMENTAL">Environmental</option>
            <option value="SOCIAL">Social</option>
            <option value="GOVERNANCE">Governance</option>
          </Select>
          <Input label="Version" value={form.version || ''} onChange={(e) => setForm({ ...form, version: e.target.value })} />
          <Input label="Effective Date" type="date" value={form.effectiveDate ? form.effectiveDate.slice(0, 10) : ''} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
          <Select label="Status" value={form.status || 'ACTIVE'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </Modal>
    </Card>
  );
}

/* ============================================================
   Tab 2 — Acknowledgements
   ============================================================ */
function Acknowledgements() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [rows, setRows] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    const res = await acknowledgementsAPI.getAll(params);
    setRows(res.data.data.data);
  };
  useEffect(() => { load(); }, [statusFilter]);

  const remind = async (id) => {
    try {
      await acknowledgementsAPI.remind(id);
      toast.success('Reminder sent');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Remind failed');
    }
  };

  if (!rows) return <PageLoader />;

  return (
    <Card
      title="Acknowledgements"
      action={
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
        </Select>
      }
    >
      {rows.length === 0 ? (
        <EmptyState title="No acknowledgements found" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                <th className="py-2 pr-4">Policy</th>
                <th className="py-2 pr-4">Employee</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Acknowledged At</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-slate-50">
                  <td className="py-2 pr-4 font-medium text-slate-700">{a.policy?.title || '—'}</td>
                  <td className="py-2 pr-4">{a.employee?.name || '—'}</td>
                  <td className="py-2 pr-4">
                    <Badge status={a.status === 'ACKNOWLEDGED' ? 'APPROVED' : 'PENDING'}>
                      {a.status}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4">{fmtDate(a.acknowledgedAt)}</td>
                  <td className="py-2">
                    <div className="flex justify-end gap-1">
                      {isAdmin && a.status === 'PENDING' && (
                        <button onClick={() => remind(a.id)} className="p-1.5 text-slate-400 hover:text-amber-600" title="Send reminder">
                          <Bell className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ============================================================
   Tab 3 — Audits
   ============================================================ */
function Audits() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [rows, setRows] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const load = async () => {
    const [a, d] = await Promise.all([
      auditsAPI.getAll(),
      departmentsAPI.getAll({ all: true }),
    ]);
    setRows(a.data.data.data);
    setDepartments(d.data.data.departments);
  };
  useEffect(() => { load(); }, []);

  const open = (row) => {
    setForm(
      row
        ? { ...row, departmentId: row.departmentId || '' }
        : { title: '', auditor: '', date: '', findings: '', status: 'UNDER_REVIEW', departmentId: '' }
    );
    setModal(row || {});
  };

  const save = async () => {
    try {
      if (form.id) await auditsAPI.update(form.id, form);
      else await auditsAPI.create(form);
      toast.success('Audit saved');
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this audit?')) return;
    try {
      await auditsAPI.remove(id);
      toast.success('Audit deleted');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  if (!rows) return <PageLoader />;

  return (
    <Card
      title="Audits"
      action={
        isAdmin && (
          <Button size="sm" onClick={() => open(null)}>
            <Plus className="h-4 w-4" /> New Audit
          </Button>
        )
      }
    >
      {rows.length === 0 ? (
        <EmptyState title="No audits yet" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Auditor</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Issues</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-slate-50">
                  <td className="py-2 pr-4 font-medium text-slate-700">{a.title}</td>
                  <td className="py-2 pr-4">{a.auditor || '—'}</td>
                  <td className="py-2 pr-4">{fmtDate(a.date)}</td>
                  <td className="py-2 pr-4">{a.department?.name || '—'}</td>
                  <td className="py-2 pr-4"><Badge status={a.status} /></td>
                  <td className="py-2 pr-4">{a._count?.complianceIssues ?? 0}</td>
                  <td className="py-2">
                    {isAdmin && (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => open(a)} className="p-1.5 text-slate-400 hover:text-emerald-600">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => remove(a.id)} className="p-1.5 text-slate-400 hover:text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
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
        title={form.id ? 'Edit Audit' : 'New Audit'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Auditor" value={form.auditor || ''} onChange={(e) => setForm({ ...form, auditor: e.target.value })} />
          <Input label="Date" type="date" value={form.date ? form.date.slice(0, 10) : ''} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Select label="Department" value={form.departmentId || ''} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
            <option value="">— none —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
          <Textarea label="Findings" value={form.findings || ''} onChange={(e) => setForm({ ...form, findings: e.target.value })} />
          <Select label="Status" value={form.status || 'UNDER_REVIEW'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="COMPLETED">Completed</option>
          </Select>
        </div>
      </Modal>
    </Card>
  );
}

/* ============================================================
   Tab 4 — Compliance Issues
   ============================================================ */
function ComplianceIssues() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [rows, setRows] = useState(null);
  const [users, setUsers] = useState([]);
  const [audits, setAudits] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const load = async () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (severityFilter) params.severity = severityFilter;
    const [c, u, a] = await Promise.all([
      complianceIssuesAPI.getAll(params),
      usersAPI.getAll({ limit: 200 }),
      auditsAPI.getAll(),
    ]);
    setRows(c.data.data.data);
    setUsers(u.data.data.data);
    setAudits(a.data.data.data);
  };
  useEffect(() => { load(); }, [statusFilter, severityFilter]);

  const open = (row) => {
    setForm(
      row
        ? { ...row, ownerId: row.ownerId || row.owner?.id || '', auditId: row.auditId || '' }
        : { title: '', description: '', severity: 'MEDIUM', ownerId: '', dueDate: '', auditId: '', status: 'OPEN' }
    );
    setModal(row || {});
  };

  const save = async () => {
    try {
      if (form.id) await complianceIssuesAPI.update(form.id, form);
      else await complianceIssuesAPI.create(form);
      toast.success('Issue saved');
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this compliance issue?')) return;
    try {
      await complianceIssuesAPI.remove(id);
      toast.success('Issue deleted');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  if (!rows) return <PageLoader />;

  return (
    <Card
      title="Compliance Issues"
      action={
        <div className="flex items-center gap-2">
          <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </Select>
          {isAdmin && (
            <Button size="sm" onClick={() => open(null)}>
              <Plus className="h-4 w-4" /> New Issue
            </Button>
          )}
        </div>
      }
    >
      {rows.length === 0 ? (
        <EmptyState title="No compliance issues found" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Severity</th>
                <th className="py-2 pr-4">Owner</th>
                <th className="py-2 pr-4">Due Date</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  className={cn(
                    'border-b border-slate-50',
                    c.isOverdue && 'bg-rose-50'
                  )}
                >
                  <td className="py-2 pr-4 font-medium text-slate-700">{c.title}</td>
                  <td className="py-2 pr-4">
                    <Badge status={c.severity}>{c.severity}</Badge>
                  </td>
                  <td className="py-2 pr-4">{c.owner?.name || '—'}</td>
                  <td className="py-2 pr-4">
                    <span className="inline-flex items-center gap-1">
                      {fmtDate(c.dueDate)}
                      {c.isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />}
                    </span>
                  </td>
                  <td className="py-2 pr-4"><Badge status={c.status} /></td>
                  <td className="py-2">
                    {isAdmin && (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => open(c)} className="p-1.5 text-slate-400 hover:text-emerald-600">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => remove(c.id)} className="p-1.5 text-slate-400 hover:text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
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
        title={form.id ? 'Edit Compliance Issue' : 'New Compliance Issue'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Select label="Severity" value={form.severity || 'MEDIUM'} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </Select>
          <Select label="Owner" value={form.ownerId || ''} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
            <option value="">— select owner —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </Select>
          <Input label="Due Date" type="date" value={form.dueDate ? form.dueDate.slice(0, 10) : ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <Select label="Linked Audit" value={form.auditId || ''} onChange={(e) => setForm({ ...form, auditId: e.target.value })}>
            <option value="">— none —</option>
            {audits.map((a) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </Select>
          <Select label="Status" value={form.status || 'OPEN'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </Select>
        </div>
      </Modal>
    </Card>
  );
}

/* ============================================================
   Main Page — Tabbed Layout
   ============================================================ */
export default function GovernancePage() {
  const [tab, setTab] = useState('Policies');
  return (
    <div>
      <PageHeader title="🏛 Governance" subtitle="Policies, audits & compliance management" />
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
      {tab === 'Policies' && <Policies />}
      {tab === 'Acknowledgements' && <Acknowledgements />}
      {tab === 'Audits' && <Audits />}
      {tab === 'Compliance Issues' && <ComplianceIssues />}
    </div>
  );
}
