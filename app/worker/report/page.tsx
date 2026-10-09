import Link from "next/link";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentActor } from "@/auth/session";
import { PortalShell } from "@/components/portal-shell";
import { ProtectedReportForm } from "@/components/protected-report-form";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function WorkerReportPage() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  if (actor.role !== UserRole.WORKER) redirect(actor.role === UserRole.HR ? "/hr" : "/auditor");

  return (
    <PortalShell title="Laporkan masalah" role="Pekerja" accountName={actor.displayName} companyName={actor.companyName}
      navigation={[
        { label: "Ringkasan", href: "/worker" },
        { label: "Kontrak saya", href: "/worker/contract" },
        { label: "Iuran saya", href: "/worker/contributions" },
        { label: "Laporkan masalah", href: "/worker/report" },
      ]}>
      <Link className="back-link" href="/worker">← Kembali ke ringkasan pekerja</Link>
      <PageHeader title="Laporan pekerja terlindungi" eyebrow="Laporan kategori" description="Sinyal awal untuk ditinjau, bukan penetapan pelanggaran atau kanal darurat." />
      <div className="report-layout"><ProtectedReportForm /><aside className="privacy-panel" aria-label="Privasi dan penggunaan laporan"><h2>Bagaimana laporan digunakan?</h2><ol className="report-steps"><li>Pilih periode dan kategori masalah.</li><li>Data laporan tidak menyimpan identitas akun atau pekerja.</li><li>Auditor hanya melihat jumlah laporan jika mencapai minimal 3 pada periode yang sama. Jumlah ini digunakan saat penilaian dihitung ulang.</li></ol><p className="muted">Penyedia layanan dapat mencatat informasi akses teknis. Karena itu, kami tidak menjanjikan anonimitas mutlak. Jangan sertakan informasi pribadi dalam laporan.</p><Link className="task-link" href="/worker/contract">Ajukan klarifikasi kontrak →</Link></aside></div>
    </PortalShell>
  );
}
