import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-wrap recovery-page">
      <section className="surface" role="status">
        <h1 style={{ color: "#173A70" }}>Halaman atau data tidak ditemukan</h1>
        <p className="muted">Periksa tautan atau kembali ke portal sesuai peran Anda.</p>
        <Link className="logout-button inline-button" href="/login">Kembali ke login</Link>
      </section>
    </main>
  );
}
