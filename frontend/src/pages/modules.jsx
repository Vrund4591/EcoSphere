import ModulePlaceholder from './ModulePlaceholder';

export function EnvironmentalPage() {
  return (
    <ModulePlaceholder
      emoji="🌱"
      title="Environmental"
      subtitle="Carbon accounting, emission factors & sustainability goals"
      owner="P2"
      sections={[
        'Emission Factors',
        'Carbon Transactions (auto-calculated)',
        'Environmental Goals',
        'Product ESG Profiles',
        'Emissions trend & department carbon',
        'Environmental Report',
      ]}
    />
  );
}

export function SocialPage() {
  return (
    <ModulePlaceholder
      emoji="👥"
      title="Social"
      subtitle="CSR activities, employee participation & diversity"
      owner="P3"
      sections={[
        'CSR Activities',
        'Employee Participation (approval queue)',
        'Evidence requirement enforcement',
        'Diversity Dashboard',
        'Training Completion',
        'Social Report',
      ]}
    />
  );
}

export function GovernancePage() {
  return (
    <ModulePlaceholder
      emoji="🏛"
      title="Governance"
      subtitle="Policies, audits & compliance tracking"
      owner="P3"
      sections={[
        'ESG Policies',
        'Policy Acknowledgements',
        'Audits',
        'Compliance Issues (owner + due date + overdue)',
        'Governance Report',
      ]}
    />
  );
}

export function GamificationPage() {
  return (
    <ModulePlaceholder
      emoji="🏆"
      title="Gamification"
      subtitle="Challenges, badges, rewards & leaderboards"
      owner="P4"
      sections={[
        'Challenges (Draft → Active → Under Review → Completed)',
        'Challenge Participation (XP award)',
        'Badges (auto-awarded)',
        'Rewards (redeem with points)',
        'Leaderboard',
      ]}
    />
  );
}

export function ReportsPage() {
  return (
    <ModulePlaceholder
      emoji="📈"
      title="Reports"
      subtitle="Analytics & custom report builder"
      owner="P4"
      sections={[
        'Environmental Report',
        'Social Report',
        'Governance Report',
        'ESG Summary Report',
        'Custom Report Builder (filters)',
        'Export: PDF / Excel / CSV',
      ]}
    />
  );
}

export function NotFoundPage() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center text-center">
      <span className="text-5xl">🌵</span>
      <h1 className="mt-3 text-2xl font-bold text-slate-800">Page not found</h1>
      <a href="/dashboard" className="mt-3 text-emerald-600 hover:underline">
        Back to dashboard
      </a>
    </div>
  );
}
