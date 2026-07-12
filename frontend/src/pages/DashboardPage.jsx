import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Cloud, Trophy, AlertTriangle, Clock, Users, Award, RefreshCw, CheckCircle2 } from 'lucide-react';

const ACT_ICON = { CARBON: Cloud, ISSUE: AlertTriangle, CSR: CheckCircle2, BADGE: Award };
import toast from 'react-hot-toast';
import { dashboardAPI } from '../services/api';
import { Card, StatCard, PageHeader, PageLoader, Button } from '../components/ui';
import { fmtNum } from '../lib/utils';
import { useAuthStore } from '../store/authStore';

const PILLARS = [
  { key: 'environmental', label: 'Environmental', dot: '#5EA97E', bar: '#3E7C57' },
  { key: 'social', label: 'Social', dot: '#7C93C4', bar: '#4E71A8' },
  { key: 'governance', label: 'Governance', dot: '#9D8AC9', bar: '#7A64AE' },
];

function Donut({ value }) {
  const R = 44;
  const C = 2 * Math.PI * R;
  const dash = (Math.min(100, value) / 100) * C;
  return (
    <div className="relative h-[104px] w-[104px] flex-shrink-0">
      <svg width="104" height="104" viewBox="0 0 104 104">
        <circle cx="52" cy="52" r={R} fill="none" stroke="#24382C" strokeWidth="9" />
        <circle
          cx="52" cy="52" r={R} fill="none" stroke="#5EA97E" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${dash} ${C - dash}`} transform="rotate(-90 52 52)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[27px] font-semibold text-[#F3F1E9]">{value}</span>
        <span className="font-mono text-[10px] text-[#9FAF9F]">/ 100</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setData((await dashboardAPI.get()).data.data);
    } catch {
      toast.error('Failed to load dashboard');
    }
  };
  useEffect(() => { load(); }, []);

  const recompute = async () => {
    setBusy(true);
    try {
      await dashboardAPI.recompute();
      await load();
      toast.success('ESG scores recomputed');
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <PageLoader />;
  const { scores, kpis, emissionsTrend, departmentRanking, recentActivity } = data;

  const ranks = departmentRanking || [];
  const avg = ranks.length ? ranks.reduce((s, d) => s + d.total, 0) / ranks.length : 0;

  const attention = [];
  if (kpis.pendingApprovals > 0)
    attention.push({ dot: '#B58734', title: `${kpis.pendingApprovals} approval${kpis.pendingApprovals > 1 ? 's' : ''} waiting`, sub: 'CSR & challenge submissions', to: '/social', cta: 'Review' });
  if (kpis.overdueIssues > 0)
    attention.push({ dot: '#B44E36', title: `${kpis.overdueIssues} overdue compliance issue${kpis.overdueIssues > 1 ? 's' : ''}`, sub: 'past due date, unresolved', to: '/governance', cta: 'Open' });
  if (kpis.openIssues > 0)
    attention.push({ dot: '#B58734', title: `${kpis.openIssues} open compliance issue${kpis.openIssues > 1 ? 's' : ''}`, sub: 'awaiting resolution', to: '/governance', cta: 'View' });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        subtitle={`Weighted E ${scores.weights.env}% · S ${scores.weights.social}% · G ${scores.weights.gov}% — rolled up across departments`}
        actions={
          isManager ? (
            <Button variant="secondary" size="sm" onClick={recompute} loading={busy}>
              <RefreshCw className="h-4 w-4" /> Recompute
            </Button>
          ) : null
        }
      />

      {/* Scores */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.15fr_1fr_1fr_1fr]">
        <div className="flex items-center gap-5 rounded-xl bg-[#14231B] p-5">
          <Donut value={scores.overall} />
          <div className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-semibold text-[#C6D2C6]">Overall ESG score</span>
            <span className="font-mono text-[11px] text-[#5EA97E]">weighted rollup</span>
            <span className="text-[11.5px] leading-snug text-[#9FAF9F]">Across {ranks.length} departments</span>
          </div>
        </div>
        {PILLARS.map((p) => {
          const v = scores[p.key];
          return (
            <div key={p.key} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4">
              <span className="flex items-center gap-2 text-[12.5px] font-semibold text-slate-600">
                <span className="h-[7px] w-[7px] rounded-full" style={{ background: p.dot }} />
                {p.label}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[30px] font-semibold text-slate-800">{v}</span>
                <span className="font-mono text-[11px] text-slate-400">/ 100</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-2 rounded-full" style={{ width: `${v}%`, background: p.bar }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total CO₂e (kg)" value={fmtNum(kpis.totalCo2)} icon={<Cloud className="h-5 w-5" />} />
        <StatCard label="Active Challenges" value={kpis.activeChallenges} icon={<Trophy className="h-5 w-5" />} accent="violet" />
        <StatCard label="Open Issues" value={kpis.openIssues} sub={kpis.overdueIssues > 0 ? `${kpis.overdueIssues} overdue` : 'none overdue'} icon={<AlertTriangle className="h-5 w-5" />} accent="rose" />
        <StatCard label="Pending Approvals" value={kpis.pendingApprovals} icon={<Clock className="h-5 w-5" />} accent="amber" />
        <StatCard label="Employees" value={kpis.totalEmployees} icon={<Users className="h-5 w-5" />} accent="sky" />
        <StatCard label="Badges Awarded" value={kpis.badgesAwarded} icon={<Award className="h-5 w-5" />} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card title="Emissions trend">
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={emissionsTrend} margin={{ left: -12, right: 8, top: 6 }}>
              <defs>
                <linearGradient id="co2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3E7C57" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#3E7C57" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 4" stroke="#ECEAE0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10.5, fontFamily: 'IBM Plex Mono', fill: '#8C968E' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10.5, fontFamily: 'IBM Plex Mono', fill: '#8C968E' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${fmtNum(v)} kg`, 'CO₂e']} contentStyle={{ borderRadius: 8, border: '1px solid #E4E2D8', fontSize: 12 }} />
              <Area type="monotone" dataKey="co2" stroke="#3E7C57" strokeWidth={2.5} fill="url(#co2)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Department ESG ranking">
          <div className="space-y-3">
            {ranks.map((d) => {
              const flagged = d.total < avg - 8;
              return (
                <div key={d.departmentId} className="flex items-center gap-2.5">
                  <span className="w-24 flex-shrink-0 truncate text-[12px] text-slate-600">{d.name}</span>
                  <div className="h-2 flex-1 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full" style={{ width: `${d.total}%`, background: flagged ? '#B58734' : '#3E7C57' }} />
                  </div>
                  <span className="w-6 text-right font-mono text-[11.5px] text-slate-700">{d.total}</span>
                </div>
              );
            })}
            {ranks.some((d) => d.total < avg - 8) && (
              <p className="font-mono text-[10.5px] text-slate-500">
                {ranks.filter((d) => d.total < avg - 8).map((d) => d.code).join(', ')} flagged — below company average
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Attention · Activity · Quick actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          title="Needs your attention"
          action={
            <span className="rounded-full bg-rose-100 px-2 py-0.5 font-mono text-[11px] text-rose-700">
              {attention.length}
            </span>
          }
        >
          {attention.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">All clear</p>
          ) : (
            <div className="space-y-3.5">
              {attention.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-[7px] w-[7px] flex-shrink-0 rounded-full" style={{ background: a.dot }} />
                  <div className="flex-1">
                    <p className="text-[12.5px] font-medium text-slate-700">{a.title}</p>
                    <p className="font-mono text-[10.5px] text-slate-500">{a.sub}</p>
                  </div>
                  <button onClick={() => navigate(a.to)} className="text-[12px] font-semibold text-emerald-600 hover:underline">
                    {a.cta}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Recent activity">
          {recentActivity.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No recent activity</p>
          ) : (
            <div className="space-y-3.5">
              {recentActivity.map((a, i) => {
                const I = ACT_ICON[a.type] || Award;
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <I className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                    <span className="flex-1 text-[12.5px] leading-snug text-slate-600">{a.text}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Quick actions">
          <div className="space-y-2.5">
            {isManager ? (
              <>
                <Button className="w-full" onClick={() => navigate('/environmental')}>Log carbon data</Button>
                <Button variant="secondary" className="w-full" onClick={() => navigate('/gamification')}>Start a challenge</Button>
                <Button variant="secondary" className="w-full" onClick={() => navigate('/reports')}>View reports</Button>
                <p className="pt-1 font-mono text-[10.5px] text-slate-500">Scores recompute from live module data</p>
              </>
            ) : (
              <>
                <Button className="w-full" onClick={() => navigate('/gamification')}>Join a challenge</Button>
                <Button variant="secondary" className="w-full" onClick={() => navigate('/social')}>Join a CSR activity</Button>
                <Button variant="secondary" className="w-full" onClick={() => navigate('/governance')}>Acknowledge a policy</Button>
                <p className="pt-1 font-mono text-[10.5px] text-slate-500">Earn XP & points across all three pillars</p>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
