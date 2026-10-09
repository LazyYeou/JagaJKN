import { UserRole } from "@prisma/client";
import { PortalShell } from "@/components/portal-shell";
import { getCurrentActor } from "@/auth/session";
import { OperatorRecalculatePanel } from "@/components/operator-recalculate-panel";
import Link from "next/link";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DemoOperatorPage() {
  const actor = await getCurrentActor();
  const authorized = actor?.role === UserRole.DEMO_OPERATOR;
  return (
    <PortalShell
      title="Pemeriksaan bukti dan risiko"
      role={authorized ? "Pengelola" : "Kontrol operator"}
      accountName={authorized ? "Operator" : "Akses operator diperlukan"}
      navigation={[
        { label: "Kontrol operator", href: "/demo" },
        { label: "Pilih akun", href: "/login" },
      ]}
    >
      <Link className="back-link" href="/login">← Kembali ke pemilihan akun</Link>
      <PageHeader title="Kontrol operator" eyebrow="Pemeriksaan bukti → penilaian" description="Periksa ulang bukti dan simpan penilaian risiko baru. Catatan sumber dan hasil penilaian terdahulu tetap tersimpan." />
      <div className="notice">Tindakan ini hanya tersedia bagi pengelola yang berwenang. Skor adalah prioritas pemeriksaan, bukan bukti pelanggaran.</div>
      <OperatorRecalculatePanel authorized={authorized} />
    </PortalShell>
  );
}
