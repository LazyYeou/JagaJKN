import Link from "next/link";
import { UserRole } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { getCurrentActor } from "@/auth/session";
import { PortalShell } from "@/components/portal-shell";
import { ContractFeedbackForm } from "@/components/contract-feedback-form";
import { DomainError } from "@/domain/errors";
import { resolvePeriodSelection } from "@/domain/period";
import { getContractHistoryForWorker } from "@/services/p1-contract";
import { PageHeader, SectionHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ period?: string }> };

export default async function WorkerContractPage({ searchParams }: PageProps) {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  if (actor.role !== UserRole.WORKER) redirect(actor.role === UserRole.HR ? "/hr" : "/auditor");
  const selection = resolvePeriodSelection((await searchParams).period);
  const period = selection.period;
  let history;
  try {
    history = await getContractHistoryForWorker(actor, period);
  } catch (error) {
    if (error instanceof DomainError && error.status === 404) notFound();
    throw error;
  }
  const active = history.contractForPeriod;

  return (
    <PortalShell title="Kontrak saya" role="Pekerja" accountName={history.worker.displayName} companyName={history.worker.companyName}
      navigation={[
        { label: "Ringkasan", href: "/worker" },
        { label: "Kontrak saya", href: "/worker/contract" },
        { label: "Iuran saya", href: "/worker/contributions" },
        { label: "Laporkan masalah", href: "/worker/report" },
      ]}>
      <Link className="back-link" href="/worker">← Kembali ke ringkasan pekerja</Link>
      <PageHeader title="Kontrak saya" eyebrow="Catatan hubungan kerja" description={`Kontrak yang berlaku pada periode ${period}.`} action={<form action="/worker/contract" className="period-form">
        <label htmlFor="contract-period">Periode kontrak<input id="contract-period" name="period" type="month" defaultValue={period} required /></label>
        <button className="logout-button" type="submit">Tampilkan periode</button>
      </form>} />
      {selection.validationMessage && <p className="status-message status-error" role="alert">{selection.validationMessage}</p>}
      {active ? (
        <section className="surface">
          <SectionHeader title={`Kontrak efektif · versi ${active.versionNo}`} description="Isi versi bersifat tetap. Perubahan diterbitkan sebagai versi baru oleh HR." />
          <div className="detail-fields">
            <div><p className="metric">Jenis hubungan kerja</p><strong>{employmentTypeLabel(active.employmentType)}</strong></div>
            <div><p className="metric">Tanggal mulai</p><strong>{active.effectiveFrom.toISOString().slice(0, 10)}</strong></div>
            <div><p className="metric">Upah pokok</p><strong className="number">Rp{active.baseWage.toLocaleString("id-ID")}</strong></div>
            <div><p className="metric">Tunjangan tetap</p><strong className="number">Rp{active.fixedAllowance.toLocaleString("id-ID")}</strong></div>
            <div><p className="metric">Jam kerja harapan</p><strong>{active.expectedHoursPerMonth} jam/bulan</strong></div>
          </div>
        </section>
      ) : (
        <section className="surface"><h2>Kontrak belum dapat ditampilkan</h2><p className="muted">Tidak ada satu versi kontrak yang mencakup seluruh periode {period}; minta klarifikasi melalui kanal resmi perusahaan.</p></section>
      )}
      {history.versions.length > 0 && <ContractFeedbackForm
        versions={history.versions.map((version) => ({ id: version.id, versionNo: version.versionNo, effectiveFrom: version.effectiveFrom }))}
        defaultVersionId={active?.id}
      />}
      <section className="surface section-gap">
        <SectionHeader title="Riwayat versi" description="Periksa perubahan hubungan kerja, tanggal efektif dan komponen upah." />
        {history.versions.length ? <><p className="table-scroll-hint">Pada layar kecil, geser tabel ke samping untuk melihat semua kolom.</p><div className="table-scroll" tabIndex={0} role="region" aria-label="Riwayat versi kontrak saya"><table className="data-table">
          <thead><tr><th>Versi</th><th>Mulai berlaku</th><th>Akhir berlaku</th><th>Jenis</th><th>Upah pokok</th><th>Tunjangan tetap</th></tr></thead>
          <tbody>{history.versions.map((version) => <tr key={version.id}>
            <td>v{version.versionNo}</td><td>{version.effectiveFrom.toISOString().slice(0, 10)}</td>
            <td>{version.effectiveTo?.toISOString().slice(0, 10) ?? "Berjalan"}</td><td>{version.employmentType}</td>
            <td className="number">Rp{version.baseWage.toLocaleString("id-ID")}</td>
            <td className="number">Rp{version.fixedAllowance.toLocaleString("id-ID")}</td>
          </tr>)}</tbody>
        </table></div></> : <p className="muted">Belum ada versi kontrak.</p>}
      </section>
    </PortalShell>
  );
}

function employmentTypeLabel(type: string) {
  if (type === "PKWTT") return "Perjanjian Kerja Waktu Tidak Tertentu (PKWTT)";
  if (type === "PKWT") return "Perjanjian Kerja Waktu Tertentu (PKWT)";
  return type;
}
