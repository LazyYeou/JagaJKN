import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentActor } from "@/auth/session";
import { PortalShell } from "@/components/portal-shell";
import { contributionStatusCopy } from "@/domain/contribution-copy";
import { getWorkerSummaryForActor } from "@/repositories/scoped";
import { getContractHistoryForWorker } from "@/services/p1-contract";
import { getWorkerContributionTimeline } from "@/services/worker-self-service";
import Link from "next/link";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function WorkerHomePage() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  if (actor.role !== UserRole.WORKER) redirect(actor.role === UserRole.HR ? "/hr" : "/auditor");
  const [worker, contract, contributions] = await Promise.all([
    getWorkerSummaryForActor(actor),
    getContractHistoryForWorker(actor, "2026-09"),
    getWorkerContributionTimeline(actor),
  ]);
  if (!worker) redirect("/login");
  const latestContribution = contributions.contributions[0] ?? null;
  const latestStatus = latestContribution
    ? contributionStatusCopy(latestContribution.companyPeriodReconciliation.status)
    : null;

  return (
    <PortalShell
      title="Ringkasan pekerja"
      role="Pekerja"
      accountName={worker.displayName}
      companyName={worker.company.name}
      navigation={[
        { label: "Ringkasan", href: "/worker" },
        { label: "Kontrak saya", href: "/worker/contract" },
        { label: "Iuran saya", href: "/worker/contributions" },
        { label: "Laporkan masalah", href: "/worker/report" },
      ]}
    >
      <PageHeader title="Ringkasan Pekerja" eyebrow="Catatan kerja Anda" description={`${worker.workerCode} · ${worker.company.name} · Informasi hanya untuk akun Anda.`} />
      <div className="task-grid">
        <section className="surface task-card">
          <p className="eyebrow">P1 · Kontrak efektif · 2026-09</p>
          {contract.contractForPeriod
            ? <><h2>{contract.contractForPeriod.employmentType} · Versi {contract.contractForPeriod.versionNo}</h2><p className="muted">Berlaku mulai {contract.contractForPeriod.effectiveFrom.toISOString().slice(0, 10)}</p><p>Upah pokok <strong className="number">Rp{contract.contractForPeriod.baseWage.toLocaleString("id-ID")}</strong></p></>
            : <><h2>Kontrak belum tersedia</h2><p className="muted">Kontrak efektif untuk periode ini belum dapat diverifikasi.</p></>}
          <Link className="task-link" href="/worker/contract">Lihat kontrak dan riwayat <span aria-hidden="true">→</span></Link>
        </section>
        <section className="surface task-card">
          <p className="eyebrow">P3 · Pencocokan iuran terakhir</p>
          {latestContribution
            ? <><h2>{latestStatus?.label}</h2><p>Potongan Anda <strong className="number">Rp{latestContribution.employeeOnePercentAmount.toLocaleString("id-ID")}</strong> · {latestContribution.period}</p><p className="muted">Status tingkat perusahaan, bukan bukti pembayaran individual.</p></>
            : <><h2>Belum ada data potongan</h2><p className="muted">Status pencocokan belum dapat diverifikasi.</p></>}
          <Link className="task-link" href="/worker/contributions">Lihat timeline iuran <span aria-hidden="true">→</span></Link>
        </section>
      </div>
      <section className="task-strip"><div><h2>Ada masalah yang perlu ditinjau?</h2><p>Feedback kontrak P1 terhubung dengan akun Anda. Laporan P5 disimpan tanpa ID pekerja dalam record laporan.</p></div><Link className="logout-button inline-button" href="/worker/report">Buka laporan terlindungi →</Link></section>
    </PortalShell>
  );
}
