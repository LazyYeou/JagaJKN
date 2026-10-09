import Link from "next/link";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentActor } from "@/auth/session";
import { PortalShell } from "@/components/portal-shell";
import { ContributionTimeline } from "@/components/contribution-timeline";
import { getWorkerContributionTimeline } from "@/services/worker-self-service";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function WorkerContributionsPage() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  if (actor.role !== UserRole.WORKER) redirect(actor.role === UserRole.HR ? "/hr" : "/auditor");
  const timeline = await getWorkerContributionTimeline(actor);

  return (
    <PortalShell title="Iuran saya" role="Pekerja" accountName={actor.displayName} companyName={actor.companyName}
      navigation={[
        { label: "Ringkasan", href: "/worker" },
        { label: "Kontrak saya", href: "/worker/contract" },
        { label: "Iuran saya", href: "/worker/contributions" },
        { label: "Laporkan masalah", href: "/worker/report" },
      ]}>
      <Link className="back-link" href="/worker">← Kembali ke ringkasan pekerja</Link>
      <PageHeader title="Timeline iuran" eyebrow="P3 · Potongan dan pencocokan" description="Nominal potongan milik Anda; status konfirmasi adalah agregat perusahaan pada periode yang sama." />
      <ContributionTimeline contributions={timeline.contributions} />
    </PortalShell>
  );
}
