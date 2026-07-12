import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Filter, Download, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  Button, Card, PageHeader, EmptyState
} from '../../components/ui';
import { reportsAPI, challengesAPI } from '../../services/gamification';
import { departmentsAPI, usersAPI, categoriesAPI } from '../../services/api';
import { downloadCSV, downloadExcel, downloadPDF } from '../../lib/utils';

const REPORT_CARDS = [
  {
    key: 'environmental',
    label: 'Environmental',
    emoji: '🌿',
    accent: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-600',
    description: 'Carbon transactions, emission factors, environmental goals',
    fn: (p) => reportsAPI.environmental(p),
    flattenRows: (d) => (d.transactions || []).map(t => ({
      date: t.date?.split('T')[0] || '',
      department: t.department?.name || '',
      source: t.source,
      description: t.description || '',
      quantity: t.quantity,
      co2Amount: t.co2Amount,
      factor: t.emissionFactor?.name || '',
    })),
  },
  {
    key: 'social',
    label: 'Social',
    emoji: '👥',
    accent: 'bg-sky-50 border-sky-200',
    iconColor: 'text-sky-600',
    description: 'CSR activities, employee participations',
    fn: (p) => reportsAPI.social(p),
    flattenRows: (d) => (d.participations || []).map(p => ({
      date: p.createdAt?.split('T')[0] || '',
      employee: p.employee?.name || '',
      department: p.employee?.department?.name || '',
      activity: p.activity?.title || '',
      status: p.approvalStatus,
      pointsEarned: p.pointsEarned,
    })),
  },
  {
    key: 'governance',
    label: 'Governance',
    emoji: '🏛',
    accent: 'bg-violet-50 border-violet-200',
    iconColor: 'text-violet-600',
    description: 'ESG policies, audits, compliance issues',
    fn: (p) => reportsAPI.governance(p),
    flattenRows: (d) => (d.issues || []).map(i => ({
      date: i.createdAt?.split('T')[0] || '',
      title: i.title,
      severity: i.severity,
      status: i.status,
      owner: i.owner?.name || '',
      dueDate: i.dueDate?.split('T')[0] || '',
    })),
  },
  {
    key: 'summary',
    label: 'ESG Summary',
    emoji: '📊',
    accent: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-600',
    description: 'Cross-module ESG overview and top performers',
    fn: (p) => reportsAPI.summary(p),
    flattenRows: (d) => (d.topUsers || []).map(u => ({
      rank: (d.topUsers.indexOf(u) + 1),
      name: u.name,
      xp: u.xp,
      points: u.points,
    })),
  },
];

