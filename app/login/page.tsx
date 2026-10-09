"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DemoAccount = {
  id: string;
  displayName: string;
  role: "HR" | "WORKER" | "AUDITOR";
  companyName: string | null;
};

const roleLabels: Record<DemoAccount["role"], string> = {
  HR: "HR / Payroll",
  WORKER: "Pekerja",
  AUDITOR: "Auditor",
};

const accountGroups: Array<{ role: DemoAccount["role"]; title: string }> = [
  { role: "AUDITOR", title: "Prioritas dan penjelasan risiko" },
  { role: "HR", title: "Kelola sumber perusahaan" },
  { role: "WORKER", title: "Periksa data pekerja" },
];

export default function LoginPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [role, setRole] = useState<DemoAccount["role"]>("AUDITOR");

  async function loadAccounts() {
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch("/api/demo/accounts", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Akun demo tidak dapat dimuat.");
      setAccounts(body.accounts as DemoAccount[]);
      setMessage("");
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Server tidak dapat dihubungi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAccounts(); }, []);

  async function signIn(account: DemoAccount) {
    setFailed(false);
    setSelected(account.id);
    setMessage("Membuat sesi demo…");
    try {
      const response = await fetch("/api/demo/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: account.id }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Sesi demo gagal dibuat.");
      router.push(body.redirectTo as string);
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Sesi demo gagal dibuat.");
      setSelected(null);
    }
  }

  return (
    <main className="login-page">
      <div className="login-layout">
        <section className="login-intro">
          <a className="wordmark login-wordmark" href="/">
            <span className="wordmark-mark" aria-hidden="true">J</span>
            <span className="wordmark-name">Jaga<span>JKN</span></span>
          </a>
          <div className="login-intro-copy">
            <p className="login-eyebrow">TRANSPARANSI BERBASIS BUKTI</p>
            <h1>Dari catatan kerja menuju pemeriksaan yang dapat dijelaskan.</h1>
            <p>Hubungkan versi kontrak, presensi, upah, dan konfirmasi simulasi agar prioritas pemeriksaan punya konteks.</p>
            <ul className="login-promises">
              <li>Jejak kontrak dan bukti sumber</li>
              <li>Pencocokan iuran dengan basis yang sebanding</li>
              <li>Keputusan tindak lanjut tetap pada manusia</li>
            </ul>
          </div>
          <p className="login-footer">Prototype · Data sintetis · Bukan sistem resmi BPJS</p>
        </section>

        <section aria-labelledby="accounts-heading" className="login-panel">
          <span className="demo-pill">DATA SIMULASI</span>
          <h2 id="accounts-heading">Pilih portal demo</h2>
          <p className="muted">Pilih peran, lalu masuk dengan akun simulasi. Akses setiap akun dibatasi oleh server.</p>
          <div className="role-tabs" role="tablist" aria-label="Peran demo">{accountGroups.map((group, index) => <button key={group.role} role="tab" id={`role-${group.role}`} aria-selected={role === group.role} aria-controls="account-options" tabIndex={role === group.role ? 0 : -1} disabled={selected !== null} onClick={() => setRole(group.role)} onKeyDown={event => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) { event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? 2 : (index + (event.key === "ArrowRight" ? 1 : 2)) % 3; setRole(accountGroups[next]!.role); document.getElementById(`role-${accountGroups[next]!.role}`)?.focus(); } }} type="button">{roleLabels[group.role]}</button>)}</div>
          {loading && <p role="status" className="status-message">Memuat akun demo…</p>}
          {!loading && accounts.length > 0 && accountGroups.map((group) => {
            const groupAccounts = accounts.filter((account) => account.role === group.role);
            if (group.role !== role) return null;
            return <section role="tabpanel" id="account-options" aria-labelledby={`role-${group.role}`} className="account-group" key={group.role}>
              <div className="account-group-heading"><h3>{roleLabels[group.role]}</h3><span>{group.title}</span></div>
              <div className="account-grid">
                {groupAccounts.map((account) => (
                  <button
                    className="account-button"
                    disabled={selected !== null}
                    key={account.id}
                    onClick={() => void signIn(account)}
                    type="button"
                  >
                     <span><span className="account-name">{roleLabels[account.role]} · {account.displayName}</span>
                     <span className="account-meta">{selected === account.id ? "Membuat sesi…" : account.companyName ?? "Cakupan perusahaan agregat"}</span></span><span className="account-arrow" aria-hidden="true">→</span>
                  </button>
                ))}
              </div>
            </section>;
          })}
          <div className="privacy-banner"><strong>Semua akun dan catatan bersifat fiktif.</strong><span>Synthetic / Demo · Konfirmasi BPJS adalah data simulasi, bukan konfirmasi resmi.</span></div>
          {!loading && accounts.length === 0 && !failed && (
            <p className="status-message">Belum ada akun seed. Jalankan migrasi dan seed demo terlebih dahulu.</p>
          )}
          {message && <p className={`status-message${failed ? " status-error" : ""}`} role={failed ? "alert" : "status"}>{message}</p>}
          {failed && <button className="logout-button" onClick={() => void loadAccounts()} type="button">Coba lagi</button>}
        </section>
      </div>
    </main>
  );
}
