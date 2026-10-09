import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/auth/authorization";
import { getCurrentActor } from "@/auth/session";
import { PortalShell } from "@/components/portal-shell";
import { listWorkersForHr } from "@/repositories/scoped";
import { EmptyState, PageHeader, SectionHeader } from "@/components/ui";
import { displayWorkerCode, workerDisplayName } from "@/components/user-copy";

export const dynamic = "force-dynamic";

export default async function HrHomePage() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  if (actor.role !== UserRole.HR) redirect(actor.role === UserRole.WORKER ? "/worker" : "/auditor");
  requireRole(actor, UserRole.HR);
  const workers = await listWorkersForHr(actor);

  return (
    <PortalShell title="Ringkasan perusahaan" role="HR" accountName={actor.displayName} companyName={actor.companyName}
      navigation={[
        { label: "Daftar pekerja", href: "/hr" },
      ]}>
      <PageHeader title="Ringkasan Perusahaan" eyebrow={actor.companyName ?? "HR / Payroll"} description="Pilih pekerja, periksa bukti per periode, lalu perbarui data perusahaan." action={<span className="count-pill">{workers.length} pekerja</span>} />
      <div className="source-guide"><div><strong>Kontrak</strong><p>Terbitkan versi baru; catatan sebelumnya tetap tersimpan.</p></div><div><strong>Presensi dan upah</strong><p>Periksa data upah terhadap kontrak yang berlaku pada periode yang sama.</p></div><div><strong>Potongan iuran pekerja 1%</strong><p>Cocokkan dengan konfirmasi iuran perusahaan.</p></div></div>
      <section className="surface" style={{ marginTop: 20 }}>
        <SectionHeader title="Daftar pekerja" description="Pekerja perusahaan Anda" />
        {workers.length === 0 ? <EmptyState title="Belum ada pekerja">Minta pengelola menyiapkan data perusahaan, lalu muat ulang halaman.</EmptyState> : <div className="table-scroll" tabIndex={0} role="region" aria-label="Daftar pekerja perusahaan">
          <table className="data-table">
             <thead><tr><th>Kode pekerja</th><th>Nama pekerja</th><th>Aksi</th></tr></thead>
            <tbody>{workers.map((worker) => <tr key={worker.id}>
               <td className="number">{displayWorkerCode(worker.workerCode)}</td>
               <td>{workerDisplayName(worker.displayName)}</td>
                <td><Link className="review-link" href={`/hr/workers/${worker.id}`}>Buka data pekerja →</Link></td>
            </tr>)}</tbody>
          </table>
        </div>}
      </section>
    </PortalShell>
  );
}
