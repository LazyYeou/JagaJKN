"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/ui";
import { toUserFacingError } from "@/components/evidence-copy";

type FeedbackVersion = { id: string; versionNo: number; effectiveFrom: Date };

export function ContractFeedbackForm({ versions, defaultVersionId }: { versions: FeedbackVersion[]; defaultVersionId?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    setBusy(true);
    setError(false);
    setNotice("Mengirim klarifikasi kontrak…");
    try {
      const response = await fetch("/api/worker/contract-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          claimedRegularSchedule: body.claimedRegularSchedule || undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(toUserFacingError(result.error, "Klarifikasi kontrak belum dapat dikirim. Periksa isian lalu coba lagi."));
      setNotice("Klarifikasi tersimpan dan terkait dengan akun serta versi kontrak Anda. Gunakan Laporan terlindungi untuk menyampaikan laporan tanpa identitas pelapor di dalam data laporan.");
      form.reset();
      router.refresh();
    } catch (failure) {
      setError(true);
      setNotice(toUserFacingError(failure, "Klarifikasi kontrak belum dapat dikirim. Coba lagi."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="surface section-gap feedback-surface">
      <SectionHeader title="Ajukan klarifikasi kontrak" description="Klarifikasi ini terkait dengan akun dan versi kontrak Anda." />
      <p className="muted">Untuk laporan pekerja terlindungi yang tidak menyimpan identitas dalam data laporan, gunakan halaman Laporan terlindungi.</p>
      <form className="form-grid" onSubmit={(event) => void submit(event)}>
        <label>Versi kontrak terkait
          <select disabled={busy} name="contractVersionId" defaultValue={defaultVersionId ?? versions[0]?.id} required>
            {versions.map((version) => <option key={version.id} value={version.id}>Versi {version.versionNo} · mulai {version.effectiveFrom.toISOString().slice(0, 10)}</option>)}
          </select>
        </label>
        <label>Kategori
          <select disabled={busy} name="category" defaultValue="STATUS_WORK_ARRANGEMENT_DISPUTE" required>
            <option value="STATUS_WORK_ARRANGEMENT_DISPUTE">Klasifikasi hubungan kerja tidak sesuai</option>
            <option value="SCHEDULE_DISCREPANCY">Jadwal kerja perlu diklarifikasi</option>
            <option value="WAGE_OR_HOURS_CLARIFICATION">Komponen upah atau jam perlu diklarifikasi</option>
          </select>
        </label>
        <label>Jadwal rutin yang ingin diklarifikasi (opsional)
          <input disabled={busy} name="claimedRegularSchedule" maxLength={300} placeholder="Contoh: jadwal rutin sesuai skenario" />
        </label>
        <button className="button-primary" disabled={busy} type="submit">{busy ? "Mengirim…" : "Kirim klarifikasi"}</button>
      </form>
      {notice && <p className={`status-message${error ? " status-error" : ""}`} role={error ? "alert" : "status"}>{notice}</p>}
    </section>
  );
}
