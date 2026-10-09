import { UserRole } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentActor } from "@/auth/session";
import { DomainError } from "@/domain/errors";
import { PortalShell } from "@/components/portal-shell";
import { HrEvidenceEditor } from "@/components/hr-evidence-editor";
import { toPlainEvidenceCopy } from "@/components/evidence-copy";
import { resolvePeriodSelection } from "@/domain/period";
import { getContractHistoryForHr } from "@/services/p1-contract";
import { getHrWorkerEvidence } from "@/services/hr-evidence";
import { contributionStatusCopy } from "@/domain/contribution-copy";
import { PageHeader, SectionHeader } from "@/components/ui";
import { displayWorkerCode, workerDisplayName, displayConfirmationReference } from "@/components/user-copy";

const wageRuleLabels: Record<string, string> = {
  P2_FIXED_COMPONENT_CONTRACT_DIFFERENCE: "Komponen upah tetap berbeda dari kontrak",
  P2_RECURRING_VARIABLE_COMPONENT: "Pola tunjangan variabel berulang",
};

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ workerId: string }>; searchParams: Promise<{ period?: string }> };

export default async function HrWorkerDetailPage({ params, searchParams }: PageProps) {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  if (actor.role !== UserRole.HR) redirect(actor.role === UserRole.WORKER ? "/worker" : "/auditor");
  const { workerId } = await params;
  const selection = resolvePeriodSelection((await searchParams).period);
  const period = selection.period;
  let detail;
  let evidence;
  try {
    [detail, evidence] = await Promise.all([
      getContractHistoryForHr(actor, workerId),
      getHrWorkerEvidence(actor, workerId, period),
    ]);
  } catch (error) {
    if (error instanceof DomainError && error.status === 404) notFound();
    throw error;
  }

  return (
    <PortalShell title="Kontrak dan data pekerja" role="HR" accountName={actor.displayName} companyName={actor.companyName}
      navigation={[
        { label: "Daftar pekerja", href: "/hr" },
      ]}>
      <Link className="back-link" href="/hr">← Kembali ke daftar pekerja</Link>
      <PageHeader title={workerDisplayName(detail.worker.displayName)} eyebrow={`${displayWorkerCode(detail.worker.workerCode)} · Data pekerja`} description={detail.worker.companyName} action={<form action={`/hr/workers/${workerId}`} className="period-form">
        <label htmlFor="period">Periode bukti<input id="period" name="period" type="month" defaultValue={period} required /></label>
        <button className="logout-button" type="submit">Muat periode</button>
      </form>} />
      {selection.validationMessage && <p className="status-message status-error" role="alert">{selection.validationMessage}</p>}

      <nav className="section-navigation" aria-label="Tugas bukti pekerja"><a href="#evidence-editor">Perbarui bukti & kontrak</a><a href="#contract-history">Riwayat versi</a></nav>
      <section className="surface evidence-snapshot" aria-label={`Bukti tersimpan periode ${period}`}>
        <SectionHeader title={`Bukti tersimpan · ${period}`} description="Kontrak efektif dan sumber pembanding pada periode yang sama." />
        <div className="grid">
          <div><p className="metric">Kontrak yang berlaku</p><strong>{evidence.effectiveContract ? `Versi ${evidence.effectiveContract.versionNo} · ${employmentTypeLabel(evidence.effectiveContract.employmentType)}` : "Belum dapat dipilih"}</strong>{evidence.effectiveContract && <p className="muted">Rp{evidence.effectiveContract.baseWage.toLocaleString("id-ID")} + tunjangan tetap Rp{evidence.effectiveContract.fixedAllowance.toLocaleString("id-ID")}</p>}</div>
          <div><p className="metric">Presensi tersimpan</p><strong>{evidence.attendance ? `${evidence.attendance.actualHours} jam + ${evidence.attendance.overtimeHours} jam lembur` : "Belum ada data"}</strong></div>
          <div><p className="metric">Komponen upah yang dilaporkan</p><strong>{evidence.payroll ? `Rp${evidence.payroll.baseWageReported.toLocaleString("id-ID")} + tunjangan Rp${evidence.payroll.fixedAllowanceReported.toLocaleString("id-ID")}` : "Belum ada data"}</strong></div>
          <div><p className="metric">Potongan 1% pekerja</p><strong>{evidence.deduction ? `Rp${evidence.deduction.employeeOnePercentAmount.toLocaleString("id-ID")}` : "Belum ada data"}</strong></div>
        </div>
        {evidence.wageEvaluation && <div className="status-message">
          <strong>Pemeriksaan kesesuaian upah: {coverageStatusLabel(evidence.wageEvaluation.coverageState)}</strong>
          {evidence.wageEvaluation.indicators.map((indicator) => <p key={indicator.ruleCode}><strong>{wageRuleLabels[indicator.ruleCode] ?? "Pemeriksaan komponen upah"}</strong> · {indicator.dataStatus === "EVALUATED" ? "Bukti cukup" : "Bukti belum cukup"}: {toPlainEvidenceCopy(indicator.explanation)}</p>)}
        </div>}
          {evidence.reconciliation && <div className="status-message">
          <strong>Pencocokan iuran tingkat perusahaan · periode {period}: {contributionStatusCopy(evidence.reconciliation.status).label}</strong>
          <p>{toPlainEvidenceCopy(evidence.reconciliation.reason)}</p>
          {evidence.reconciliation.delta !== null && <p>{reconciliationDifferenceCopy(evidence.reconciliation.delta)}</p>}
          {evidence.reconciliation.confirmation && <p className="muted">Sumber: {evidence.reconciliation.confirmation.sourceType === "MOCK_BPJS" ? "Simulasi BPJS" : "Konfirmasi iuran perusahaan"} · Referensi {displayConfirmationReference(evidence.reconciliation.confirmation.reference)}</p>}
          <p className="muted">Bukti dinilai hingga {new Date(evidence.reconciliation.evaluationAsOf).toLocaleString("id-ID")} · Hasil pemeriksaan disimpan {new Date(evidence.reconciliation.calculatedAt).toLocaleString("id-ID")}</p>
        </div>}
        {!evidence.wageEvaluation && !evidence.reconciliation && <p className="muted">Belum ada hasil evaluasi tersimpan untuk periode ini.</p>}
      </section>

      <HrEvidenceEditor workerId={workerId} period={period} evidence={evidence}
        latestContract={evidence.effectiveContract ? {
          employmentType: evidence.effectiveContract.employmentType,
          baseWage: evidence.effectiveContract.baseWage,
          fixedAllowance: evidence.effectiveContract.fixedAllowance,
          expectedHoursPerMonth: evidence.effectiveContract.expectedHoursPerMonth,
        } : null} key={`${workerId}:${period}`} />
      <section className="surface section-gap" id="contract-history">
        <SectionHeader title="Riwayat kontrak" description="Versi terdahulu tetap dapat dibaca setelah versi baru diterbitkan." />
        {detail.versions.length === 0 ? <p className="muted">Belum ada versi kontrak.</p> : (
          <>
          <p className="table-scroll-hint">Pada layar kecil, geser tabel ke samping untuk melihat semua kolom.</p>
          <div className="table-scroll" tabIndex={0} role="region" aria-label="Riwayat kontrak pekerja"><table className="data-table">
            <thead><tr><th>Versi</th><th>Berlaku mulai</th><th>Berlaku sampai</th><th>Hubungan kerja</th><th>Upah pokok</th><th>Tunjangan tetap</th></tr></thead>
            <tbody>{detail.versions.map((version) => <tr key={version.id}>
              <td>v{version.versionNo}</td>
              <td>{version.effectiveFrom.toISOString().slice(0, 10)}</td>
              <td>{version.effectiveTo?.toISOString().slice(0, 10) ?? "Berjalan"}</td>
              <td>{version.employmentType}</td>
              <td className="number">Rp{version.baseWage.toLocaleString("id-ID")}</td>
              <td className="number">Rp{version.fixedAllowance.toLocaleString("id-ID")}</td>
            </tr>)}</tbody>
          </table></div>
          </>
        )}
      </section>

    </PortalShell>
  );
}

function coverageStatusLabel(status: string) {
  return status === "COMPLETE" ? "Bukti lengkap" : "Bukti belum lengkap";
}

function reconciliationDifferenceCopy(delta: number) {
  if (delta < 0) return `Total konfirmasi lebih kecil Rp${Math.abs(delta).toLocaleString("id-ID")} dibanding total potongan pekerja.`;
  if (delta > 0) return `Total konfirmasi lebih besar Rp${delta.toLocaleString("id-ID")} dibanding total potongan pekerja.`;
  return "Total konfirmasi dan total potongan pekerja sama.";
}

function employmentTypeLabel(type: string) {
  if (type === "PKWTT") return "Perjanjian Kerja Waktu Tidak Tertentu (PKWTT)";
  if (type === "PKWT") return "Perjanjian Kerja Waktu Tertentu (PKWT)";
  return type;
}
