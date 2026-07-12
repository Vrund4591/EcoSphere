import ModulePlaceholder from './ModulePlaceholder';
import ActualEnvironmentalPage from './environmental/EnvironmentalPage';
import ActualSocialPage from './social/SocialPage';
import ActualGovernancePage from './governance/GovernancePage';
import ActualGamificationPage from './gamification/GamificationPage';
import ActualReportsPage from './reports/ReportsPage';

export function EnvironmentalPage() {
  return <ActualEnvironmentalPage />;
}

export function SocialPage() {
  return <ActualSocialPage />;
}

export function GovernancePage() {
  return <ActualGovernancePage />;
}

export function GamificationPage() {
  return <ActualGamificationPage />;
}

export function ReportsPage() {
  return <ActualReportsPage />;
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

