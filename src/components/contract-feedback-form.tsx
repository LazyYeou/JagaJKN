"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/ui";

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
    setNotice("Mengirim feedback terkait kontrak…");
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
      if (!response.ok) throw new Error(result.error ?? "Feedback tidak dapat dikirim.");
      setNotice("Feedback tersimpan sebagai klarifikasi kontrak yang terhubung ke akun Anda. Ini bukan kanal laporan P5.");
      form.reset();
      router.refresh();
    } catch (failure) {
      setError(true);
      setNotice(failure instanceof Error ? failure.message : "Feedback tidak dapat dikirim.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="surface section-gap feedback-surface">
      <SectionHeader title="Ajukan feedback kontrak" description="Klarifikasi P1 · Akses dibatasi" />
      <p className="muted">Feedback P1 terhubung dengan akun dan versi kontrak Anda untuk klarifikasi internal. Ini bukan laporan anonim P5.</p>
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
        <button className="button-primary" disabled={busy} type="submit">{busy ? "Mengirim…" : "Kirim feedback kontrak"}</button>
      </form>
      {notice && <p className={`status-message${error ? " status-error" : ""}`} role={error ? "alert" : "status"}>{notice}</p>}
    </section>
  );
}
