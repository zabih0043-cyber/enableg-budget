import { Trash2 } from "lucide-react";

function joinClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function SurfaceCard({ className = "", children }) {
  return <div className={joinClasses("surface-card rounded-xl", className)}>{children}</div>;
}

export function RailCard({ className = "", children }) {
  return <div className={joinClasses("rail-card rounded-xl", className)}>{children}</div>;
}

export function PanelHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#64748b]">
            {eyebrow}
          </p>
        ) : null}
        <h3 className="font-body text-[2.5rem] font-normal tracking-[-0.045em] text-[#0f172a]">
          {title}
        </h3>
        {description ? (
          <p className="max-w-2xl text-[0.98rem] leading-7 text-[#64748b]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Field({ label, className = "", children }) {
  return (
    <label className={joinClasses("block space-y-2", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">
        {label}
      </span>
      {children}
    </label>
  );
}

export function MetricCard({ label, value, tone = "default", className = "" }) {
  return (
    <div
      className={joinClasses(
        "rounded-lg border px-4 py-4 shadow-soft transition-all duration-200",
        tone === "success" && "border-[#c8eeaa] bg-[#f0f7ec]",
        tone === "warning" && "border-[#fde68a] bg-[#fffbeb]",
        tone === "danger"  && "border-[#fecaca] bg-[#fef2f2]",
        tone === "default" && "border-[#e2e8f0] bg-white",
        className
      )}
    >
      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">
        {label}
      </span>
      <strong className="mt-2 block font-body text-[1.75rem] font-normal tracking-[-0.04em] text-[#0f172a]">
        {value}
      </strong>
    </div>
  );
}

export function StatusPill({ tone, children }) {
  return <span className={joinClasses("status-pill", `status-${tone}`)}>{children}</span>;
}

export function RowCard({ title, subtitle, onDelete, children }) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-soft transition-all duration-200 hover:border-[#c8eeaa] hover:shadow-md">
      <div className="mb-5 flex flex-col gap-3 border-b border-[#e2e8f0] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="font-body text-[1.1rem] font-medium tracking-[-0.03em] text-[#0f172a]">
            {title}
          </h4>
          {subtitle ? <p className="mt-1 text-sm text-[#64748b]">{subtitle}</p> : null}
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#dc2626] transition-colors hover:bg-[#fee2e2]"
        >
          <Trash2 className="h-4 w-4" />
          Remove
        </button>
      </div>
      {children}
    </div>
  );
}

export function InsightList({ items, compact = false }) {
  return (
    <ul className={joinClasses("grid gap-3", compact && "gap-2")}>
      {items.map((item) => (
        <li
          key={item}
          className={joinClasses(
            "rounded-lg border border-[#d4f0c4] bg-[#f0f7ec] text-[#0f172a] shadow-soft",
            compact ? "px-4 py-3 text-sm" : "px-4 py-4 text-sm"
          )}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ProgressRing({ progress, label }) {
  return (
    <div
      className="progress-ring mx-auto"
      style={{
        background: `conic-gradient(#68be45 ${Math.max(0, Math.min(progress, 100))}%, #e2e8f0 0)`
      }}
    >
      <div className="progress-ring-inner">
        <strong>{`${progress.toFixed(0)}%`}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function BarRow({ label, value, max, barClass }) {
  const width = `${(value / Math.max(max, 1)) * 100}%`;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[#64748b]">{label}</span>
        <strong className="font-body text-base font-medium tracking-[-0.03em] text-[#0f172a]">
          {value}
        </strong>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#e2e8f0]">
        <div className={joinClasses("h-full rounded-full", barClass)} style={{ width }} />
      </div>
    </div>
  );
}
