import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MBKM Pembimbing — UDB",
  description: "Pembagian Dosen Pembimbing MBKM TA 2026/2027",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-100 text-slate-800">{children}</body>
    </html>
  );
}
