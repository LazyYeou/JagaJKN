import Link from "next/link";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentActor } from "@/auth/session";
import { PortalShell } from "@/components/portal-shell";
import { resolvePeriodSelection } from "@/domain/period";
import { getAuditorLeaderboard } from "@/services/auditor-risk";
import { EmptyState, MetricCard, PageHeader, RiskBadge, SectionHeader } from "@/components/ui";
import { processLabels, userFacingCategoryLabel } from "@/components/risk-copy";
import { displayCompanyCode } from "@/components/user-copy";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ period?: string }> };

function CompanyRows({ companies, period }: { companies: Awaited<ReturnType<typeof getAuditorLeaderboard>>["priorityCompanies"]; period: string }) {
  return <table className="data-table decision-table">
    <caption className="sr-only">Prioritas perusahaan untuk periode {period}</caption>
    <thead><tr><th>Perusahaan</th><th className="numeric">Skor / label</th><th>Alasan pemeriksaan</th><th>Kelengkapan bukti / penilaian</th><th><span className="sr-only">Aksi</span></th></tr></thead>
    <tbody>{companies.map((company, index) => <tr key={company.id}>
      <td className="company-cell"><div className="company-identity"><span className="rank-number number" aria-label={`Urutan ${index + 1}`}>{String(index + 1).padStart(2, "0")}</span><div><Link className="company-link" href={`/auditor/companies/${company.id}?period=${period}`}>{company.name}</Link><span className="cell-meta">{displayCompanyCode(company.externalCode)} · {period}</span></div></div></td>
      <td className="score-cell numeric" data-label="Skor">{company.score === null ? <span className="muted">Belum dihitung</span> : <><strong className="score-value number">{company.score}<small>/100</small></strong>{company.coverageState === "INCOMPLETE" && <span className="cell-meta">Skor sementara dari bukti tersedia</span>}<RiskBadge level={company.riskLevel} /></>}</td>
      <td className="reason-cell" data-label="Alasan">{company.coverageState === "INCOMPLETE" && company.missingProcesses.length > 0
        ? <p className="compact-reason"><strong>Bukti belum tersedia:</strong> {company.missingProcesses.map((process) => processLabels[process] ?? process).join(", ")}</p>
        : null}
        {company.triggeredIndicators.length
          ? <ul className="reason-list">{[...new Set(company.triggeredIndicators.map(i => i.categoryCode))].map(category => <li key={category}>{userFacingCategoryLabel(category)}</li>)}</ul>
          : company.coverageState === "COMPLETE" ? <span className="muted">Belum ditemukan indikasi pada bukti yang diperiksa</span> : null}</td>
      <td data-label="Cakupan"><span className={`coverage-label ${company.coverageState === "COMPLETE" ? "coverage-complete" : ""}`}>{company.coverageState === "COMPLETE" ? "Bukti lengkap" : "Belum lengkap"}</span><span className="cell-meta">{company.assessment?.computedAt ? new Date(company.assessment.computedAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "Belum dinilai"}</span></td>
      <td className="row-action"><Link className="review-link" href={`/auditor/companies/${company.id}?period=${period}`} aria-label={`Tinjau hasil pemeriksaan ${company.name}`}>Tinjau <span aria-hidden="true">→</span></Link></td>
    </tr>)}</tbody>
    </table>;
}

export default async function AuditorHomePage({ searchParams }: PageProps) {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  if (actor.role !== UserRole.AUDITOR) redirect(actor.role === UserRole.HR ? "/hr" : "/worker");
  const selection = resolvePeriodSelection((await searchParams).period);
  const requestedPeriod = selection.period;
  const board = await getAuditorLeaderboard(actor, requestedPeriod);
  const totalCompanies = board.priorityCompanies.length + board.incompleteCompanies.length;

  return (
    <PortalShell title="Prioritas pemeriksaan" role="Auditor" accountName={actor.displayName}
      navigation={[{ label: "Ringkasan risiko", href: "/auditor" }]}>
      <PageHeader title="Prioritas Risiko Perusahaan" eyebrow="Prioritas pemeriksaan" description="Tentukan perusahaan yang perlu ditinjau dari temuan dan kelengkapan bukti." action={
        <form action="/auditor" className="period-form">
          <label htmlFor="period">Periode penilaian<input id="period" name="period" type="month" defaultValue={requestedPeriod} required /></label>
          <button className="logout-button" type="submit">Tampilkan</button>
        </form>
      } />
      {selection.validationMessage && <p className="status-message status-error" role="alert">{selection.validationMessage}</p>}
      <div className="metric-strip">
        <MetricCard label="Perusahaan dalam cakupan" value={totalCompanies} detail={`Periode ${requestedPeriod}`} />
        <MetricCard label="Risiko tinggi" value={board.highRiskCount} detail="Prioritas verifikasi pertama" tone="high" />
        <MetricCard label="Risiko sedang" value={board.mediumRiskCount} detail="Perlu ditinjau lebih lanjut" tone="medium" />
        <MetricCard label="Data belum lengkap" value={board.incompleteCount} detail="Lengkapi bukti sebelum menilai" tone="incomplete" />
      </div>
      <p className="interpretation-note">Skor menunjukkan urutan pemeriksaan, bukan bukti pelanggaran. Temuan tetap perlu diverifikasi auditor.</p>
      <section className="surface ranking-surface">
        <SectionHeader title="Prioritas audit" description="Bukti lengkap · diurutkan menurut tingkat risiko dan skor." action={<span className="count-pill">{board.priorityCompanies.length} perusahaan</span>} />
        {board.priorityCompanies.length
          ? <CompanyRows companies={board.priorityCompanies} period={requestedPeriod} />
          : <EmptyState title="Belum ada penilaian lengkap">Pilih periode lain atau minta operator menghitung penilaian setelah bukti tersedia.</EmptyState>}
      </section>
      <section className="surface ranking-surface incomplete-queue">
        <SectionHeader title="Antrian kelengkapan data" description="Bukti belum cukup. Skor yang teramati bersifat sementara, bukan risiko rendah." action={<span className="count-pill">{board.incompleteCompanies.length} perusahaan</span>} />
        {board.incompleteCompanies.length
          ? <CompanyRows companies={board.incompleteCompanies} period={requestedPeriod} />
          : <p className="muted">Semua perusahaan memiliki cakupan bukti lengkap.</p>}
      </section>
      <div className="auditor-footer"><Link href="/demo">Kontrol operator →</Link></div>
    </PortalShell>
  );
}
