import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Cloud, Trophy, AlertTriangle, Clock, Users, Award, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { dashboardAPI } from '../services/api';
import { Card, StatCard, PageHeader, PageLoader, ScoreBar, Button, Badge } from '../components/ui';
import { fmtNum } from '../lib/utils';
import { CHART_COLORS } from '../config/constants';

const scoreColor = (v) => (v >= 75 ? '#059669' : v >= 50 ? '#f59e0b' : '#ef4444');

function ScoreTile({ label, value, highlight }) {
  return (
    <div
      className={
        highlight
          ? 'rounded-xl border-2 border-emerald-500 bg-emerald-50 p-5 shadow-sm'
          : 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm'
      }
    >
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-1 flex items-end gap-1">
        <span className="text-3xl font-bold" style={{ color: scoreColor(value) }}>
          {value}
        </span>
        <span className="mb-1 text-sm text-slate-400">/ 100</span>
      </div>
      <div className="mt-3">
        <ScoreBar value={value} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await dashboardAPI.get();
      setData(res.data.data);
    } catch {
      toast.error('Failed to load dashboard');
    }
  };
  useEffect(() => {
    load();
  }, []);

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

  return (
    <div>
      <PageHeader
        title="ESG Dashboard"
        subtitle="Executive overview of organizational sustainability performance"
        actions={
          <Button variant="outline" size="sm" onClick={recompute} loading={busy}>
            <RefreshCw className="h-4 w-4" /> Recompute
          </Button>
        }
      />

      {/* Score tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <ScoreTile label="Environmental" value={scores.environmental} />
        <ScoreTile label="Social" value={scores.social} />
        <ScoreTile label="Governance" value={scores.governance} />
        <ScoreTile label="Overall ESG" value={scores.overall} highlight />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Weighted E {scores.weights.env}% · S {scores.weights.social}% · G {scores.weights.gov}% ·
        overall = employee-weighted average of department scores
      </p>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total CO₂e (kg)" value={fmtNum(kpis.totalCo2)} icon={<Cloud className="h-5 w-5" />} />
        <StatCard label="Active Challenges" value={kpis.activeChallenges} icon={<Trophy className="h-5 w-5" />} accent="violet" />
        <StatCard
          label="Open Issues"
          value={kpis.openIssues}
          sub={kpis.overdueIssues > 0 ? `${kpis.overdueIssues} overdue` : 'none overdue'}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="rose"
        />
        <StatCard label="Pending Approvals" value={kpis.pendingApprovals} icon={<Clock className="h-5 w-5" />} accent="amber" />
        <StatCard label="Employees" value={kpis.totalEmployees} icon={<Users className="h-5 w-5" />} accent="sky" />
        <StatCard label="Badges Awarded" value={kpis.badgesAwarded} icon={<Award className="h-5 w-5" />} />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="📈 Emissions Trend (12 months)">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={emissionsTrend} margin={{ left: -10, right: 10, top: 5 }}>
              <defs>
                <linearGradient id="co2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip formatter={(v) => [`${fmtNum(v)} kg`, 'CO₂e']} />
              <Area type="monotone" dataKey="co2" stroke="#059669" strokeWidth={2} fill="url(#co2)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="📊 Department ESG Ranking">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={departmentRanking} margin={{ left: -10, right: 10, top: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="code" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip formatter={(v) => [v, 'Total Score']} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {departmentRanking.map((d, i) => (
                  <Cell key={d.departmentId} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Ranking table + activity */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="🏆 Department Leaderboard">
          <div className="space-y-3">
            {departmentRanking.map((d, i) => (
              <div key={d.departmentId} className="flex items-center gap-3">
                <span className="w-6 text-center font-bold text-slate-400">{i + 1}</span>
                <div className="flex-1">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {d.name} <span className="text-slate-400">({d.code})</span>
                    </span>
                    <span className="font-semibold text-slate-800">{d.total}</span>
                  </div>
                  <ScoreBar value={d.total} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="🕒 Recent Activity">
          {recentActivity.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No recent activity</p>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((a, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-lg">{a.icon}</span>
                  <span className="text-slate-600">{a.text}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
