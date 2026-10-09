"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
      if (!response.ok) throw new Error(body.error ?? "Akses operator ditolak.");
      setAuthorized(true);
      form.reset();
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Akses operator gagal.");
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
      if (!response.ok) throw new Error(body.error ?? "Recalculation gagal.");
      setResult(body as RecalculateResult);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Recalculation gagal.");
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
      if (!response.ok) throw new Error(body.error ?? "Reset baseline gagal.");
      setResetResult({ seed: body.seed });
      setResult(null);
      setConfirmReset(false);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Reset baseline gagal.");
    } finally {
      setBusy(false);
    }
  }

  if (!authorized) {
    return (
      <section className="surface" style={{ maxWidth: 560, marginTop: 20 }}>
        <h2 style={{ color: "#173A70", fontSize: 18, marginTop: 0 }}>Masuk sebagai operator</h2>
        <p className="muted">Gunakan key operator yang disimpan di environment server. Key tidak disimpan di browser.</p>
        <form className="form-grid" onSubmit={(event) => void signIn(event)}>
          <label>Key operator<input name="operatorKey" type="password" autoComplete="current-password" required /></label>
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
          <div><h2>Hitung penilaian baru</h2><p className="muted">Waktu skenario tetap; waktu snapshot mengikuti database.</p></div>
        </div>
        <form className="form-grid" onSubmit={(event) => void recalculate(event)}>
          <label>Periode<input name="period" defaultValue="2026-09" pattern="\d{4}-(0[1-9]|1[0-2])" required /></label>
          <button className="button-primary" disabled={busy} type="submit">{busy ? "Menghitung…" : "Hitung ulang risiko"}</button>
        </form>
        {error && <p className="status-message status-error" role="alert">{error}</p>}
        {result && <div className="status-message" role="status">
          <strong>Assessment tersimpan · {result.period}</strong>
          <p>Perusahaan dinilai: {result.counts.assessed}; tinggi: {result.counts.high}; sedang: {result.counts.medium}; rendah: {result.counts.low}; data belum lengkap: {result.counts.insufficientData}.</p>
          <p className="muted">Skenario: {new Date(result.evaluationAsOf).toLocaleString("id-ID")} · Disimpan: {new Date(result.computedAt).toLocaleString("id-ID")}</p>
          <Link href="/login">Keluar lalu pilih akun auditor</Link>
        </div>}
      </section>
       <section className="surface operator-reset" aria-labelledby="reset-heading">
        <h2 id="reset-heading" style={{ color: "#173A70", fontSize: 18, marginTop: 0 }}>Reset baseline demo</h2>
        <p className="muted">Reset mengganti seluruh data sintetis pada database ini dengan baseline seed. Jangan jalankan saat sesi demo lain sedang memakai data.</p>
        {!confirmReset
          ? <button className="logout-button" disabled={busy} onClick={() => { setConfirmReset(true); setResetResult(null); }} type="button">Siapkan reset</button>
          : <div className="reset-confirmation" role="group" aria-label="Konfirmasi reset baseline">
            <p><strong>Konfirmasi reset?</strong> Semua perubahan demo saat ini akan diganti baseline.</p>
            <button className="logout-button" disabled={busy} onClick={() => setConfirmReset(false)} type="button">Batalkan</button>
            <button className="destructive-button" disabled={busy} onClick={() => void resetBaseline()} type="button">{busy ? "Mereset…" : "Konfirmasi reset baseline"}</button>
          </div>}
        {resetResult && <p className="status-message" role="status">Baseline dipulihkan: {resetResult.seed.companies} perusahaan, {resetResult.seed.workers} pekerja, {resetResult.seed.payrollRecords} baris payroll.</p>}
      </section>
    </>
  );
}
