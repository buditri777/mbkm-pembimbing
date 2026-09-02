import Link from "next/link";

export default function TopBar({
  title,
  subtitle,
  sessionName,
  roleLabel,
  right,
}: {
  title: string;
  subtitle?: string;
  sessionName?: string;
  roleLabel?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
            M
          </div>
          <div className="min-w-0">
            <div className="truncate font-bold text-slate-800">{title}</div>
            {subtitle && <div className="truncate text-xs text-slate-500">{subtitle}</div>}
          </div>
        </Link>
        <div className="flex shrink-0 items-center gap-3">
          {sessionName && (
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-800">{sessionName}</div>
              {roleLabel && <div className="text-xs text-slate-500">{roleLabel}</div>}
            </div>
          )}
          {right ?? (
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              ← Dashboard
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