// Generic summary stats renderer
function SummaryPanel({ reportKey, data }) {
  if (!data) return null;

  if (reportKey === 'environmental') {
    return (
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-emerald-50 p-3 text-center">
          <p className="text-xs text-slate-500">Total CO₂</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{(data.summary?.totalCo2 || 0).toFixed(2)} kg</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">Transactions</p>
          <p className="mt-1 text-xl font-bold text-slate-700">{data.summary?.totalTransactions || 0}</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-3 text-center">
          <p className="text-xs text-slate-500">Goals Tracked</p>
          <p className="mt-1 text-xl font-bold text-blue-700">{(data.goals || []).length}</p>
        </div>
      </div>
    );
  }
  if (reportKey === 'social') {
    const s = data.summary || {};
    return (
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {['PENDING','APPROVED','REJECTED'].map(k => (
          <div key={k} className="rounded-lg bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500">{k}</p>
            <p className="mt-1 text-xl font-bold text-slate-700">{s.byStatus?.[k] || 0}</p>
          </div>
        ))}
        <div className="rounded-lg bg-sky-50 p-3 text-center">
          <p className="text-xs text-slate-500">Total Pts Earned</p>
          <p className="mt-1 text-xl font-bold text-sky-700">{s.totalPoints || 0}</p>
        </div>
      </div>
    );
  }
  if (reportKey === 'governance') {
    const s = data.summary || {};
    return (
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-violet-50 p-3 text-center">
          <p className="text-xs text-slate-500">Policies</p>
          <p className="mt-1 text-xl font-bold text-violet-700">{s.totalPolicies || 0}</p>
        </div>
        {['OPEN','IN_PROGRESS','RESOLVED'].map(k => (
          <div key={k} className="rounded-lg bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500">{k.replace('_', ' ')}</p>
            <p className="mt-1 text-xl font-bold text-slate-700">{s.issuesByStatus?.[k] || 0}</p>
          </div>
        ))}
      </div>
    );
  }
  if (reportKey === 'summary') {
    return (
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-emerald-50 p-3 text-center">
          <p className="text-xs text-slate-500">Total CO₂</p>
          <p className="mt-1 text-lg font-bold text-emerald-700">{(data.environmental?.totalCo2 || 0).toFixed(1)} kg</p>
        </div>
        <div className="rounded-lg bg-sky-50 p-3 text-center">
          <p className="text-xs text-slate-500">CSR Approved</p>
          <p className="mt-1 text-lg font-bold text-sky-700">{data.social?.approvedParticipations || 0}</p>
        </div>
        <div className="rounded-lg bg-violet-50 p-3 text-center">
          <p className="text-xs text-slate-500">Open Issues</p>
          <p className="mt-1 text-lg font-bold text-violet-700">{data.governance?.openIssues || 0}</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-3 text-center">
          <p className="text-xs text-slate-500">Badges Awarded</p>
          <p className="mt-1 text-lg font-bold text-amber-700">{data.gamification?.badgesAwarded || 0}</p>
        </div>
      </div>
    );
  }
  return null;
}

