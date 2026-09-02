import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isAdmin as isAdminRole, ROLE_LABEL, type Role } from "@/lib/roles";
import TopBar from "@/components/top-bar";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PembagianPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session = await requireSession();
  const role = (session.user as { role?: string }).role;
  const userId = (session.user as { id?: string }).id;
  const isAdmin = isAdminRole(role);

  const q = searchParams.q?.trim();
  const cari = q
    ? {
        OR: [
          { nama: { contains: q } },
          { nim: { contains: q } },
          { mitra: { contains: q } },
          { dosenNama: { contains: q } },
        ],
      }
    : {};
  const where = isAdmin ? cari : { AND: [{ userId }, cari] };

  const mahasiswa = await prisma.mahasiswa.findMany({
    where,
    orderBy: [{ dosenNama: "asc" }, { nama: "asc" }],
  });

  // Bukti dihitung per perusahaan, bukan per mahasiswa
  const buktiPerMitra = await prisma.bukti.groupBy({ by: ["mitra"], _count: { mitra: true } });
  const buktiCount = new Map(buktiPerMitra.map((b) => [b.mitra, b._count.mitra]));

  const rekap = new Map<string, number>();
  for (const m of mahasiswa) rekap.set(m.dosenNama, (rekap.get(m.dosenNama) ?? 0) + 1);

  return (
    <div className="min-h-screen bg-slate-100">
      <TopBar
        title="MBKM Pembimbing"
        subtitle="TA 2026/2027"
        sessionName={session.user?.name ?? ""}
        roleLabel={ROLE_LABEL[(role as Role) ?? "DOSEN"]}
      />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-800">
            {isAdmin ? "Data Pembagian Dosen Pembimbing" : "Mahasiswa Bimbingan Saya"}
          </h1>
          <div className="flex items-center gap-2">
            <form action="/pembimbing" className="flex gap-2">
              <input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Cari nama/NIM/mitra…"
                className="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Cari</button>
            </form>
            <Link href="/dashboard" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
              ← Dashboard
            </Link>
          </div>
        </div>

        <p className="mb-4 text-sm text-slate-500">
          {mahasiswa.length} mahasiswa {isAdmin ? "total" : "bimbingan saya"} (sumber: file Pembagian Dosen Pembimbing MBKM TA 2026/2027)
        </p>

        {isAdmin && (
          <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-slate-700">Rekap per Dosen</h2>
            <div className="flex flex-wrap gap-2">
              {[...rekap.entries()].sort((a, b) => b[1] - a[1]).map(([d, n]) => (
                <span key={d} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {d}: {n} mhs
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">NIM</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Prodi</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Perusahaan</th>
                <th className="px-4 py-3">Kota</th>
                <th className="px-4 py-3">Bukti Perusahaan</th>
                {isAdmin && <th className="px-4 py-3">Dosen Pembimbing</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mahasiswa.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-xs">{m.nim}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{m.nama}</td>
                  <td className="px-4 py-2.5 text-slate-600">{m.prodi}</td>
                  <td className="px-4 py-2.5 text-slate-600">{m.kelas}</td>
                  <td className="max-w-xs truncate px-4 py-2.5 text-slate-600" title={m.mitra}>{m.mitra}</td>
                  <td className="px-4 py-2.5 text-slate-600">{m.kota}</td>
                  <td className="px-4 py-2.5">
                    <Link href={`/bukti?mitra=${encodeURIComponent(m.mitra)}`} className="text-xs font-semibold text-blue-600 hover:underline">
                      {buktiCount.get(m.mitra) ?? 0} bukti →
                    </Link>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-2.5">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{m.dosenNama}</span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
