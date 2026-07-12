import { PageHeader, Card } from '../components/ui';

/**
 * Styled placeholder for module pages that a teammate will implement.
 * Lists the expected sub-sections so the owner has a clear checklist.
 */
export default function ModulePlaceholder({ emoji, title, subtitle, owner, sections = [] }) {
  return (
    <div>
      <PageHeader title={`${emoji} ${title}`} subtitle={subtitle} />
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            In progress
          </span>
          {owner && <span className="text-sm text-slate-500">Owner: {owner}</span>}
        </div>
        <p className="mb-4 text-sm text-slate-600">
          This module is being built. Sections to implement:
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {sections.map((s) => (
            <li
              key={s}
              className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {s}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs text-slate-400">
          Clone the pattern from <code>Settings → Departments</code> (list + create/edit/delete) and
          the backend <code>department.controller.js</code>.
        </p>
      </Card>
    </div>
  );
}
