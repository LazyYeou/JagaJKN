import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/auth/authorization";
import { getCurrentActor } from "@/auth/session";
import { PortalShell } from "@/components/portal-shell";
import { listWorkersForHr } from "@/repositories/scoped";
import { EmptyState, PageHeader, SectionHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HrHomePage() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  if (actor.role !== UserRole.HR) redirect(actor.role === UserRole.WORKER ? "/worker" : "/auditor");
  requireRole(actor, UserRole.HR);
  const workers = await listWorkersForHr(actor);

  return (
    <PortalShell title="Ringkasan perusahaan" role="HR / Payroll" accountName={actor.displayName} companyName={actor.companyName}
      navigation={[
        { label: "Daftar pekerja", href: "/hr" },
      ]}>
      <PageHeader title="Ringkasan Perusahaan" eyebrow={actor.companyName ?? "HR / Payroll"} description="Pilih pekerja, periksa bukti per periode, lalu perbarui catatan sumber perusahaan." action={<span className="count-pill">{workers.length} pekerja dalam cakupan</span>} />
      <div className="source-guide"><div><span className="process-tag">P1</span><strong>Kontrak yang dapat ditelusuri</strong><p>Terbitkan versi baru; catatan sebelumnya tetap tersimpan.</p></div><div><span className="process-tag">P2</span><strong>Presensi dan komponen upah</strong><p>Periksa payroll terhadap kontrak efektif pada periode yang sama.</p></div><div><span className="process-tag">P3</span><strong>Potongan iuran pekerja 1%</strong><p>Cocokkan dengan konfirmasi perusahaan dari Simulasi BPJS.</p></div></div>
      <section className="surface" style={{ marginTop: 20 }}>
        <SectionHeader title="Daftar pekerja" description="Hanya pekerja perusahaan Anda · Synthetic / Demo" />
        {workers.length === 0 ? <EmptyState title="Belum ada pekerja">Minta operator menyiapkan dataset simulasi perusahaan, lalu muat ulang halaman.</EmptyState> : <div className="table-scroll" tabIndex={0} role="region" aria-label="Daftar pekerja perusahaan">
          <table className="data-table">
            <thead><tr><th>Kode pekerja</th><th>Nama simulasi</th><th>Aksi</th></tr></thead>
            <tbody>{workers.map((worker) => <tr key={worker.id}>
              <td className="number">{worker.workerCode}</td>
              <td>{worker.displayName}</td>
               <td><Link className="review-link" href={`/hr/workers/${worker.id}`}>Buka bukti sumber →</Link></td>
            </tr>)}</tbody>
          </table>
        </div>}
      </section>
    </PortalShell>
  );
}
