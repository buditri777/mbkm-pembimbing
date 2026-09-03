import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isAdmin as isAdminRole } from "@/lib/roles";

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
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-2">
        <h4 className="fw-bold mb-0">
          {isAdmin ? "Data Pembagian Dosen Pembimbing" : "Mahasiswa Bimbingan Saya"}
        </h4>
        <form action="/pembimbing" className="d-flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Cari nama/NIM/mitra…"
            className="form-control"
            style={{ width: "14rem" }}
          />
          <button className="btn btn-primary">Cari</button>
        </form>
      </div>

      <p className="text-body-secondary">
        {mahasiswa.length} mahasiswa {isAdmin ? "total" : "bimbingan saya"} (sumber: file Pembagian Dosen
        Pembimbing MBKM TA 2026/2027)
      </p>

      {isAdmin && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Rekap per Dosen</h5>
            <div className="d-flex flex-wrap gap-2">
              {[...rekap.entries()].sort((a, b) => b[1] - a[1]).map(([d, n]) => (
                <span key={d} className="badge rounded-pill bg-label-primary">
                  {d}: {n} mhs
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-responsive text-nowrap">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>NIM</th>
                <th>Nama</th>
                <th>Prodi</th>
                <th>Kelas</th>
                <th>Perusahaan</th>
                <th>Kota</th>
                <th>Bukti Perusahaan</th>
                {isAdmin && <th>Dosen Pembimbing</th>}
              </tr>
            </thead>
            <tbody className="table-border-bottom-0">
              {mahasiswa.map((m) => (
                <tr key={m.id}>
                  <td><small className="font-monospace">{m.nim}</small></td>
                  <td><span className="fw-medium">{m.nama}</span></td>
                  <td><small className="text-body-secondary">{m.prodi}</small></td>
                  <td><small className="text-body-secondary">{m.kelas}</small></td>
                  <td><small className="text-body-secondary text-truncate d-inline-block" style={{ maxWidth: "16rem" }} title={m.mitra}>{m.mitra}</small></td>
                  <td><small className="text-body-secondary">{m.kota}</small></td>
                  <td>
                    <a href={`/bukti?mitra=${encodeURIComponent(m.mitra)}`} className="fw-medium small">
                      {buktiCount.get(m.mitra) ?? 0} bukti →
                    </a>
                  </td>
                  {isAdmin && (
                    <td><span className="badge bg-label-secondary">{m.dosenNama}</span></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
