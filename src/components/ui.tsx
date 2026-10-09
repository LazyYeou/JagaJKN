import type { ReactNode } from "react";

export function PageHeader({ title, eyebrow, description, action }: { title: string; eyebrow?: string; description?: ReactNode; action?: ReactNode }) {
  return <header className="page-heading workspace-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="muted">{description}</p>}</div>{action && <div className="heading-action">{action}</div>}</header>;
}

export function SectionHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return <div className="section-heading"><div><h2>{title}</h2>{description && <p className="muted">{description}</p>}</div>{action}</div>;
}

export const riskLabels: Record<string, string> = { HIGH: "Risiko Tinggi", MEDIUM: "Risiko Sedang", LOW: "Risiko Rendah", INSUFFICIENT_DATA: "Data Belum Lengkap" };
export function RiskBadge({ level }: { level: string }) {
  const tone = level === "HIGH" ? "high" : level === "MEDIUM" ? "medium" : level === "LOW" ? "low" : "incomplete";
  return <span className={`risk-badge risk-${tone}`}>{riskLabels[level] ?? "Belum Dinilai"}</span>;
}

export function MetricCard({ label, value, detail, tone }: { label: string; value: ReactNode; detail: ReactNode; tone?: string }) {
  return <section className={`metric-card${tone ? ` metric-${tone}` : ""}`}><p className="metric">{label}</p><strong className="metric-value number">{value}</strong><p className="metric-detail">{detail}</p></section>;
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-symbol" aria-hidden="true">—</span><h3>{title}</h3><p className="muted">{children}</p>{action}</div>;
}

export function LoadingSkeleton({ label }: { label: string }) {
  return <main className="page-wrap" aria-busy="true"><span className="demo-pill">Synthetic / Demo</span><p role="status" className="loading-label">{label}</p><div aria-hidden="true" className="skeleton-heading" /><div aria-hidden="true" className="metric-strip skeleton-metrics">{[0, 1, 2, 3].map(i => <div key={i} />)}</div><div className="surface skeleton-rows" aria-hidden="true">{[0, 1, 2, 3].map(i => <div key={i} />)}</div></main>;
}
