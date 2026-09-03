import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MBKM 2026 UDB",
  description: "Sistem Pembimbing MBKM — Universitas Duta Bangsa, TA 2026/2027",
  icons: { icon: "/sneat/favicon/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="light-style layout-navbar-fixed" data-template="vertical-menu-template-free">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/sneat/fonts/iconify-icons.css" />
        <link rel="stylesheet" href="/sneat/css/core.css" />
        <link rel="stylesheet" href="/sneat/css/demo.css" />
        <link rel="stylesheet" href="/sneat/css/perfect-scrollbar.css" />
        <link rel="stylesheet" href="/sneat/css/pages/page-auth.css" />
        <script src="/sneat/sneat-bundle.js" defer />
      </head>
      <body>{children}</body>
    </html>
  );
}
