import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { trainingsAPI } from '../../services/social';
import {
  Card, Button, Input, Select, Textarea, Modal, Badge, PageLoader, EmptyState, ScoreBar,
} from '../../components/ui';
import { useAuthStore } from '../../store/authStore';

export default function TrainingTab() {
  const { user } = useAuthStore();
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [rows, setRows] = useState(null);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const load = async () => {
    try {
      const { data } = await trainingsAPI.getAll({ all: true });
      setRows(data.data.trainings);
      setTotalEmployees(data.data.totalEmployees || 0);
    } catch {
      toast.error('Failed to load trainings');
    }
  };
  useEffect(() => {
    load();
  }, []);

  const open = (row) => {
    setForm(row ? { ...row } : { title: '', category: '', provider: '', durationHours: 1, status: 'ACTIVE' });
    setModal(row || {});
  };
  const save = async () => {
    try {
      if (form.id) await trainingsAPI.update(form.id, form);
      else await trainingsAPI.create(form);
      toast.success('Saved');
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };
  const remove = async (id) => {
    if (!confirm('Delete this training?')) return;
    try {
      await trainingsAPI.remove(id);
      toast.success('Deleted');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };
  const markComplete = async (id) => {
    try {
      await trainingsAPI.complete(id);
      toast.success('Marked complete 🎓');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  if (!rows) return <PageLoader />;
  const myDone = (t) => t.completions?.length > 0 && t.completions[0].status === 'COMPLETED';

  return (
    <Card
      title="Training Completion"
      action={isManager && (
        <Button size="sm" onClick={() => open(null)}>
          <Plus className="h-4 w-4" /> New
        </Button>
      )}
    >
      {rows.length === 0 ? (
        <EmptyState icon="🎓" title="No trainings yet" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                <th className="py-2 pr-4">Training</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Duration</th>
                <th className="w-48 py-2 pr-4">Completion</th>
                <th className="py-2 pr-4">My status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const done = t._count.completions;
                const pct = totalEmployees ? Math.round((done / totalEmployees) * 100) : 0;
                return (
                  <tr key={t.id} className="border-b border-slate-50">
                    <td className="py-2 pr-4 font-medium text-slate-700">
                      {t.title}
                      {t.provider && <span className="block text-xs text-slate-400">{t.provider}</span>}
                    </td>
                    <td className="py-2 pr-4"><Badge>{t.category || '—'}</Badge></td>
                    <td className="py-2 pr-4">{t.durationHours}h</td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1"><ScoreBar value={pct} /></div>
                        <span className="w-14 text-right text-xs text-slate-500">{done}/{totalEmployees}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      {myDone(t) ? (
                        <Badge status="COMPLETED">Completed</Badge>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => markComplete(t.id)}>
                          <Check className="h-4 w-4" /> Mark done
                        </Button>
                      )}
                    </td>
                    <td className="py-2">
                      {isManager && (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => open(t)} className="p-1.5 text-slate-400 hover:text-emerald-600">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => remove(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={form.id ? 'Edit Training' : 'New Training'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Category" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Safety / Compliance / ESG / Diversity" />
          <Input label="Provider" value={form.provider || ''} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
          <Input label="Duration (hours)" type="number" value={form.durationHours ?? 1} onChange={(e) => setForm({ ...form, durationHours: e.target.value })} />
          <Textarea label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Select label="Status" value={form.status || 'ACTIVE'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </Modal>
    </Card>
  );
}
