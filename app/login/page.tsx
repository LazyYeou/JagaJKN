"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toUserFacingError } from "@/components/evidence-copy";
import { accountDisplayName } from "@/components/user-copy";

type DemoAccount = {
  id: string;
  displayName: string;
  role: "HR" | "WORKER" | "AUDITOR";
  companyName: string | null;
};

const roleLabels: Record<DemoAccount["role"], string> = {
  HR: "HR",
  WORKER: "Pekerja",
  AUDITOR: "Auditor",
};

const accountGroups: Array<{ role: DemoAccount["role"]; title: string }> = [
  { role: "AUDITOR", title: "Tinjau prioritas perusahaan" },
  { role: "HR", title: "Kelola data perusahaan" },
  { role: "WORKER", title: "Lihat kontrak dan iuran pribadi" },
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
      if (!response.ok) throw new Error(body.error ?? "Akun belum dapat dimuat.");
      setAccounts(body.accounts as DemoAccount[]);
      setMessage("");
    } catch (error) {
      setFailed(true);
      setMessage(toUserFacingError(error, "Akun belum dapat dimuat. Periksa koneksi lalu coba lagi."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAccounts(); }, []);

  async function signIn(account: DemoAccount) {
    setFailed(false);
    setSelected(account.id);
      setMessage("Membuka akun…");
    try {
      const response = await fetch("/api/demo/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: account.id }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Akun belum dapat dibuka.");
      router.push(body.redirectTo as string);
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(toUserFacingError(error, "Akun belum dapat dibuka. Coba lagi."));
      setSelected(null);
    }
  }

  return (
    <main className="login-page">
      <div className="login-layout">
        <section className="login-intro">
          <a className="wordmark login-wordmark" href="/" aria-label="JagaJKN — Beranda">
            <Image className="brand-logo-image" src="/jagajkn-logo.png" alt="JagaJKN — Transparan dan Terverifikasi" width={1536} height={1024} priority />
          </a>
          <div className="login-intro-copy">
            <p className="login-eyebrow">TRANSPARANSI BERBASIS BUKTI</p>
            <h1>Dari catatan kerja menuju pemeriksaan yang dapat dijelaskan.</h1>
            <p>Hubungkan versi kontrak, presensi, upah, dan catatan iuran agar prioritas pemeriksaan punya konteks.</p>
            <ul className="login-promises">
              <li>Jejak kontrak dan bukti sumber</li>
              <li>Pencocokan iuran dengan basis yang sebanding</li>
              <li>Keputusan tindak lanjut tetap pada manusia</li>
            </ul>
          </div>
        </section>

        <section aria-labelledby="accounts-heading" className="login-panel">
          <h2 id="accounts-heading">Pilih peran</h2>
          <p className="muted">Setiap akun hanya dapat membuka halaman sesuai perannya.</p>
          <div className="role-tabs" role="tablist" aria-label="Peran">{accountGroups.map((group, index) => <button key={group.role} role="tab" id={`role-${group.role}`} aria-selected={role === group.role} aria-controls="account-options" tabIndex={role === group.role ? 0 : -1} disabled={selected !== null} onClick={() => setRole(group.role)} onKeyDown={event => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) { event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? 2 : (index + (event.key === "ArrowRight" ? 1 : 2)) % 3; setRole(accountGroups[next]!.role); document.getElementById(`role-${accountGroups[next]!.role}`)?.focus(); } }} type="button">{roleLabels[group.role]}</button>)}</div>
          {loading && <p role="status" className="status-message">Memuat akun…</p>}
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
                      <span><span className="account-name">{account.companyName ?? accountDisplayName(account.displayName)}</span>
                     <span className="account-meta">{selected === account.id ? "Membuka akun…" : account.companyName ? roleLabels[account.role] : "Akses ringkasan perusahaan"}</span></span><span className="account-arrow" aria-hidden="true">→</span>
                  </button>
                ))}
              </div>
            </section>;
          })}
          <p className="account-preview-note">Akun pratinjau</p>
          {!loading && accounts.length === 0 && !failed && (
            <p className="status-message">Akun pratinjau belum tersedia. Hubungi pengelola atau coba lagi nanti.</p>
          )}
          {message && <p className={`status-message${failed ? " status-error" : ""}`} role={failed ? "alert" : "status"}>{message}</p>}
          {failed && <button className="logout-button" onClick={() => void loadAccounts()} type="button">Coba lagi</button>}
        </section>
      </div>
    </main>
  );
}
