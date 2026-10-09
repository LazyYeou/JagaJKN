"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toUserFacingError } from "@/components/evidence-copy";

type RecalculateResult = {
  period: string;
  evaluationAsOf: string;
  computedAt: string;
  counts: { assessed: number; high: number; medium: number; low: number; insufficientData: number };
};

type ResetResult = {
  seed: { companies: number; workers: number; payrollRecords: number };
};

export function OperatorRecalculatePanel({ authorized: initialAuthorized }: { authorized: boolean }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(initialAuthorized);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RecalculateResult | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/demo/operator-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorKey: formData.get("operatorKey") }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(toUserFacingError(body.error, "Akses operator ditolak. Periksa kunci akses lalu coba lagi."));
      setAuthorized(true);
      form.reset();
      router.refresh();
    } catch (failure) {
      setError(toUserFacingError(failure, "Akses operator gagal. Coba lagi."));
    } finally {
      setBusy(false);
    }
  }

  async function recalculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const period = String(new FormData(event.currentTarget).get("period") ?? "");
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/demo/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(toUserFacingError(body.error, "Penilaian belum dapat dihitung. Periksa periode lalu coba lagi."));
      setResult(body as RecalculateResult);
    } catch (failure) {
      setError(toUserFacingError(failure, "Penilaian belum dapat dihitung. Coba lagi."));
    } finally {
      setBusy(false);
    }
  }

  async function resetBaseline() {
    setBusy(true);
    setError("");
    setResetResult(null);
    try {
      const response = await fetch("/api/demo/reset", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(toUserFacingError(body.error, "Data awal belum dapat dipulihkan. Coba lagi."));
      setResetResult({ seed: body.seed });
      setResult(null);
      setConfirmReset(false);
      router.refresh();
    } catch (failure) {
      setError(toUserFacingError(failure, "Data awal belum dapat dipulihkan. Coba lagi."));
    } finally {
      setBusy(false);
    }
  }

  if (!authorized) {
    return (
      <section className="surface" style={{ maxWidth: 560, marginTop: 20 }}>
        <h2 style={{ color: "#173A70", fontSize: 18, marginTop: 0 }}>Masuk sebagai operator</h2>
        <p className="muted">Gunakan kunci akses yang diberikan pengelola sistem. Kunci tidak disimpan setelah masuk.</p>
        <form className="form-grid" onSubmit={(event) => void signIn(event)}>
          <label>Kunci akses<input name="operatorKey" type="password" autoComplete="current-password" required /></label>
          <button className="button-primary" disabled={busy} type="submit">{busy ? "Memeriksa…" : "Masuk"}</button>
        </form>
        {error && <p className="status-message status-error" role="alert">{error}</p>}
      </section>
    );
  }

  return (
    <>
      <section className="surface operator-calculation section-gap">
        <div className="auditor-heading">
          <div><h2>Hitung penilaian baru</h2><p className="muted">Periode bukti tetap; waktu hasil penilaian mengikuti waktu penyimpanan.</p></div>
        </div>
        <form className="form-grid" onSubmit={(event) => void recalculate(event)}>
          <label>Periode<input name="period" defaultValue="2026-09" pattern="\d{4}-(0[1-9]|1[0-2])" required /></label>
          <button className="button-primary" disabled={busy} type="submit">{busy ? "Menghitung…" : "Hitung ulang risiko"}</button>
        </form>
        {error && <p className="status-message status-error" role="alert">{error}</p>}
        {result && <div className="status-message" role="status">
          <strong>Penilaian tersimpan · {result.period}</strong>
          <p>Perusahaan dinilai: {result.counts.assessed}; tinggi: {result.counts.high}; sedang: {result.counts.medium}; rendah: {result.counts.low}; data belum lengkap: {result.counts.insufficientData}.</p>
          <p className="muted">Bukti dinilai hingga {new Date(result.evaluationAsOf).toLocaleString("id-ID")} · Penilaian disimpan {new Date(result.computedAt).toLocaleString("id-ID")}</p>
          <Link href="/login">Keluar lalu pilih akun auditor</Link>
        </div>}
      </section>
       <section className="surface operator-reset" aria-labelledby="reset-heading">
        <h2 id="reset-heading" style={{ color: "#173A70", fontSize: 18, marginTop: 0 }}>Pulihkan kondisi awal</h2>
        <p className="muted">Tindakan ini mengganti seluruh perubahan dengan kondisi awal pada basis data ini. Jangan jalankan saat pengguna lain sedang memakai data.</p>
        {!confirmReset
          ? <button className="logout-button" disabled={busy} onClick={() => { setConfirmReset(true); setResetResult(null); }} type="button">Siapkan pemulihan</button>
          : <div className="reset-confirmation" role="group" aria-label="Konfirmasi pemulihan data awal">
            <p><strong>Pulihkan kondisi awal?</strong> Semua perubahan saat ini akan diganti data awal.</p>
            <button className="logout-button" disabled={busy} onClick={() => setConfirmReset(false)} type="button">Batalkan</button>
            <button className="destructive-button" disabled={busy} onClick={() => void resetBaseline()} type="button">{busy ? "Memulihkan…" : "Konfirmasi pemulihan data"}</button>
          </div>}
        {resetResult && <p className="status-message" role="status">Data awal dipulihkan: {resetResult.seed.companies} perusahaan, {resetResult.seed.workers} pekerja, {resetResult.seed.payrollRecords} catatan upah.</p>}
      </section>
    </>
  );
}
