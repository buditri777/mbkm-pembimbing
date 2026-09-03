import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isAdmin as isAdminRole, isSuperadmin } from "@/lib/roles";

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
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
        <h4 className="fw-bold mb-0">Dashboard</h4>
        <div className="d-flex gap-2">
          {isSuper && (
            <a href="/superadmin" className="btn btn-label-secondary">
              <i className="bx bx-shield me-1" /> Panel Super Admin
            </a>
          )}
          <a href="/pembimbing" className="btn btn-primary">
            <i className="bx bx-table me-1" /> Data Pembagian
          </a>
          <a href="/bukti" className="btn btn-label-success">
            <i className="bx bx-cloud-upload me-1" /> Bukti Dokumentasi
          </a>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-sm-6 col-xl-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <div className="avatar flex-shrink-0 me-3">
                  <span className="avatar-initial rounded bg-label-primary">
                    <i className="bx bx-group" />
                  </span>
                </div>
                <div>
                  <h3 className="mb-0">{isAdmin ? totalMhs : mhsSaya}</h3>
                  <small className="text-body-secondary">
                    {isAdmin ? "Total Mahasiswa" : "Mahasiswa Bimbingan Saya"}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-xl-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <div className="avatar flex-shrink-0 me-3">
                  <span className="avatar-initial rounded bg-label-info">
                    <i className="bx bx-building-house" />
                  </span>
                </div>
                <div>
                  <h3 className="mb-0">{totalMitra}</h3>
                  <small className="text-body-secondary">
                    {isAdmin ? "Total Perusahaan" : "Perusahaan Bimbingan Saya"}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-xl-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <div className="avatar flex-shrink-0 me-3">
                  <span className="avatar-initial rounded bg-label-success">
                    <i className="bx bx-file" />
                  </span>
                </div>
                <div>
                  <h3 className="mb-0">{totalBukti}</h3>
                  <small className="text-body-secondary">Total Bukti Terupload</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-xl-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <div className="avatar flex-shrink-0 me-3">
                  <span className="avatar-initial rounded bg-label-warning">
                    <i className="bx bx-check-circle" />
                  </span>
                </div>
                <div>
                  <h3 className="mb-0">{statByTipe["SUPERVISI"] ?? 0}</h3>
                  <small className="text-body-secondary">Bukti Supervisi</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Jenis Bukti yang Tersedia</h5>
          <ul className="text-body-secondary mb-3">
            <li><b>Penyerahan Magang</b> — bukti penyerahan mahasiswa ke mitra</li>
            <li><b>Supervisi</b> — bukti kunjungan/konsultasi supervisi dosen</li>
            <li><b>Penarikan</b> — bukti penarikan/penyelesaian magang</li>
          </ul>
          <p className="mb-0 text-body-secondary">
            Bukti dicatat <b>per perusahaan/mitra</b> — satu dokumen berlaku untuk seluruh mahasiswa
            yang magang di tempat tersebut. Diunggah sebagai <b>link Google Drive</b> (file atau folder).
          </p>
        </div>
      </div>
    </>
  );
}