// Generic table renderer
function DataTable({ rows }) {
  if (!rows?.length) return <EmptyState icon="📭" title="No data for the selected filters" />;
  const headers = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {headers.map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {h.replace(/([A-Z])/g, ' $1').trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              {headers.map(h => (
                <td key={h} className="px-4 py-2.5 text-slate-700">
                  {row[h] == null ? '—' : String(row[h])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Export buttons (CSV / Excel / PDF) ──────────────────────────────────────
function ExportButtons({ rows, name = 'report', title = 'Report' }) {
  if (!rows?.length) return null;
  return (
    <div className="flex gap-1">
      <Button size="sm" variant="secondary" onClick={() => { downloadCSV(rows, `${name}.csv`); toast.success('CSV downloaded'); }}>
        <Download className="h-4 w-4" /> CSV
      </Button>
      <Button size="sm" variant="secondary" onClick={() => { downloadExcel(rows, `${name}.xlsx`); toast.success('Excel downloaded'); }}>
        Excel
      </Button>
      <Button size="sm" variant="secondary" onClick={() => { downloadPDF(rows, `${name}.pdf`, title); toast.success('PDF downloaded'); }}>
        PDF
      </Button>
    </div>
  );
}

// ─── Single Report Card ───────────────────────────────────────────────────────
function ReportCard({ card, departments }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [rows, setRows] = useState([]);
  const [params, setParams] = useState({ department: '', startDate: '', endDate: '' });

  const generate = async () => {
    setLoading(true);
    try {
      const p = {};
      if (params.department) p.department = params.department;
      if (params.startDate) p.startDate = params.startDate;
      if (params.endDate) p.endDate = params.endDate;
      const res = await card.fn(p);
      const d = res.data.data;
      setData(d);
      setRows(card.flattenRows(d));
      setExpanded(true);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!rows.length) return toast.error('Generate the report first');
    downloadCSV(rows, `${card.key}-report.csv`);
    toast.success('CSV downloaded!');
  };

  return (
    <div className={`rounded-xl border ${card.accent} p-5`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{card.emoji}</span>
          <div>
            <h3 className="font-semibold text-slate-800">{card.label} Report</h3>
            <p className="text-xs text-slate-500">{card.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" loading={loading} onClick={generate}>
            <RefreshCw className="h-4 w-4" /> Generate
          </Button>
          {rows.length > 0 && (
            <ExportButtons rows={rows} name={`${card.key}-report`} title={`${card.label} Report`} />
          )}
          {data && (
            <button onClick={() => setExpanded(e => !e)} className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mt-3 flex flex-wrap gap-2">
        <select
          value={params.department}
          onChange={e => setParams(p => ({ ...p, department: e.target.value }))}
          className="rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-emerald-500"
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input
          type="date"
          value={params.startDate}
          onChange={e => setParams(p => ({ ...p, startDate: e.target.value }))}
          className="rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-emerald-500"
        />
        <input
          type="date"
          value={params.endDate}
          onChange={e => setParams(p => ({ ...p, endDate: e.target.value }))}
          className="rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-emerald-500"
        />
      </div>

      {expanded && data && (
        <div className="mt-4">
          <SummaryPanel reportKey={card.key} data={data} />
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Data Table ({rows.length} rows)</p>
          <DataTable rows={rows} />
        </div>
      )}
    </div>
  );
}

// ─── Custom Report Builder ────────────────────────────────────────────────────
function CustomReportBuilder({ departments }) {
  const [filters, setFilters] = useState({ module: '', department: '', employee: '', challenge: '', category: '', startDate: '', endDate: '' });
  const [employees, setEmployees] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState(null);

  useEffect(() => {
    usersAPI.getAll({ limit: 200 }).then((r) => setEmployees(r.data.data.data || [])).catch(() => {});
    challengesAPI.getAll({ all: 'true' }).then((r) => setChallenges(r.data.data.challenges || [])).catch(() => {});
    categoriesAPI.getAll().then((r) => setCategories(r.data.data.categories || [])).catch(() => {});
  }, []);

  const run = async () => {
    setLoading(true);
    try {
      const p = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) p[k] = v; });
      const res = await reportsAPI.custom(p);
      setRows(res.data.data.rows || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to run report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!rows?.length) return toast.error('Run the report first');
    downloadCSV(rows, 'custom-report.csv');
    toast.success('CSV downloaded!');
  };

  return (
    <Card title="🔧 Custom Report Builder">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={filters.module}
            onChange={e => setFilters(f => ({ ...f, module: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 bg-white"
          >
            <option value="">All Modules</option>
            <option value="environmental">Environmental</option>
            <option value="social">Social</option>
            <option value="governance">Governance</option>
            <option value="gamification">Gamification</option>
          </select>
          <select
            value={filters.department}
            onChange={e => setFilters(f => ({ ...f, department: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 bg-white"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select
            value={filters.employee}
            onChange={e => setFilters(f => ({ ...f, employee: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 bg-white"
          >
            <option value="">All Employees</option>
            {employees.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select
            value={filters.challenge}
            onChange={e => setFilters(f => ({ ...f, challenge: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 bg-white"
          >
            <option value="">All Challenges</option>
            {challenges.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <select
            value={filters.category}
            onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 bg-white"
          >
            <option value="">All ESG Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
            placeholder="Start Date"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
            placeholder="End Date"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-2">
          <Button loading={loading} onClick={run}>
            <Filter className="h-4 w-4" /> Run Report
          </Button>
          {rows?.length > 0 && <ExportButtons rows={rows} name="custom-report" title="Custom Report" />}
        </div>
        {rows !== null && (
          <div>
            <p className="mb-2 text-xs text-slate-500">{rows.length} results</p>
            <DataTable rows={rows} />
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Main Reports Page ────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [departments, setDepartments] = useState([]);
  const [depsLoading, setDepsLoading] = useState(true);

  useEffect(() => {
    departmentsAPI.getAll({ all: 'true' })
      .then(res => setDepartments(res.data.data.departments || []))
      .catch(() => {})
      .finally(() => setDepsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="📈 Reports"
        subtitle="Generate, analyze and export ESG reports across all modules"
      />

      <div className="space-y-4">
        {REPORT_CARDS.map(card => (
          <ReportCard key={card.key} card={card} departments={departments} />
        ))}
      </div>

      <CustomReportBuilder departments={departments} />
    </div>
  );
}
