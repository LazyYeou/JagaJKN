"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { P5_REPORT_CATEGORIES } from "@/domain/report-categories";
import Link from "next/link";
import { SectionHeader } from "@/components/ui";
import { toUserFacingError } from "@/components/evidence-copy";

type Receipt = { receiptId: string; period: string; category: string; duplicate: boolean };

export function ProtectedReportForm() {
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const receiptPanel = useRef<HTMLDivElement>(null);
  useEffect(() => { if (receipt) receiptPanel.current?.focus(); }, [receipt]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const requestId = submissionId ?? crypto.randomUUID();
    setSubmissionId(requestId);
    setBusy(true);
    setError("");
    setReceipt(null);
    try {
      const response = await fetch("/api/worker/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: requestId,
          period: values.get("period"),
          category: values.get("category"),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(toUserFacingError(result.error, "Laporan belum dapat dikirim. Periksa isian lalu coba lagi."));
      setReceipt({
        receiptId: result.receiptId,
        period: result.period,
        category: result.category,
        duplicate: result.duplicate,
      });
      setSubmissionId(null);
      form.reset();
    } catch (failure) {
      setError(toUserFacingError(failure, "Laporan belum dapat dikirim. Coba lagi."));
    } finally {
      setBusy(false);
    }
  }

  function clearRetryId() {
    setSubmissionId(null);
    setReceipt(null);
    setError("");
  }

  return (
    <div className="surface report-surface">
      {receipt && <><div className="receipt-panel" role="status" tabIndex={-1} ref={receiptPanel}>
        <h2>Laporan diterima.</h2>
        <p>Nomor bukti laporan: <code>{receipt.receiptId}</code></p><p>Periode {receipt.period}. {receipt.duplicate ? "Pengiriman ulang dikenali sebagai laporan yang sama." : "Laporan baru tersimpan."}</p>
        <p className="muted">Auditor hanya melihat jumlah laporan jika mencapai minimal 3 pada periode yang sama. Jumlah tersebut digunakan saat penilaian dihitung ulang. Identitas pelapor tidak ditampilkan.</p>
      </div><div className="receipt-actions"><Link className="task-link" href="/worker/contributions">Kembali ke iuran →</Link><Link className="task-link" href="/worker">Ringkasan pekerja →</Link></div></>}
      <SectionHeader title={receipt ? "Kirim laporan lain" : "Kirim laporan kategori"} description="Hanya periode dan kategori · Tanpa narasi atau lampiran" />
      <p className="muted">Data laporan tidak menyimpan identitas akun atau pekerja. Klarifikasi kontrak berbeda karena terkait dengan akun dan versi kontrak Anda.</p>
      <form className="form-grid" onSubmit={(event) => void submit(event)}>
        <label>Periode laporan<input disabled={busy} name="period" defaultValue="2026-09" pattern="\d{4}-(0[1-9]|1[0-2])" required onChange={clearRetryId} /></label>
        <label>Kategori
          <select disabled={busy} name="category" defaultValue={P5_REPORT_CATEGORIES[0].code} required onChange={clearRetryId}>
            {P5_REPORT_CATEGORIES.map((category) => <option key={category.code} value={category.code}>{category.label}</option>)}
          </select>
        </label>
        <button className="button-primary" disabled={busy} type="submit">{busy ? "Mengirim…" : submissionId ? "Coba kirim ulang" : "Kirim laporan"}</button>
      </form>
      {error && <div className="status-message status-error" role="alert">
        <p>{error}</p><p>Jika status pengiriman belum pasti, coba lagi tanpa mengubah periode atau kategori agar sistem mengenali pengiriman yang sama.</p>
      </div>}
    </div>
  );
}
