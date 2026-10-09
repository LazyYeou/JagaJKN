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
      title="Recalculate bukti dan risiko"
      role={authorized ? "Operator demo" : "Kontrol demo"}
      accountName={actor?.displayName ?? "Akses operator diperlukan"}
      navigation={[
        { label: "Kontrol operator", href: "/demo" },
        { label: "Login peran demo", href: "/login" },
      ]}
    >
      <Link className="back-link" href="/login">← Kembali ke pemilihan peran demo</Link>
      <PageHeader title="Kontrol operator demo" eyebrow="Pipeline bukti → penilaian" description="Hitung ulang P1/P2/P3/P5 dan simpan penilaian P4 baru. Catatan sumber dan snapshot terdahulu tetap tersimpan." />
      <div className="notice">Hanya operator demo berwenang menjalankan tindakan ini. Skor adalah prioritas pemeriksaan, bukan bukti pelanggaran.</div>
      <OperatorRecalculatePanel authorized={authorized} />
    </PortalShell>
  );
}
