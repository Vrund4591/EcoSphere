import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Upload, Check, X as XIcon, UserCheck, MapPin, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { csrActivitiesAPI, participationsAPI, diversityAPI } from '../../services/social';
import { categoriesAPI } from '../../services/api';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Textarea,
  Modal,
  Badge,
  PageLoader,
  EmptyState,
  StatCard,
} from '../../components/ui';
import { cn, fmtDate } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { CHART_COLORS } from '../../config/constants';
import TrainingTab from './TrainingTab';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const TABS = ['CSR Activities', 'Participation Queue', 'Diversity Dashboard', 'Training'];

/* ================================================================
   Tab 1 — CSR Activities
   ================================================================ */
function CSRActivities() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [rows, setRows] = useState(null);
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(null); // null | {} | row
  const [form, setForm] = useState({});
  const [joinModal, setJoinModal] = useState(null); // activity to join
  const [proofFile, setProofFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [a, c] = await Promise.all([
        csrActivitiesAPI.getAll({ all: true }),
        categoriesAPI.getAll({ type: 'CSR_ACTIVITY' }),
      ]);
      setRows(a.data.data.activities);
      setCategories(c.data.data.categories);
    } catch {
      toast.error('Failed to load activities');
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ---------- CRUD ---------- */
  const open = (row) => {
    setForm(
      row
        ? { ...row, categoryId: row.categoryId || '' }
        : {
            title: '',
            description: '',
            date: '',
            location: '',
            pointsValue: 0,
            evidenceRequired: false,
            status: 'OPEN',
            categoryId: '',
          }
    );
    setModal(row || {});
  };

  const save = async () => {
    try {
      const payload = {
        ...form,
        pointsValue: Number(form.pointsValue) || 0,
      };
      if (form.id) await csrActivitiesAPI.update(form.id, payload);
      else await csrActivitiesAPI.create(payload);
      toast.success('Saved');
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this activity?')) return;
    try {
      await csrActivitiesAPI.remove(id);
      toast.success('Deleted');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  /* ---------- Join flow ---------- */
  const openJoin = (activity) => {
    setProofFile(null);
    setDragOver(false);
    setJoinModal(activity);
  };

  const submitJoin = async () => {
    if (!joinModal) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (proofFile) fd.append('proof', proofFile);
      await csrActivitiesAPI.join(joinModal.id, fd);
      toast.success('Joined successfully!');
      setJoinModal(null);
      setProofFile(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Join failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) setProofFile(file);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const hasJoined = (activity) =>
    activity.participations?.some((p) => p.employeeId === user?.id);

  if (!rows) return <PageLoader />;

  return (
    <>
      <Card
        title="CSR Activities"
        action={
          isAdmin ? (
            <Button size="sm" onClick={() => open(null)}>
              <Plus className="h-4 w-4" /> New Activity
            </Button>
          ) : null
        }
      >
        {rows.length === 0 ? (
          <EmptyState title="No CSR activities yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4">Points</th>
                  <th className="py-2 pr-4">Evidence?</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Participants</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50">
                    <td className="py-2 pr-4 font-medium text-slate-700">{a.title}</td>
                    <td className="py-2 pr-4">{a.category?.name || '—'}</td>
                    <td className="py-2 pr-4">{fmtDate(a.date)}</td>
                    <td className="py-2 pr-4 text-slate-500">{a.location || '—'}</td>
                    <td className="py-2 pr-4">{a.pointsValue ?? 0}</td>
                    <td className="py-2 pr-4">
                      {a.evidenceRequired ? (
                        <Badge status="PENDING">Required</Badge>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge status={a.status}>{a.status}</Badge>
                    </td>
                    <td className="py-2 pr-4">{a._count?.participations ?? 0}</td>
                    <td className="py-2">
                      <div className="flex justify-end gap-1">
                        {a.status === 'OPEN' && !hasJoined(a) && (
                          <button
                            onClick={() => openJoin(a)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600"
                            title="Join"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => open(a)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => remove(a.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
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

      {/* ---------- Create / Edit Modal ---------- */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={form.id ? 'Edit Activity' : 'New Activity'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Title"
            value={form.title || ''}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Textarea
            label="Description"
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              value={form.date ? form.date.slice(0, 10) : ''}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <Input
              label="Location"
              value={form.location || ''}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Points Value"
              type="number"
              value={form.pointsValue ?? 0}
              onChange={(e) => setForm({ ...form, pointsValue: e.target.value })}
            />
            <Select
              label="Category"
              value={form.categoryId || ''}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">— none —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <Select
            label="Status"
            value={form.status || 'OPEN'}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </Select>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.evidenceRequired || false}
              onChange={(e) => setForm({ ...form, evidenceRequired: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Evidence required for participation
          </label>
        </div>
      </Modal>

      {/* ---------- Join Modal ---------- */}
      <Modal
        open={joinModal !== null}
        onClose={() => setJoinModal(null)}
        title={`Join: ${joinModal?.title || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setJoinModal(null)}>
              Cancel
            </Button>
            <Button onClick={submitJoin} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {joinModal?.evidenceRequired
              ? 'This activity requires proof evidence. Please upload a file.'
              : 'Optionally upload proof evidence for this activity.'}
          </p>
          {/* Drag-and-drop area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors',
              dragOver
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
            )}
          >
            <Upload className="mb-2 h-8 w-8 text-slate-400" />
            {proofFile ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-emerald-700">{proofFile.name}</span>
                <button
                  onClick={() => setProofFile(null)}
                  className="text-slate-400 hover:text-rose-500"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-600">
                  Drag & drop your file here
                </p>
                <p className="mt-1 text-xs text-slate-400">or</p>
                <label className="mt-2 cursor-pointer rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100">
                  Browse files
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  />
                </label>
              </>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ================================================================
   Tab 2 — Participation Queue
   ================================================================ */
function ParticipationQueue() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [rows, setRows] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await participationsAPI.getAll(params);
      setRows(res.data.data.data);
    } catch {
      toast.error('Failed to load participations');
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const handleApprove = async (id) => {
    try {
      await participationsAPI.approve(id);
      toast.success('Participation approved');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Approve failed');
    }
  };

  const handleReject = async (id) => {
    try {
      await participationsAPI.reject(id);
      toast.success('Participation rejected');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Reject failed');
    }
  };

  if (!rows) return <PageLoader />;

  return (
    <Card
      title="Participation Queue"
      action={
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </Select>
      }
    >
      {rows.length === 0 ? (
        <EmptyState title="No participations found" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                <th className="py-2 pr-4">Employee</th>
                <th className="py-2 pr-4">Activity</th>
                <th className="py-2 pr-4">Points</th>
                <th className="py-2 pr-4">Proof</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Submitted</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="py-2 pr-4 font-medium text-slate-700">
                    {p.employee?.name || '—'}
                  </td>
                  <td className="py-2 pr-4">{p.activity?.title || '—'}</td>
                  <td className="py-2 pr-4">{p.activity?.pointsValue ?? 0}</td>
                  <td className="py-2 pr-4">
                    {p.proofUrl ? (
                      <a
                        href={p.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <Badge status={p.status}>{p.status}</Badge>
                  </td>
                  <td className="py-2 pr-4">{fmtDate(p.createdAt)}</td>
                  <td className="py-2">
                    {isAdmin && p.status === 'PENDING' && (
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleApprove(p.id)}
                          className="rounded p-1.5 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReject(p.id)}
                          className="rounded p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                          title="Reject"
                        >
                          <XIcon className="h-4 w-4" />
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
    </Card>
  );
}

/* ================================================================
   Tab 3 — Diversity Dashboard
   ================================================================ */
function DiversityDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await diversityAPI.get();
        setData(res.data.data);
      } catch {
        toast.error('Failed to load diversity data');
      }
    })();
  }, []);

  if (!data) return <PageLoader />;

  const hasGender = data.byGender?.length > 0;
  const hasDept = data.byDepartment?.length > 0;

  if (!hasGender && !hasDept) {
    return (
      <Card title="Diversity Dashboard">
        <EmptyState title="No diversity data available" />
      </Card>
    );
  }

  const RADIAN = Math.PI / 180;
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 1.15;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="#475569"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs"
      >
        {name} ({(percent * 100).toFixed(0)}%)
      </text>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Gender Pie */}
      <Card title="Gender Distribution">
        {hasGender ? (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={data.byGender}
                dataKey="count"
                nameKey="gender"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={renderCustomLabel}
                labelLine={false}
              >
                {data.byGender.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="No gender data" />
        )}
      </Card>

      {/* Department Bar */}
      <Card title="Department Breakdown">
        {hasDept ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.byDepartment} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="department" width={120} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.byDepartment.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="No department data" />
        )}
      </Card>
    </div>
  );
}

/* ================================================================
   Main Page
   ================================================================ */
export default function SocialPage() {
  const [tab, setTab] = useState('CSR Activities');

  return (
    <div>
      <PageHeader title="🤝 Social" subtitle="CSR activities, participation & diversity" />
      <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === t
                ? 'border-emerald-500 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'CSR Activities' && <CSRActivities />}
      {tab === 'Participation Queue' && <ParticipationQueue />}
      {tab === 'Diversity Dashboard' && <DiversityDashboard />}
      {tab === 'Training' && <TrainingTab />}
    </div>
  );
}
