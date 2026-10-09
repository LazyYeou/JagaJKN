"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function signOut() {
    setBusy(true); setError(false);
    try {
      const response = await fetch("/api/demo/session/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");
      router.replace("/login"); router.refresh();
    } catch { setError(true); setBusy(false); }
  }

  return <div className="logout-control"><button className="logout-button" disabled={busy} onClick={() => void signOut()} type="button">{busy ? "Keluar…" : error ? "Coba keluar lagi" : "Keluar"}</button>{error && <span className="logout-error" role="alert">Sesi belum dapat diakhiri.</span>}</div>;
}
