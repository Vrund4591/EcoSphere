import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  Trophy, Star, Gift, Users, Zap, Shield, Clock, CheckCircle2,
  XCircle, Plus, ChevronRight, Award, TrendingUp, Filter
} from 'lucide-react';
import {
  Button, Card, Badge, Modal, Input, Select, Textarea, PageLoader,
  EmptyState, StatCard, PageHeader, ScoreBar,
} from '../../components/ui';
import { challengesAPI, challengeParticipationsAPI, badgesAPI, rewardsAPI, leaderboardAPI } from '../../services/gamification';
import { categoriesAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { fmtDate } from '../../lib/utils';

const TABS = [
  { key: 'challenges', label: 'Challenges', icon: Zap },
  { key: 'participation', label: 'Approval Queue', icon: CheckCircle2 },
  { key: 'badges', label: 'Badges', icon: Award },
  { key: 'rewards', label: 'Rewards', icon: Gift },
  { key: 'leaderboard', label: 'Leaderboard', icon: TrendingUp },
];

const DIFFICULTY_COLOR = {
  EASY: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HARD: 'bg-rose-100 text-rose-700',
};

const STATUS_COLOR = {
  DRAFT: 'bg-slate-100 text-slate-600',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-sky-100 text-sky-700',
  ARCHIVED: 'bg-slate-200 text-slate-500',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[status] || 'bg-slate-100 text-slate-600'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

// ─── Challenges Tab ────────────────────────────────────────────────────────────
function ChallengesTab({ user }) {
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [challenges, setChallenges] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState({ open: false, item: null });
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = { all: 'true' };
      if (filterStatus) params.status = filterStatus;
      const [cRes, catRes] = await Promise.all([
        challengesAPI.getAll(params),
        categoriesAPI.getAll({ all: 'true' }),
      ]);
      setChallenges(cRes.data.data.challenges || []);
      setCategories((catRes.data.data.categories || []).filter(c => c.type === 'CHALLENGE'));
    } catch {
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ title: '', description: '', xp: 100, difficulty: 'EASY', evidenceRequired: false, deadline: '', categoryId: '' });
    setModal({ open: true, item: null });
  };

  const openEdit = (item) => {
    setForm({
      title: item.title,
      description: item.description || '',
      xp: item.xp,
      difficulty: item.difficulty,
      evidenceRequired: item.evidenceRequired,
      deadline: item.deadline ? item.deadline.split('T')[0] : '',
      categoryId: item.categoryId || '',
    });
    setModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!form.title) return toast.error('Title is required');
    setSaving(true);
    try {
      if (modal.item) {
        await challengesAPI.update(modal.item.id, form);
        toast.success('Challenge updated');
      } else {
        await challengesAPI.create(form);
        toast.success('Challenge created');
      }
      setModal({ open: false, item: null });
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this challenge?')) return;
    try {
      await challengesAPI.remove(id);
      toast.success('Deleted');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await challengesAPI.updateStatus(id, status);
      toast.success(`Status → ${status}`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update status');
    }
  };

  const handleJoin = async (id) => {
    try {
      await challengesAPI.join(id);
      toast.success('Joined challenge!');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to join');
    }
  };

  const grouped = ['ACTIVE', 'UNDER_REVIEW', 'DRAFT', 'COMPLETED', 'ARCHIVED'].reduce((acc, s) => {
    const filtered = challenges.filter(c => filterStatus ? c.status === filterStatus : c.status === s);
    if (filtered.length) acc[s] = filtered;
    return acc;
  }, {});

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            {['DRAFT','ACTIVE','UNDER_REVIEW','COMPLETED','ARCHIVED'].map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        {isManager && <Button onClick={openCreate}><Plus className="h-4 w-4" /> New Challenge</Button>}
      </div>

      {Object.keys(grouped).length === 0 && <EmptyState icon="🏆" title="No challenges yet" hint="Admins can create challenges to engage employees" />}

      {Object.entries(grouped).map(([status, items]) => (
        <div key={status}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <StatusBadge status={status} /> <span>{status.replace('_', ' ')}</span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">{items.length}</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(ch => (
              <div key={ch.id} className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_COLOR[ch.difficulty]}`}>{ch.difficulty}</span>
                    <h3 className="mt-2 font-semibold text-slate-800">{ch.title}</h3>
                    {ch.description && <p className="mt-1 text-sm text-slate-500 line-clamp-2">{ch.description}</p>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" /> {ch.xp} XP</span>
                  {ch.deadline && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtDate(ch.deadline)}</span>}
                  {ch.category && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-violet-600">{ch.category.name}</span>}
                  <span>{ch._count?.participations || 0} joined</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {ch.status === 'ACTIVE' && user?.role === 'EMPLOYEE' && (
                    <Button size="sm" onClick={() => handleJoin(ch.id)}>Join</Button>
                  )}
                  {isManager && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => openEdit(ch)}>Edit</Button>
                      {ch.status === 'DRAFT' && <Button size="sm" variant="secondary" onClick={() => handleStatusChange(ch.id, 'ACTIVE')}>Activate</Button>}
                      {ch.status === 'ACTIVE' && <Button size="sm" variant="secondary" onClick={() => handleStatusChange(ch.id, 'UNDER_REVIEW')}>Under Review</Button>}
                      {ch.status === 'UNDER_REVIEW' && <Button size="sm" variant="secondary" onClick={() => handleStatusChange(ch.id, 'COMPLETED')}>Complete</Button>}
                      {ch.status !== 'ARCHIVED' && <Button size="sm" variant="ghost" onClick={() => handleStatusChange(ch.id, 'ARCHIVED')}>Archive</Button>}
                      <Button size="sm" variant="danger" onClick={() => handleDelete(ch.id)}>Delete</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Modal open={modal.open} onClose={() => setModal({ open: false, item: null })} title={modal.item ? 'Edit Challenge' : 'New Challenge'} size="lg"
        footer={<><Button variant="outline" onClick={() => setModal({ open: false, item: null })}>Cancel</Button><Button loading={saving} onClick={handleSave}>Save</Button></>}
      >
        <div className="space-y-4">
          <Input label="Title *" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" rows={3} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="XP Reward" type="number" min={0} value={form.xp || 0} onChange={e => setForm(f => ({ ...f, xp: e.target.value }))} />
            <Select label="Difficulty" value={form.difficulty || 'EASY'} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Deadline" type="date" value={form.deadline || ''} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
            <Select label="Category" value={form.categoryId || ''} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.evidenceRequired} onChange={e => setForm(f => ({ ...f, evidenceRequired: e.target.checked }))} className="accent-emerald-600" />
            Evidence required for completion
          </label>
        </div>
      </Modal>
    </div>
  );
}

// ─── Participation / Approval Queue Tab ───────────────────────────────────────
function ParticipationTab({ user }) {
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(isManager ? 'PENDING' : '');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = { all: 'true' };
      if (filterStatus) params.status = filterStatus;
      const res = await challengeParticipationsAPI.getAll(params);
      setParticipations(res.data.data.participations || []);
    } catch {
      toast.error('Failed to load participations');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    try {
      await challengeParticipationsAPI.approve(id);
      toast.success('Approved! XP awarded 🎉');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await challengeParticipationsAPI.reject(id);
      toast.success('Rejected');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to reject');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {participations.length === 0 && <EmptyState icon="✅" title="No participations found" />}

      <div className="space-y-3">
        {participations.map(p => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-800">{p.employee?.name}</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600">{p.challenge?.title}</span>
                <Badge status={p.approvalStatus}>{p.approvalStatus}</Badge>
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>Difficulty: <strong>{p.challenge?.difficulty}</strong></span>
                <span>XP: <strong>{p.challenge?.xp}</strong></span>
                {p.xpAwarded > 0 && <span className="text-emerald-600">Awarded: {p.xpAwarded} XP</span>}
                <span>Progress: {p.progress}%</span>
                {p.proof && <span className="text-sky-600">Proof submitted</span>}
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${p.progress}%` }} />
              </div>
            </div>
            {isManager && p.approvalStatus === 'PENDING' && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleApprove(p.id)}><CheckCircle2 className="h-4 w-4" /> Approve</Button>
                <Button size="sm" variant="danger" onClick={() => handleReject(p.id)}><XCircle className="h-4 w-4" /> Reject</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Badges Tab ───────────────────────────────────────────────────────────────
function BadgesTab({ user }) {
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, item: null });
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await badgesAPI.getAll({ all: 'true' });
      setBadges(res.data.data.badges || []);
    } catch {
      toast.error('Failed to load badges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ name: '', description: '', icon: '🏅', unlockType: 'XP', unlockThreshold: 100, status: 'ACTIVE' });
    setModal({ open: true, item: null });
  };

  const openEdit = (item) => {
    setForm({ name: item.name, description: item.description || '', icon: item.icon || '🏅', unlockType: item.unlockType, unlockThreshold: item.unlockThreshold, status: item.status });
    setModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!form.name) return toast.error('Name is required');
    setSaving(true);
    try {
      if (modal.item) { await badgesAPI.update(modal.item.id, form); toast.success('Badge updated'); }
      else { await badgesAPI.create(form); toast.success('Badge created'); }
      setModal({ open: false, item: null });
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this badge?')) return;
    try { await badgesAPI.remove(id); toast.success('Deleted'); load(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed to delete'); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {isManager && (
        <div className="flex justify-end">
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> New Badge</Button>
        </div>
      )}

      {badges.length === 0 && <EmptyState icon="🏅" title="No badges yet" />}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {badges.map(b => {
          const earned = b.employeeBadges?.length > 0;
          return (
            <div key={b.id} className={`relative flex flex-col items-center rounded-xl border p-5 text-center transition-all ${earned ? 'border-amber-300 bg-amber-50 shadow-md shadow-amber-100' : 'border-slate-200 bg-white opacity-60'}`}>
              {earned && <span className="absolute right-2 top-2 text-xs font-semibold text-amber-600">Earned ✓</span>}
              <span className="text-4xl">{b.icon || '🏅'}</span>
              <p className="mt-2 font-semibold text-slate-800">{b.name}</p>
              {b.description && <p className="mt-1 text-xs text-slate-500">{b.description}</p>}
              <p className="mt-2 text-xs text-slate-400">{b.unlockType === 'XP' ? `${b.unlockThreshold} XP` : `${b.unlockThreshold} Challenges`}</p>
              {earned && b.employeeBadges?.[0]?.awardedAt && (
                <p className="mt-1 text-xs text-amber-500">Awarded {fmtDate(b.employeeBadges[0].awardedAt)}</p>
              )}
              {isManager && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(b)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(b.id)}>Del</Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false, item: null })} title={modal.item ? 'Edit Badge' : 'New Badge'}
        footer={<><Button variant="outline" onClick={() => setModal({ open: false, item: null })}>Cancel</Button><Button loading={saving} onClick={handleSave}>Save</Button></>}
      >
        <div className="space-y-4">
          <Input label="Name *" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500" rows={2} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <Input label="Icon (emoji)" value={form.icon || ''} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Unlock Type" value={form.unlockType || 'XP'} onChange={e => setForm(f => ({ ...f, unlockType: e.target.value }))}>
              <option value="XP">XP Threshold</option>
              <option value="CHALLENGES">Challenges Completed</option>
            </Select>
            <Input label="Threshold" type="number" min={0} value={form.unlockThreshold || 0} onChange={e => setForm(f => ({ ...f, unlockThreshold: e.target.value }))} />
          </div>
          <Select label="Status" value={form.status || 'ACTIVE'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </Modal>
    </div>
  );
}

// ─── Rewards Tab ──────────────────────────────────────────────────────────────
function RewardsTab({ user }) {
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [rewards, setRewards] = useState([]);
  const [userPoints, setUserPoints] = useState(user?.points || 0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, item: null });
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [redeeming, setRedeeming] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await rewardsAPI.getAll({ all: 'true' });
      setRewards(res.data.data.rewards || []);
    } catch {
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ name: '', description: '', pointsRequired: 100, stock: 10, status: 'ACTIVE' });
    setModal({ open: true, item: null });
  };

  const openEdit = (item) => {
    setForm({ name: item.name, description: item.description || '', pointsRequired: item.pointsRequired, stock: item.stock, status: item.status });
    setModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!form.name) return toast.error('Name is required');
    setSaving(true);
    try {
      if (modal.item) { await rewardsAPI.update(modal.item.id, form); toast.success('Reward updated'); }
      else { await rewardsAPI.create(form); toast.success('Reward created'); }
      setModal({ open: false, item: null });
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this reward?')) return;
    try { await rewardsAPI.remove(id); toast.success('Deleted'); load(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed to delete'); }
  };

  const handleRedeem = async (reward) => {
    if (userPoints < reward.pointsRequired) return toast.error(`Not enough points (you have ${userPoints})`);
    if (!confirm(`Redeem "${reward.name}" for ${reward.pointsRequired} points?`)) return;
    setRedeeming(reward.id);
    try {
      await rewardsAPI.redeem(reward.id);
      setUserPoints(p => p - reward.pointsRequired);
      toast.success(`Redeemed "${reward.name}" 🎁`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to redeem');
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2">
          <Star className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">Your Points Balance: <strong>{userPoints}</strong></span>
        </div>
        {isManager && <Button onClick={openCreate}><Plus className="h-4 w-4" /> New Reward</Button>}
      </div>

      {rewards.length === 0 && <EmptyState icon="🎁" title="No rewards yet" hint="Admins can add rewards to the catalog" />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rewards.map(r => (
          <div key={r.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">{r.name}</h3>
                {r.description && <p className="mt-1 text-sm text-slate-500">{r.description}</p>}
              </div>
              {r.status !== 'ACTIVE' && <Badge status="INACTIVE">Inactive</Badge>}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                <Star className="h-4 w-4" /> {r.pointsRequired} pts
              </span>
              <span className="text-slate-500">Stock: {r.stock}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {r.status === 'ACTIVE' && r.stock > 0 && (
                <Button size="sm" loading={redeeming === r.id} disabled={userPoints < r.pointsRequired} onClick={() => handleRedeem(r)}>
                  <Gift className="h-4 w-4" /> Redeem
                </Button>
              )}
              {r.stock === 0 && <span className="text-xs text-rose-500 font-medium">Out of stock</span>}
              {isManager && (
                <>
                  <Button size="sm" variant="outline" onClick={() => openEdit(r)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(r.id)}>Delete</Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false, item: null })} title={modal.item ? 'Edit Reward' : 'New Reward'}
        footer={<><Button variant="outline" onClick={() => setModal({ open: false, item: null })}>Cancel</Button><Button loading={saving} onClick={handleSave}>Save</Button></>}
      >
        <div className="space-y-4">
          <Input label="Name *" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500" rows={2} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Points Required" type="number" min={0} value={form.pointsRequired || 0} onChange={e => setForm(f => ({ ...f, pointsRequired: e.target.value }))} />
            <Input label="Stock" type="number" min={0} value={form.stock || 0} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
          </div>
          <Select label="Status" value={form.status || 'ACTIVE'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </Modal>
    </div>
  );
}

// ─── Leaderboard Tab ──────────────────────────────────────────────────────────
function LeaderboardTab() {
  const [data, setData] = useState({ users: [], departmentRankings: [] });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('users');

  const load = async () => {
    try {
      setLoading(true);
      const res = await leaderboardAPI.get({ limit: 25 });
      setData(res.data.data);
    } catch {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <PageLoader />;

  const RANK_STYLES = ['text-amber-500', 'text-slate-400', 'text-amber-700'];
  const MEDALS = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={view === 'users' ? 'primary' : 'outline'} onClick={() => setView('users')}>
          <Users className="h-4 w-4" /> Individuals
        </Button>
        <Button variant={view === 'departments' ? 'primary' : 'outline'} onClick={() => setView('departments')}>
          <Shield className="h-4 w-4" /> Departments
        </Button>
      </div>

      {view === 'users' && (
        <div className="space-y-2">
          {data.users.map((u, i) => (
            <div key={u.id} className={`flex items-center gap-4 rounded-xl border px-5 py-4 ${i < 3 ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'} shadow-sm`}>
              <span className="w-8 text-center text-xl font-bold">{MEDALS[i] || `#${i + 1}`}</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-800">{u.name}</span>
                  {u.department && <span className="text-xs text-slate-500">{u.department.name}</span>}
                  <div className="flex gap-1">
                    {u.badges?.map(eb => <span key={eb.badge.name} title={eb.badge.name} className="text-sm">{eb.badge.icon || '🏅'}</span>)}
                  </div>
                </div>
                <ScoreBar value={Math.min(100, (u.xp / Math.max(...data.users.map(x => x.xp), 1)) * 100)} />
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-800">{u.xp} <span className="text-xs text-slate-500">XP</span></p>
                <p className="text-xs text-emerald-600">{u.points} pts</p>
              </div>
            </div>
          ))}
          {data.users.length === 0 && <EmptyState icon="🏆" title="No leaderboard data yet" />}
        </div>
      )}

      {view === 'departments' && (
        <div className="space-y-2">
          {data.departmentRankings.map((d, i) => (
            <div key={d.id} className={`flex items-center gap-4 rounded-xl border px-5 py-4 ${i < 3 ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'} shadow-sm`}>
              <span className="w-8 text-center text-xl font-bold">{MEDALS[i] || `#${i + 1}`}</span>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{d.name}</p>
                <p className="text-xs text-slate-500">{d.memberCount} members</p>
                <ScoreBar value={Math.min(100, d.totalXp ? (d.totalXp / Math.max(...data.departmentRankings.map(x => x.totalXp), 1)) * 100 : 0)} />
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-800">{d.totalXp} <span className="text-xs text-slate-500">XP</span></p>
              </div>
            </div>
          ))}
          {data.departmentRankings.length === 0 && <EmptyState icon="🏢" title="No departments yet" />}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GamificationPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('challenges');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Quick stats for header
    Promise.all([
      challengesAPI.getAll({ all: 'true', status: 'ACTIVE' }),
      badgesAPI.getAll({ all: 'true' }),
    ]).then(([cRes, bRes]) => {
      const challenges = cRes.data.data.challenges || [];
      const badges = bRes.data.data.badges || [];
      const earnedBadges = badges.filter(b => b.employeeBadges?.length > 0).length;
      setStats({ activeChallenges: challenges.length, totalBadges: badges.length, earnedBadges, userXp: user?.xp || 0, userPoints: user?.points || 0 });
    }).catch(() => {});
  }, [user]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="🏆 Gamification"
        subtitle="Challenges, badges, rewards & leaderboard"
        actions={stats && (
          <div className="flex gap-3">
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-sm">
              <span className="text-amber-600 font-semibold">⚡ {stats.userXp} XP</span>
            </div>
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-sm">
              <span className="text-emerald-600 font-semibold">⭐ {stats.userPoints} pts</span>
            </div>
          </div>
        )}
      />

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active Challenges" value={stats.activeChallenges} icon={<Zap className="h-5 w-5" />} accent="emerald" />
          <StatCard label="Your XP" value={stats.userXp} icon={<Star className="h-5 w-5" />} accent="amber" />
          <StatCard label="Your Points" value={stats.userPoints} icon={<Gift className="h-5 w-5" />} accent="violet" />
          <StatCard label="Badges Earned" value={`${stats.earnedBadges} / ${stats.totalBadges}`} icon={<Award className="h-5 w-5" />} accent="sky" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'challenges' && <ChallengesTab user={user} />}
      {activeTab === 'participation' && <ParticipationTab user={user} />}
      {activeTab === 'badges' && <BadgesTab user={user} />}
      {activeTab === 'rewards' && <RewardsTab user={user} />}
      {activeTab === 'leaderboard' && <LeaderboardTab />}
    </div>
  );
}
