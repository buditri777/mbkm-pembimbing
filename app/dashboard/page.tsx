import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isAdmin as isAdminRole, isSuperadmin, ROLE_LABEL, type Role } from "@/lib/roles";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();
  const role = (session.user as { role?: string }).role;
  const userId = (session.user as { id?: string }).id;
  const isAdmin = isAdminRole(role);
  const isSuper = isSuperadmin(role);

  const [totalMhs, totalBukti, mhsSaya, buktiCounts, mitraSemua, mitraSaya] = await Promise.all([
    prisma.mahasiswa.count(),
    prisma.bukti.count(),
    prisma.mahasiswa.count({ where: { userId } }),
    prisma.bukti.groupBy({ by: ["tipe"], _count: { tipe: true } }),
    prisma.mahasiswa.findMany({ select: { mitra: true }, distinct: ["mitra"] }),
    prisma.mahasiswa.findMany({ where: { userId }, select: { mitra: true }, distinct: ["mitra"] }),
  ]);

  const statByTipe: Record<string, number> = {};
  for (const b of buktiCounts) statByTipe[b.tipe] = b._count.tipe;

  const totalMitra = isAdmin ? mitraSemua.length : mitraSaya.length;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">M</div>
            <div>
              <div className="font-bold text-slate-800">MBKM Pembimbing</div>
              <div className="text-xs text-slate-500">TA 2026/2027 — Universitas Duta Bangsa</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-800">{session.user?.name}</div>
              <div className="text-xs text-slate-500">{ROLE_LABEL[(role as Role) ?? "DOSEN"] ?? "Dosen Pembimbing"}</div>
            </div>
            <form action="/api/auth/signout" method="post">
              <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <div className="flex flex-wrap gap-2">
            {isSuper && (
              <Link href="/superadmin" className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700">
                Panel Super Admin
              </Link>
            )}
            <Link href="/pembimbing" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Data Pembagian
            </Link>
            <Link href="/bukti" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              Bukti Dokumentasi
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title={isAdmin ? "Total Mahasiswa" : "Mahasiswa Bimbingan Saya"} value={isAdmin ? totalMhs : mhsSaya} accent="bg-blue-500" />
          <StatCard title={isAdmin ? "Total Perusahaan" : "Perusahaan Bimbingan Saya"} value={totalMitra} accent="bg-purple-500" />
          <StatCard title="Total Bukti Terupload" value={totalBukti} accent="bg-emerald-500" />
          <StatCard title="Bukti Supervisi" value={statByTipe["SUPERVISI"] ?? 0} accent="bg-amber-500" />
        </div>

        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Jenis Bukti yang Tersedia</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
            <li><b>Penyerahan Magang</b> — bukti penyerahan mahasiswa ke mitra</li>
            <li><b>Supervisi</b> — bukti kunjungan/konsultasi supervisi dosen</li>
            <li><b>Penarikan</b> — bukti penarikan/penyelesaian magang</li>
          </ul>
          <p className="mt-3 text-sm text-slate-500">
            Bukti dicatat <b>per perusahaan/mitra</b> — satu dokumen berlaku untuk seluruh mahasiswa
            yang magang di tempat tersebut. Diunggah sebagai <b>link Google Drive</b> (file atau folder).
          </p>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, accent }: { title: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className={`mb-3 h-1.5 w-10 rounded-full ${accent}`} />
      <div className="text-3xl font-bold text-slate-800">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{title}</div>
    </div>
  );
}
