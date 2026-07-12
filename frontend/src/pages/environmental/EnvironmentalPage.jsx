import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Play, Search, Calendar, TrendingDown, Layers, Activity, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import {
  emissionFactorsAPI,
  carbonTransactionsAPI,
  environmentalGoalsAPI,
  productProfilesAPI,
  departmentsAPI,
  settingsAPI,
} from '../../services/api';
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
  StatCard,
  ScoreBar,
} from '../../components/ui';
import { cn } from '../../lib/utils';

const TABS = ['Emission Factors', 'Carbon Transactions', 'Environmental Goals', 'Product ESG Profiles'];

export default function EnvironmentalPage() {
  const [tab, setTab] = useState('Emission Factors');
  const { user } = useAuthStore();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  // State for summary KPI cards
  const [kpis, setKpis] = useState({
    totalEmissions: 0,
    activeGoals: 0,
    factorCount: 0,
    avgGoalProgress: 0,
  });
  const [counts, setCounts] = useState({});

  // Load overall metrics for the environmental dashboard
  const loadKpis = async () => {
    try {
      const [factorsRes, txnsRes, goalsRes, profRes] = await Promise.all([
        emissionFactorsAPI.getAll({ all: 'true' }),
        carbonTransactionsAPI.getAll({ all: 'true' }),
        environmentalGoalsAPI.getAll({ all: 'true' }),
        productProfilesAPI.getAll({ all: 'true' }),
      ]);

      const factors = factorsRes.data.data.emissionFactors || [];
      const txns = txnsRes.data.data.transactions || [];
      const goals = goalsRes.data.data.goals || [];
      const profiles = profRes.data.data.profiles || [];
      setCounts({
        'Emission Factors': factors.length,
        'Carbon Transactions': txns.length,
        'Environmental Goals': goals.length,
        'Product ESG Profiles': profiles.length,
      });

      const totalEmissions = txns.reduce((sum, t) => sum + (t.co2Amount || 0), 0);
      const activeGoals = goals.filter(g => g.status === 'ACTIVE' || g.status === 'ON_TRACK').length;
      
      let avgGoalProgress = 0;
      if (goals.length > 0) {
        const sumProgress = goals.reduce((sum, g) => {
          const ratio = g.targetCo2 > 0 ? (g.currentCo2 / g.targetCo2) * 100 : 0;
          return sum + Math.min(100, Math.max(0, ratio));
        }, 0);
        avgGoalProgress = sumProgress / goals.length;
      }

      setKpis({
        totalEmissions: Math.round(totalEmissions),
        activeGoals,
        factorCount: factors.length,
        avgGoalProgress: Math.round(avgGoalProgress),
      });
    } catch (e) {
      console.error('Failed to load environmental KPI metrics', e);
    }
  };

  useEffect(() => {
    loadKpis();
  }, [tab]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Environmental"
        subtitle="Track carbon transactions, manage emission factors, monitor ESG goals, and manage product profiles."
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Carbon Footprint"
          value={`${kpis.totalEmissions.toLocaleString()} kg`}
          sub="CO₂e emissions logged"
          icon={<TrendingDown className="h-5 w-5 text-rose-500" />}
          accent="rose"
        />
        <StatCard
          label="Active Goals"
          value={kpis.activeGoals}
          sub="Sustainability targets active"
          icon={<Target className="h-5 w-5 text-emerald-500" />}
          accent="emerald"
        />
        <StatCard
          label="Emission Factors"
          value={kpis.factorCount}
          sub="Active reference factors"
          icon={<Layers className="h-5 w-5 text-sky-500" />}
          accent="sky"
        />
        <StatCard
          label="Avg Goal Progress"
          value={`${kpis.avgGoalProgress}%`}
          sub="Emissions target progress"
          icon={<Activity className="h-5 w-5 text-amber-500" />}
          accent="amber"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === t ? 'border-emerald-600 font-semibold text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {t}
            {counts[t] !== undefined && (
              <span className={cn('ml-1.5 font-mono text-[11px]', tab === t ? 'text-emerald-600' : 'text-slate-400')}>
                {counts[t].toLocaleString()}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {tab === 'Emission Factors' && <EmissionFactorsTab canEdit={canEdit} />}
      {tab === 'Carbon Transactions' && <CarbonTransactionsTab canEdit={canEdit} />}
      {tab === 'Environmental Goals' && <EnvironmentalGoalsTab canEdit={canEdit} />}
      {tab === 'Product ESG Profiles' && <ProductProfilesTab canEdit={canEdit} />}
    </div>
  );
}

/* ------------------ 1. Emission Factors Tab ------------------ */
function EmissionFactorsTab({ canEdit }) {
  const [rows, setRows] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const load = async () => {
    try {
      const { data } = await emissionFactorsAPI.getAll({
        page,
        limit,
        search,
      });
      setRows(data.data.data || []);
      setTotal(data.data.pagination?.total || 0);
    } catch (e) {
      toast.error('Failed to load emission factors');
    }
  };

  useEffect(() => {
    load();
  }, [page, search]);

  const open = (row) => {
    setForm(row ? { ...row } : { name: '', source: 'MANUAL', unit: 'kWh', factor: 0, reference: '', status: 'ACTIVE' });
    setModal(row || {});
  };

  const save = async () => {
    try {
      if (form.id) {
        await emissionFactorsAPI.update(form.id, form);
        toast.success('Emission factor updated');
      } else {
        await emissionFactorsAPI.create(form);
        toast.success('Emission factor created');
      }
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };

  const remove = async (id) => {
    if (!confirm('Are you sure you want to delete this emission factor?')) return;
    try {
      await emissionFactorsAPI.remove(id);
      toast.success('Deleted successfully');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  if (!rows) return <PageLoader />;

  return (
    <Card
      title="Emission Factors Reference"
      action={
        canEdit && (
          <Button size="sm" onClick={() => open(null)}>
            <Plus className="h-4 w-4" /> New Factor
          </Button>
        )
      }
    >
      <div className="mb-4 flex max-w-sm items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or reference..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full bg-transparent outline-none"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No emission factors found" hint="Try adjusting your search or add a new factor." />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                  <th className="py-2 pr-4 font-semibold">Name</th>
                  <th className="py-2 pr-4 font-semibold">Source</th>
                  <th className="py-2 pr-4 font-semibold">Unit</th>
                  <th className="py-2 pr-4 font-semibold">Factor (kgCO₂e/unit)</th>
                  <th className="py-2 pr-4 font-semibold">Reference</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  {canEdit && <th className="py-2" />}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-slate-800">{r.name}</td>
                    <td className="py-3 pr-4">
                      <Badge>{r.source}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-slate-600 font-mono">{r.unit}</td>
                    <td className="py-3 pr-4 font-mono font-medium text-slate-800">{r.factor}</td>
                    <td className="py-3 pr-4 text-slate-500 italic">{r.reference || '—'}</td>
                    <td className="py-3 pr-4">
                      <Badge status={r.status} />
                    </td>
                    {canEdit && (
                      <td className="py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => open(r)} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => remove(r.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Simple Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
              <span className="text-slate-500">
                Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total} entries
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={form.id ? 'Edit Emission Factor' : 'New Emission Factor'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Electricity Grid India" />
          <Select
            label="Carbon Source Category"
            value={form.source || 'MANUAL'}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
          >
            <option value="PURCHASE">Purchase (Scope 2)</option>
            <option value="MANUFACTURING">Manufacturing (Scope 1)</option>
            <option value="EXPENSE">Expense (Scope 3)</option>
            <option value="FLEET">Fleet (Scope 1/3)</option>
            <option value="MANUAL">Manual Input</option>
          </Select>
          <Input label="Measurement Unit" value={form.unit || ''} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. kWh, liter, km, kg" />
          <Input
            label="Emissions Factor (kgCO₂e per unit)"
            type="number"
            step="0.0001"
            value={form.factor || ''}
            onChange={(e) => setForm({ ...form, factor: parseFloat(e.target.value) || 0 })}
          />
          <Input label="Reference Source" value={form.reference || ''} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="e.g. DEFRA 2024 / IPCC" />
          <Select label="Status" value={form.status || 'ACTIVE'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </Modal>
    </Card>
  );
}

/* ------------------ 2. Carbon Transactions Tab ------------------ */
function CarbonTransactionsTab({ canEdit }) {
  const [rows, setRows] = useState(null);
  const [factors, setFactors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [settings, setSettings] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState('');
  
  // Filters
  const [sourceFilter, setSourceFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const load = async () => {
    try {
      const [txnsRes, factorsRes, deptsRes, settingsRes] = await Promise.all([
        carbonTransactionsAPI.getAll({
          page,
          limit,
          search,
          source: sourceFilter || undefined,
          departmentId: deptFilter || undefined,
        }),
        emissionFactorsAPI.getAll({ all: 'true', status: 'ACTIVE' }),
        departmentsAPI.getAll({ all: 'true', status: 'ACTIVE' }),
        settingsAPI.get(),
      ]);

      setRows(txnsRes.data.data.data || []);
      setTotal(txnsRes.data.data.pagination?.total || 0);
      setFactors(factorsRes.data.data.emissionFactors || []);
      setDepartments(deptsRes.data.data.departments || []);
      setSettings(settingsRes.data.data.setting);
    } catch (e) {
      toast.error('Failed to load carbon transactions');
    }
  };

  useEffect(() => {
    load();
  }, [page, search, sourceFilter, deptFilter]);

  // Real-time calculation in modal
  useEffect(() => {
    if (modal && settings?.autoEmissionCalc && form.emissionFactorId) {
      const factorObj = factors.find(f => f.id === form.emissionFactorId);
      if (factorObj) {
        const computedCo2 = Number(form.quantity || 0) * factorObj.factor;
        if (form.co2Amount !== computedCo2) {
          setForm(f => ({ ...f, co2Amount: computedCo2 }));
        }
      }
    }
  }, [form.quantity, form.emissionFactorId, settings?.autoEmissionCalc, factors, modal]);

  const open = (row) => {
    const defaultDate = row?.date ? new Date(row.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    setForm(
      row
        ? { ...row, date: defaultDate }
        : {
            source: 'MANUAL',
            quantity: 0,
            co2Amount: 0,
            description: '',
            date: defaultDate,
            departmentId: departments[0]?.id || '',
            emissionFactorId: factors[0]?.id || '',
          }
    );
    setModal(row || {});
  };

  const save = async () => {
    try {
      if (form.id) {
        await carbonTransactionsAPI.update(form.id, form);
        toast.success('Carbon transaction updated');
      } else {
        await carbonTransactionsAPI.create(form);
        toast.success('Carbon transaction logged');
      }
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };

  const remove = async (id) => {
    if (!confirm('Are you sure you want to delete this carbon transaction?')) return;
    try {
      await carbonTransactionsAPI.remove(id);
      toast.success('Deleted successfully');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const generateSamples = async () => {
    try {
      toast.loading('Generating mock transactions...', { id: 'gen' });
      await carbonTransactionsAPI.generate();
      toast.success('Generated successfully', { id: 'gen' });
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Generation failed', { id: 'gen' });
    }
  };

  if (!rows) return <PageLoader />;

  return (
    <Card
      title="Carbon Accounting ledger"
      action={
        canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={generateSamples}>
              <Play className="h-4 w-4" /> Auto-Gen Samples
            </Button>
            <Button size="sm" onClick={() => open(null)}>
              <Plus className="h-4 w-4" /> Log Carbon Data
            </Button>
          </div>
        )
      }
    >
      {/* Search and Filters Bar */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by description, factor or dept..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-transparent outline-none"
          />
        </div>

        <Select
          className="w-auto"
          value={sourceFilter}
          onChange={(e) => {
            setSourceFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Sources</option>
          <option value="PURCHASE">Purchase</option>
          <option value="MANUFACTURING">Manufacturing</option>
          <option value="EXPENSE">Expense</option>
          <option value="FLEET">Fleet</option>
          <option value="MANUAL">Manual</option>
        </Select>

        <Select
          className="w-auto"
          value={deptFilter}
          onChange={(e) => {
            setDeptFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No transactions logged" hint="Try adjusting your filters, logging a new transaction, or auto-generating samples." />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4">Department</th>
                  <th className="py-2 pr-4">Emission Factor</th>
                  <th className="py-2 pr-4">Quantity</th>
                  <th className="py-2 pr-4">CO₂ Footprint (kgCO₂e)</th>
                  <th className="py-2 pr-4">Description</th>
                  {canEdit && <th className="py-2" />}
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pr-4 text-slate-600 font-mono">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge>{t.source}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-slate-700 font-medium">{t.department?.name || '—'}</td>
                    <td className="py-3 pr-4 text-slate-600">{t.emissionFactor?.name || '—'}</td>
                    <td className="py-3 pr-4 font-mono text-slate-600">
                      {t.quantity.toLocaleString()} {t.emissionFactor?.unit || ''}
                    </td>
                    <td className="py-3 pr-4 font-mono font-semibold text-rose-600">
                      {Math.round(t.co2Amount).toLocaleString()} kg
                    </td>
                    <td className="py-3 pr-4 text-slate-500 max-w-[200px] truncate" title={t.description}>
                      {t.description || '—'}
                    </td>
                    {canEdit && (
                      <td className="py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => open(t)} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => remove(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Simple Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
              <span className="text-slate-500">
                Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total} entries
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={form.id ? 'Edit Carbon Transaction' : 'Log Carbon Transaction'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select
            label="Carbon Source"
            value={form.source || 'MANUAL'}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
          >
            <option value="PURCHASE">Purchase</option>
            <option value="MANUFACTURING">Manufacturing</option>
            <option value="EXPENSE">Expense</option>
            <option value="FLEET">Fleet</option>
            <option value="MANUAL">Manual</option>
          </Select>

          <Select
            label="Department"
            value={form.departmentId || ''}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
          >
            <option value="">— select department —</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </Select>

          <Select
            label="Emission Factor"
            value={form.emissionFactorId || ''}
            onChange={(e) => setForm({ ...form, emissionFactorId: e.target.value })}
          >
            <option value="">— select factor —</option>
            {factors.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.factor} kg/unit)</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Quantity (${factors.find(f => f.id === form.emissionFactorId)?.unit || ''})`}
              type="number"
              value={form.quantity || 0}
              onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
            />

            <Input
              label="CO₂ Amount (kgCO₂e)"
              type="number"
              disabled={settings?.autoEmissionCalc}
              value={form.co2Amount || 0}
              onChange={(e) => setForm({ ...form, co2Amount: parseFloat(e.target.value) || 0 })}
              hint={settings?.autoEmissionCalc ? "Auto-computed from factor" : undefined}
            />
          </div>

          <Input
            label="Transaction Date"
            type="date"
            value={form.date || ''}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          <Input
            label="Description / Evidence Notes"
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="e.g. Q3 warehouse electricity bill"
          />
        </div>
      </Modal>
    </Card>
  );
}

/* ------------------ 3. Environmental Goals Tab ------------------ */
function EnvironmentalGoalsTab({ canEdit }) {
  const [rows, setRows] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const load = async () => {
    try {
      const [goalsRes, deptsRes] = await Promise.all([
        environmentalGoalsAPI.getAll({
          page,
          limit,
        }),
        departmentsAPI.getAll({ all: 'true', status: 'ACTIVE' }),
      ]);
      setRows(goalsRes.data.data.data || []);
      setTotal(goalsRes.data.data.pagination?.total || 0);
      setDepartments(deptsRes.data.data.departments || []);
    } catch (e) {
      toast.error('Failed to load goals');
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const open = (row) => {
    const defaultDeadline = row?.deadline ? new Date(row.deadline).toISOString().split('T')[0] : '';
    setForm(
      row
        ? { ...row, deadline: defaultDeadline }
        : { name: '', targetCo2: 0, currentCo2: 0, deadline: '', status: 'ACTIVE', departmentId: departments[0]?.id || '' }
    );
    setModal(row || {});
  };

  const save = async () => {
    try {
      if (form.id) {
        await environmentalGoalsAPI.update(form.id, form);
        toast.success('Environmental goal updated');
      } else {
        await environmentalGoalsAPI.create(form);
        toast.success('Environmental goal created');
      }
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };

  const remove = async (id) => {
    if (!confirm('Are you sure you want to delete this sustainability goal?')) return;
    try {
      await environmentalGoalsAPI.remove(id);
      toast.success('Deleted successfully');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  if (!rows) return <PageLoader />;

  return (
    <Card
      title="Sustainability Targets & Goals"
      action={
        canEdit && (
          <Button size="sm" onClick={() => open(null)}>
            <Plus className="h-4 w-4" /> New Goal
          </Button>
        )
      }
    >
      {rows.length === 0 ? (
        <EmptyState title="No environmental goals set" hint="Define carbon reduction targets to monitor progress." />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {rows.map((g) => {
              const progressPct = g.targetCo2 > 0 ? (g.currentCo2 / g.targetCo2) * 100 : 0;
              const displayProgress = Math.min(100, Math.max(0, progressPct));
              
              return (
                <div key={g.id} className="relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-800 text-base">{g.name}</h4>
                        <span className="text-xs text-slate-400 mt-0.5 block">{g.department?.name || 'All Organization'}</span>
                      </div>
                      <Badge status={g.status}>{g.status}</Badge>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs text-slate-500 font-mono">
                        <span>Current: {Math.round(g.currentCo2).toLocaleString()} kg</span>
                        <span>Target Limit: {Math.round(g.targetCo2).toLocaleString()} kg</span>
                      </div>
                      <ScoreBar value={displayProgress} />
                      <div className="text-right text-[10px] text-slate-400 font-medium">
                        {Math.round(progressPct)}% of Limit Reached
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Deadline: {g.deadline ? new Date(g.deadline).toLocaleDateString() : 'No Limit'}
                    </span>
                    {canEdit && (
                      <div className="flex gap-1">
                        <button onClick={() => open(g)} className="p-1 text-slate-400 hover:text-emerald-600 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => remove(g.id)} className="p-1 text-slate-400 hover:text-rose-600 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Simple Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
              <span className="text-slate-500">
                Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total} entries
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={form.id ? 'Edit Environmental Target' : 'New Environmental Target'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Goal / Target Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Limit Logistics Emissions" />
          
          <Select
            label="Department"
            value={form.departmentId || ''}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
          >
            <option value="">— all organization —</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Target Limit CO₂ (kg)"
              type="number"
              value={form.targetCo2 || 0}
              onChange={(e) => setForm({ ...form, targetCo2: parseFloat(e.target.value) || 0 })}
            />

            <Input
              label="Current CO₂ (kg)"
              type="number"
              value={form.currentCo2 || 0}
              onChange={(e) => setForm({ ...form, currentCo2: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <Input
            label="Target Deadline"
            type="date"
            value={form.deadline || ''}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />

          <Select label="Status" value={form.status || 'ACTIVE'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Active</option>
            <option value="ON_TRACK">On Track</option>
            <option value="COMPLETED">Completed</option>
          </Select>
        </div>
      </Modal>
    </Card>
  );
}

/* ------------------ 4. Product ESG Profiles Tab ------------------ */
function ProductProfilesTab({ canEdit }) {
  const [rows, setRows] = useState(null);
  const [factors, setFactors] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const load = async () => {
    try {
      const [profilesRes, factorsRes] = await Promise.all([
        productProfilesAPI.getAll({
          page,
          limit,
          search,
        }),
        emissionFactorsAPI.getAll({ all: 'true', status: 'ACTIVE' }),
      ]);
      setRows(profilesRes.data.data.data || []);
      setTotal(profilesRes.data.data.pagination?.total || 0);
      setFactors(factorsRes.data.data.emissionFactors || []);
    } catch (e) {
      toast.error('Failed to load product profiles');
    }
  };

  useEffect(() => {
    load();
  }, [page, search]);

  const open = (row) => {
    setForm(
      row
        ? { ...row, emissionFactorId: row.emissionFactorId || '' }
        : { name: '', category: '', carbonFootprint: 0, recyclablePct: 0, status: 'ACTIVE', emissionFactorId: '' }
    );
    setModal(row || {});
  };

  const save = async () => {
    try {
      const payload = {
        ...form,
        emissionFactorId: form.emissionFactorId || null,
      };
      if (form.id) {
        await productProfilesAPI.update(form.id, payload);
        toast.success('Product ESG profile updated');
      } else {
        await productProfilesAPI.create(payload);
        toast.success('Product ESG profile created');
      }
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };

  const remove = async (id) => {
    if (!confirm('Are you sure you want to delete this product profile?')) return;
    try {
      await productProfilesAPI.remove(id);
      toast.success('Deleted successfully');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  if (!rows) return <PageLoader />;

  return (
    <Card
      title="Product Sustainability & ESG Catalog"
      action={
        canEdit && (
          <Button size="sm" onClick={() => open(null)}>
            <Plus className="h-4 w-4" /> New Profile
          </Button>
        )
      }
    >
      <div className="mb-4 flex max-w-sm items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by product name or category..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full bg-transparent outline-none"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No product ESG profiles" hint="Add products and their carbon footprint properties." />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                  <th className="py-2 pr-4">Product Name</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Carbon Footprint</th>
                  <th className="py-2 pr-4">Recyclable %</th>
                  <th className="py-2 pr-4">Linked Emission Factor</th>
                  <th className="py-2 pr-4">Status</th>
                  {canEdit && <th className="py-2" />}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-slate-800">{p.name}</td>
                    <td className="py-3 pr-4 text-slate-600">{p.category || '—'}</td>
                    <td className="py-3 pr-4 font-mono font-medium text-rose-600">
                      {p.carbonFootprint} kgCO₂e
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${p.recyclablePct}%` }} />
                        </div>
                        <span className="font-mono text-slate-700">{p.recyclablePct}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-500">{p.emissionFactor?.name || '—'}</td>
                    <td className="py-3 pr-4">
                      <Badge status={p.status} />
                    </td>
                    {canEdit && (
                      <td className="py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => open(p)} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => remove(p.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Simple Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
              <span className="text-slate-500">
                Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total} entries
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={form.id ? 'Edit Product ESG Profile' : 'New Product ESG Profile'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Product Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Eco Glass Bottle 1L" />
          <Input label="Category" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Packaging, Logistics" />
          
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Carbon Footprint (kgCO₂e)"
              type="number"
              step="0.01"
              value={form.carbonFootprint || 0}
              onChange={(e) => setForm({ ...form, carbonFootprint: parseFloat(e.target.value) || 0 })}
            />

            <Input
              label="Recyclable Percentage (%)"
              type="number"
              min="0"
              max="100"
              value={form.recyclablePct || 0}
              onChange={(e) => setForm({ ...form, recyclablePct: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <Select
            label="Linked Emission Factor Reference (Optional)"
            value={form.emissionFactorId || ''}
            onChange={(e) => setForm({ ...form, emissionFactorId: e.target.value })}
          >
            <option value="">— none —</option>
            {factors.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.factor} kg/unit)</option>
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
