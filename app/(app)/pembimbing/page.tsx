import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isAdmin as isAdminRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

const PER_PAGE = 25;

export default async function PembagianPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const session = await requireSession();
  const role = (session.user as { role?: string }).role;
  const userId = (session.user as { id?: string }).id;
  const isAdmin = isAdminRole(role);

  const q = searchParams.q?.trim();
  const page = Math.max(1, Number(searchParams.page) || 1);
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

  const [total, mahasiswa] = await Promise.all([
    prisma.mahasiswa.count({ where }),
    prisma.mahasiswa.findMany({
      where,
      orderBy: [{ dosenNama: "asc" }, { nama: "asc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const from = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, total);

  // Bukti dihitung per perusahaan, bukan per mahasiswa
  const buktiPerMitra = await prisma.bukti.groupBy({ by: ["mitra"], _count: { mitra: true } });
  const buktiCount = new Map(buktiPerMitra.map((b) => [b.mitra, b._count.mitra]));

  // Rekap per dosen = agregat penuh (bukan hanya halaman ini)
  const rekapRows = isAdmin
    ? await prisma.mahasiswa.groupBy({
        by: ["dosenNama"],
        where,
        _count: { dosenNama: true },
        orderBy: { _count: { dosenNama: "desc" } },
      })
    : [];

  const qs = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    sp.set("page", String(p));
    return `/pembimbing?${sp.toString()}`;
  };

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
          {q && (
            <a href="/pembimbing" className="btn btn-outline-secondary">
              Reset
            </a>
          )}
        </form>
      </div>

      <p className="text-body-secondary">
        {total} mahasiswa {isAdmin ? "total" : "bimbingan saya"}
        {q ? ` (hasil pencarian "${q}")` : ""} — menampilkan {from}–{to}
      </p>

      {isAdmin && rekapRows.length > 0 && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Rekap per Dosen</h5>
            <div className="d-flex flex-wrap gap-2">
              {rekapRows.map((r) => (
                <span key={r.dosenNama} className="badge rounded-pill bg-label-primary">
                  {r.dosenNama}: {r._count.dosenNama} mhs
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
              {mahasiswa.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="text-center text-body-secondary py-4">
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                mahasiswa.map((m) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="card-footer d-flex flex-wrap align-items-center justify-content-between gap-2">
            <small className="text-body-secondary">
              Halaman {page} dari {totalPages}
            </small>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                  <a className="page-link" href={qs(Math.max(1, page - 1))}>
                    <i className="bx bx-chevron-left" />
                  </a>
                </li>
                {pageWindow(page, totalPages).map((p, i) =>
                  p === "…" ? (
                    <li key={`e${i}`} className="page-item disabled">
                      <span className="page-link">…</span>
                    </li>
                  ) : (
                    <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                      <a className="page-link" href={qs(p as number)}>
                        {p}
                      </a>
                    </li>
                  )
                )}
                <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                  <a className="page-link" href={qs(Math.min(totalPages, page + 1))}>
                    <i className="bx bx-chevron-right" />
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </>
  );
}

/** Jendela nomor halaman ringkas: 1 … 4 5 [6] 7 8 … 20 */
function pageWindow(current: number, total: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  const push = (n: number) => out.push(n);
  const around = 1;
  const first = 1;
  const last = total;
  const start = Math.max(first, current - around);
  const end = Math.min(last, current + around);
  push(first);
  if (start > first + 1) out.push("…");
  for (let p = start; p <= end; p++) if (p !== first && p !== last) push(p);
  if (end < last - 1) out.push("…");
  if (last !== first) push(last);
  return out;
}
