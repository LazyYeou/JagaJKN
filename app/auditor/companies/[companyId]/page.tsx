import Link from "next/link";
import { UserRole } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { getCurrentActor } from "@/auth/session";
import { PortalShell } from "@/components/portal-shell";
import { toPlainEvidenceCopy } from "@/components/evidence-copy";
import { DomainError } from "@/domain/errors";
import { resolvePeriodSelection } from "@/domain/period";
import { getAuditorCompanyRisk } from "@/services/auditor-risk";
import { PageHeader, RiskBadge, SectionHeader, riskLabels as labels } from "@/components/ui";
import { processLabels, userFacingIndicatorLabel } from "@/components/risk-copy";
import { displayCompanyCode } from "@/components/user-copy";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ companyId: string }>; searchParams: Promise<{ period?: string }> };

function evidenceStatusLabel(status: string) {
  return status === "EVALUATED" ? "Bukti cukup" : "Bukti belum cukup";
}

export default async function AuditorCompanyRiskPage({ params, searchParams }: PageProps) {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  if (actor.role !== UserRole.AUDITOR) redirect(actor.role === UserRole.HR ? "/hr" : "/worker");
  const { companyId } = await params;
  const selection = resolvePeriodSelection((await searchParams).period);
  const period = selection.period;

  let detail;
  try {
    detail = await getAuditorCompanyRisk(actor, companyId, period);
  } catch (error) {
    if (error instanceof DomainError && error.status === 404) notFound();
    throw error;
  }
  const assessment = detail.current;
  const missingLabel = assessment.missingProcesses.length
    ? assessment.missingProcesses.map((process) => processLabels[process] ?? process).join(" · ")
    : "Bukti kontrak, upah, dan iuran lengkap";

  return (
    <PortalShell title="Penjelasan hasil pemeriksaan" role="Auditor" accountName={actor.displayName}
      navigation={[{ label: "Ringkasan risiko", href: `/auditor?period=${period}` }]}>
      <Link className="back-link" href={`/auditor?period=${period}`}>← Kembali ke prioritas audit</Link>
      <PageHeader title={detail.company.name} eyebrow={`${displayCompanyCode(detail.company.externalCode)} · Periode ${period}`} description="Penjelasan hasil pemeriksaan tingkat perusahaan." />
      {selection.validationMessage && <p className="status-message status-error" role="alert">{selection.validationMessage}</p>}
      <section className={`surface assessment-summary ${assessment.coverageState === "INCOMPLETE" ? "assessment-incomplete" : ""}`}>
        <div className="assessment-score"><p className="metric">{assessment.coverageState === "INCOMPLETE" ? "Skor sementara" : "Skor prioritas pemeriksaan"}</p><strong className="number">{assessment.score}<small>/100</small></strong><RiskBadge level={assessment.riskLevel} /></div>
        <div><h2>{assessment.coverageState === "INCOMPLETE" ? "Lengkapi bukti sebelum menyimpulkan" : assessment.indicators.some(i => i.triggered) ? "Tinjau alasan yang membentuk prioritas" : "Belum ditemukan tanda yang perlu ditinjau"}</h2><p>{assessment.coverageState === "INCOMPLETE" ? `Bukti belum cukup: ${missingLabel}. Skor sementara dihitung dari bukti yang tersedia.` : "Penilaian menggunakan bukti kontrak, upah, dan pencocokan iuran pada periode yang sama."}</p><p className="muted">Hasil ini merupakan sinyal awal untuk diverifikasi; bukan pembuktian pelanggaran atau penetapan kewajiban hukum.</p></div>
      </section>
      <div className="evidence-workspace">
        <section className="surface evidence-main">
          <SectionHeader title="Temuan dan penjelasan" description="Hal yang perlu ditinjau ditampilkan lebih dahulu. Setiap kategori menambah nilai paling banyak satu kali." />
          <div className="indicator-list">{[...assessment.indicators].sort((a, b) => Number(b.triggered) - Number(a.triggered)).map(indicator => <article className={`indicator-entry${indicator.triggered ? " indicator-triggered" : ""}`} key={indicator.ruleCode}>
            <div className="indicator-heading"><span className="process-tag">{processLabels[indicator.processCode] ?? "Bukti"}</span><h3>{userFacingIndicatorLabel(indicator.ruleCode, indicator.categoryCode)}</h3><strong className="indicator-points number">{indicator.dataStatus === "EVALUATED" ? `+${indicator.scoreContribution}` : "—"}<small> poin</small></strong></div>
            <div className="indicator-state"><span className={`risk-badge ${indicator.dataStatus !== "EVALUATED" ? "risk-incomplete" : indicator.triggered ? "risk-medium" : "risk-low"}`}>{indicator.dataStatus !== "EVALUATED" ? "Belum dapat diperiksa" : indicator.triggered ? "Perlu verifikasi" : "Tidak ditemukan"}</span><span>{evidenceStatusLabel(indicator.dataStatus)}</span></div>
            <p>{toPlainEvidenceCopy(indicator.explanation)}</p><p className="evidence-source">{indicator.processCode === "P3" && <strong>Pembanding: Simulasi BPJS · </strong>}{toPlainEvidenceCopy(indicator.evidenceSummary)}</p>
          </article>)}</div>
        </section>
        <aside className="evidence-rail" aria-label="Cakupan dan jejak penilaian">
          <section className="surface"><SectionHeader title="Cakupan bukti" description={assessment.coverageState === "COMPLETE" ? "Bukti kontrak, upah, dan iuran lengkap" : "Data belum lengkap"} /><ul className="coverage-list">{["P1", "P2", "P3"].map(process => <li key={process}><span>{processLabels[process]}</span><span className={assessment.missingProcesses.includes(process as "P1" | "P2" | "P3") ? "muted" : "coverage-complete"}>{assessment.missingProcesses.includes(process as "P1" | "P2" | "P3") ? "Belum cukup" : "Lengkap"}</span></li>)}</ul></section>
          <section className="surface"><SectionHeader title="Waktu dan kebijakan" /><dl className="metadata-list"><dt>Versi aturan</dt><dd>{assessment.ruleVersion.replace(/^demo-v/i, "")}</dd><dt>Bukti dinilai hingga</dt><dd>{new Date(assessment.evaluationAsOf).toLocaleString("id-ID")}</dd><dt>Penilaian disimpan pada</dt><dd>{new Date(assessment.computedAt).toLocaleString("id-ID")}</dd></dl></section>
          <section className="privacy-panel"><h3>Jumlah laporan pekerja</h3><p>{assessment.eligibleP5ReportCount === null ? "Belum mencapai jumlah minimum untuk ditampilkan" : `${assessment.eligibleP5ReportCount} laporan mencapai batas penayangan`}</p><p className="muted">Identitas dan isi laporan tidak ditampilkan. Jumlah di bawah 3 tidak ditampilkan atau digunakan dalam penilaian.</p></section>
        </aside>
      </div>

      <section className="surface section-gap">
        <SectionHeader title="Riwayat penilaian" description="Hasil sebelumnya tetap tersimpan. Setiap penghitungan ulang menambahkan hasil baru." />
        <p className="table-scroll-hint">Pada layar kecil, geser tabel ke samping untuk melihat semua kolom.</p>
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Riwayat penilaian perusahaan"><table className="data-table">
          <thead><tr><th>Penilaian disimpan</th><th>Bukti dinilai hingga</th><th>Aturan</th><th>Skor</th><th>Status</th></tr></thead>
          <tbody>{detail.history.map((snapshot) => <tr key={snapshot.id}>
            <td>{new Date(snapshot.computedAt).toLocaleString("id-ID")}</td>
            <td>{new Date(snapshot.evaluationAsOf).toLocaleString("id-ID")}</td>
            <td>Versi {snapshot.ruleVersion.replace(/^demo-v/i, "")}</td><td className="number">{snapshot.score}</td><td>{labels[snapshot.riskLevel]}</td>
          </tr>)}</tbody>
        </table></div>
      </section>
    </PortalShell>
  );
}
