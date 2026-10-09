import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JagaJKN — Transparansi iuran JKN",
  description: "Tinjau keterkaitan kontrak, upah, dan iuran perusahaan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
