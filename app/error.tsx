"use client";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page-wrap recovery-page">
      <section className="surface" role="alert">
        <h1 style={{ color: "#173A70" }}>Data belum dapat dimuat</h1>
        <p className="muted">Terjadi gangguan saat mengambil data. Data sumber dan hasil penilaian tidak diubah oleh halaman ini.</p>
        <button className="logout-button" onClick={() => reset()} type="button">Coba lagi</button>
        <a className="task-link" href="/login">Kembali ke pilihan portal →</a>
      </section>
    </main>
  );
}
