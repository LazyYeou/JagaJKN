import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JagaJKN — Data Simulasi",
  description: "Demo transparansi dan prioritas pemeriksaan iuran JKN berbasis data simulasi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
