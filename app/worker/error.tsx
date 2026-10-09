"use client";

export default function WorkerError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page-wrap recovery-page">
      <section className="surface" role="alert">
        <span className="demo-pill">Synthetic / Demo</span>
        <h1>Data pekerja belum dapat dimuat</h1>
        <p className="muted">Permintaan gagal diproses. Coba kembali dalam beberapa saat.</p>
        <button className="logout-button" onClick={() => reset()} type="button">Coba lagi</button>
        <a className="task-link" href="/worker">Kembali ke ringkasan →</a>
      </section>
    </main>
  );
}
