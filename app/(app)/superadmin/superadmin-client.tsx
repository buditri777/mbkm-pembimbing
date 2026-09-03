"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import { ROLES, ROLE_LABEL, type Role } from "@/lib/roles";

type User = {
  id: string; email: string; name: string; role: Role; isLecturer: boolean;
  _count: { mahasiswaList: number; buktiList: number };
};
type Mhs = {
  id: string; nim: string; nama: string; prodi: string; kelas: string;
  mitra: string; kota: string; dosenNama: string; userId: string | null;
};
type Dosen = { id: string; name: string; email: string; _count: { mahasiswaList: number } };
type Rekap = {
  id: string; nama: string; email: string;
  jumlahMitra: number; mitraSudah: string[]; mitraBelum: string[];
  totalBukti: number; perTipe: Record<string, number>;
  terakhirUpload: string | null; sudahUpload: boolean;
};
type BarisImport = {
  baris: number; nim: string; nama: string; prodi: string; kelas: string;
  mitra: string; kota: string; zona: string; dosen: string; status: string; masalah: string[];
};
type BarisDilewati = { baris: number; nim: string; nama: string; status: string; alasan: string };
type HasilImport = {
  mode: "pratinjau" | "terapkan";
  sheet: string; namaFile: string;
  kolomTerbaca: string[]; kolomHilang: string[];
  totalBaris: number; jumlahBaru: number; jumlahPerbarui: number; jumlahDitolak: number;
  jumlahDilewati: number;
  dosenTakDikenal: string[];
  contohBaru: BarisImport[]; contohPerbarui: BarisImport[]; ditolak: BarisImport[];
  dilewati: BarisDilewati[];
  dibuat?: number; diperbarui?: number;
};

const ROLE_BADGE: Record<Role, string> = {
  SUPERADMIN: "bg-label-primary",
  ADMIN: "bg-label-info",
  DOSEN: "bg-label-secondary",
};

const TABS = [
  ["users", "Manajemen Pengguna", "bx-user"],
  ["ploting", "Ploting Pembimbing", "bx-briefcase"],
  ["rekap", "Status Upload Bukti", "bx-check-circle"],
  ["import", "Import Excel", "bx-upload"],
] as const;

export default function SuperadminClient({ sessionName }: { sessionName: string }) {
  const [tab, setTab] = useState<"users" | "ploting" | "rekap" | "import">("users");
  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-0">Panel Super Admin</h4>
          <small className="text-body-secondary">
            Pengguna · ploting · status bukti · import data — {sessionName}
          </small>
        </div>
      </div>

      <ul className="nav nav-pills flex-wrap gap-1 mb-4">
        {TABS.map(([t, label, icon]) => (
          <li className="nav-item" key={t}>
            <button
              className={`nav-link d-flex align-items-center gap-2 ${tab === t ? "active" : "bg-label-secondary"}`}
              onClick={() => setTab(t)}
            >
              <i className={`bx ${icon}`} /> {label}
            </button>
          </li>
        ))}
      </ul>

      {tab === "users" ? (
        <UsersPanel />
      ) : tab === "ploting" ? (
        <PlotingPanel />
      ) : tab === "rekap" ? (
        <RekapPanel />
      ) : (
        <ImportPanel />
      )}
    </>
  );
}

/* ---------------- Manajemen Pengguna ---------------- */

function UsersPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("DOSEN");
  const [saving, setSaving] = useState(false);

  const [editId, setEditId] = useState("");
  const [editRole, setEditRole] = useState<Role>("DOSEN");
  const [editPass, setEditPass] = useState("");

  async function load() {
    setLoading(true);
    const r = await fetch("/api/users");
    setUsers(r.ok ? await r.json() : []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function flash(type: "ok" | "err", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    setSaving(false);
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      flash("ok", `Pengguna ${j.name} dibuat.`);
      setName(""); setEmail(""); setPassword(""); setRole("DOSEN");
      await load();
    } else flash("err", j.error ?? "Gagal membuat pengguna.");
  }

  async function saveEdit(id: string) {
    const body: Record<string, string> = { id, role: editRole };
    if (editPass) body.password = editPass;
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      flash("ok", `Perubahan untuk ${j.name} tersimpan.`);
      setEditId(""); setEditPass("");
      await load();
    } else flash("err", j.error ?? "Gagal menyimpan.");
  }

  return (
    <div className="row g-4">
      <div className="col-lg-4">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Tambah Pengguna</h5>
            <form onSubmit={createUser}>
              <Field label="Nama Lengkap">
                <input value={name} onChange={(e) => setName(e.target.value)} required className="form-control" placeholder="cth: Dr. Budi Santoso" />
              </Field>
              <Field label="Email">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-control" placeholder="nama@udb.ac.id" />
              </Field>
              <Field label="Password">
                <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="form-control" placeholder="minimal 8 karakter" />
              </Field>
              <Field label="Role">
                <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="form-select">
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
              </Field>
              {msg && (
                <div className={`alert py-2 ${msg.type === "ok" ? "alert-success" : "alert-danger"}`}>
                  {msg.text}
                </div>
              )}
              <button disabled={saving} className="btn btn-primary d-grid w-100">
                {saving ? "Menyimpan…" : "Buat Pengguna"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="col-lg-8">
        <div className="card">
          <div className="card-header">
            <h5 className="card-title mb-0">
              Daftar Pengguna <span className="text-body-secondary fw-normal small">({users.length})</span>
            </h5>
          </div>
          <div className="table-responsive text-nowrap">
            {loading ? (
              <p className="text-center text-body-secondary py-5">Memuat…</p>
            ) : (
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Bimbingan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody className="table-border-bottom-0">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td><span className="fw-medium">{u.name}</span></td>
                      <td><small className="text-body-secondary">{u.email}</small></td>
                      <td>
                        {editId === u.id ? (
                          <select value={editRole} onChange={(e) => setEditRole(e.target.value as Role)} className="form-select form-select-sm">
                            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                          </select>
                        ) : (
                          <span className={`badge rounded-pill ${ROLE_BADGE[u.role]}`}>
                            {ROLE_LABEL[u.role]}
                          </span>
                        )}
                      </td>
                      <td>{u._count.mahasiswaList} mhs</td>
                      <td>
                        {editId === u.id ? (
                          <div className="d-flex flex-column gap-1" style={{ minWidth: "12rem" }}>
                            <input
                              value={editPass}
                              onChange={(e) => setEditPass(e.target.value)}
                              placeholder="password baru (opsional)"
                              className="form-control form-control-sm"
                            />
                            <div className="d-flex gap-1">
                              <button onClick={() => saveEdit(u.id)} className="btn btn-sm btn-success">Simpan</button>
                              <button onClick={() => { setEditId(""); setEditPass(""); }} className="btn btn-sm btn-label-secondary">Batal</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditId(u.id); setEditRole(u.role); setEditPass(""); }}
                            className="btn btn-sm btn-outline-secondary"
                          >
                            Ubah
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Ploting Pembimbing ---------------- */

function PlotingPanel() {
  const [mahasiswa, setMahasiswa] = useState<Mhs[]>([]);
  const [dosen, setDosen] = useState<Dosen[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetDosen, setTargetDosen] = useState("");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/ploting");
    if (r.ok) {
      const j = await r.json();
      setMahasiswa(j.mahasiswa); setDosen(j.dosen);
    }
    setSelected(new Set());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return mahasiswa;
    const s = q.toLowerCase();
    return mahasiswa.filter((m) =>
      `${m.nim} ${m.nama} ${m.mitra} ${m.dosenNama} ${m.prodi}`.toLowerCase().includes(s)
    );
  }, [mahasiswa, q]);

  const belumPlot = mahasiswa.filter((m) => !m.userId).length;

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function toggleAll() {
    setSelected((prev) => (prev.size === filtered.length ? new Set() : new Set(filtered.map((m) => m.id))));
  }

  async function assign(lepas: boolean) {
    if (selected.size === 0) return;
    if (!lepas && !targetDosen) {
      setMsg({ type: "err", text: "Pilih dosen tujuan dulu." });
      return;
    }
    setSaving(true);
    const res = await fetch("/api/ploting", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mahasiswaIds: [...selected], dosenId: lepas ? null : targetDosen }),
    });
    setSaving(false);
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({ type: "ok", text: lepas ? `${j.diubah} mahasiswa dilepas dari pembimbing.` : `${j.diubah} mahasiswa dipindah ke ${j.dosen}.` });
      await load();
    } else setMsg({ type: "err", text: j.error ?? "Gagal menyimpan." });
    setTimeout(() => setMsg(null), 4000);
  }

  return (
    <div>
      <div className="row g-4 mb-4">
        <div className="col-sm-4"><MiniStat label="Total Mahasiswa" value={mahasiswa.length} icon="bx-group" /></div>
        <div className="col-sm-4"><MiniStat label="Dosen Pembimbing" value={dosen.length} icon="bx-user" /></div>
        <div className="col-sm-4"><MiniStat label="Belum Diplot" value={belumPlot} warn={belumPlot > 0} icon="bx-user-x" /></div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-end gap-3">
            <div className="flex-grow-1" style={{ minWidth: "200px" }}>
              <label className="form-label">Cari mahasiswa</label>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="NIM / nama / perusahaan / dosen…" className="form-control" />
            </div>
            <div style={{ minWidth: "220px" }}>
              <label className="form-label">Tugaskan ke dosen</label>
              <select value={targetDosen} onChange={(e) => setTargetDosen(e.target.value)} className="form-select">
                <option value="">— pilih dosen —</option>
                {dosen.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d._count.mahasiswaList} mhs)</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => assign(false)}
              disabled={saving || selected.size === 0}
              className="btn btn-primary"
            >
              <i className="bx bx-check me-1" /> Tugaskan {selected.size > 0 && `(${selected.size})`}
            </button>
            <button
              onClick={() => assign(true)}
              disabled={saving || selected.size === 0}
              className="btn btn-label-secondary"
            >
              Lepas Ploting
            </button>
          </div>
          {msg && (
            <div className={`alert mt-3 mb-0 py-2 ${msg.type === "ok" ? "alert-success" : "alert-danger"}`}>
              {msg.text}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="table-responsive text-nowrap">
          {loading ? (
            <p className="text-center text-body-secondary py-5">Memuat…</p>
          ) : (
            <table className="table table-hover">
              <thead>
                <tr>
                  <th style={{ width: "2rem" }}>
                    <input className="form-check-input" type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleAll} />
                  </th>
                  <th>NIM</th>
                  <th>Nama</th>
                  <th>Prodi</th>
                  <th>Perusahaan</th>
                  <th>Dosen Pembimbing</th>
                </tr>
              </thead>
              <tbody className="table-border-bottom-0">
                {filtered.map((m) => (
                  <tr key={m.id} className={selected.has(m.id) ? "table-active" : ""}>
                    <td>
                      <input className="form-check-input" type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} />
                    </td>
                    <td><small className="font-monospace">{m.nim}</small></td>
                    <td><span className="fw-medium">{m.nama}</span></td>
                    <td><small className="text-body-secondary">{m.prodi}</small></td>
                    <td><small className="text-body-secondary text-truncate d-inline-block" style={{ maxWidth: "16rem" }} title={m.mitra}>{m.mitra}</small></td>
                    <td>
                      {m.userId ? (
                        <span className="badge bg-label-secondary">{m.dosenNama}</span>
                      ) : (
                        <span className="badge bg-label-warning">belum diplot</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Status Upload Bukti per Dosen ---------------- */

function RekapPanel() {
  const [rows, setRows] = useState<Rekap[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"semua" | "sudah" | "belum">("semua");
  const [q, setQ] = useState("");
  const [buka, setBuka] = useState<string>("");

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/rekap-bukti");
      setRows(r.ok ? await r.json() : []);
      setLoading(false);
    })();
  }, []);

  const sudah = rows.filter((r) => r.sudahUpload).length;
  const belum = rows.length - sudah;
  const belumLengkap = rows.filter((r) => r.mitraBelum.length > 0).length;

  const tampil = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "sudah" && !r.sudahUpload) return false;
      if (filter === "belum" && r.sudahUpload) return false;
      if (q.trim() && !`${r.nama} ${r.email}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [rows, filter, q]);

  if (loading) return <p className="text-center text-body-secondary py-5">Memuat…</p>;

  return (
    <div>
      <div className="row g-4 mb-4">
        <div className="col-sm-3"><MiniStat label="Total Dosen" value={rows.length} icon="bx-user" /></div>
        <div className="col-sm-3"><MiniStat label="Sudah Upload" value={sudah} icon="bx-check-circle" /></div>
        <div className="col-sm-3"><MiniStat label="Belum Upload Sama Sekali" value={belum} warn={belum > 0} icon="bx-x-circle" /></div>
        <div className="col-sm-3"><MiniStat label="Ada Perusahaan Kosong" value={belumLengkap} warn={belumLengkap > 0} icon="bx-buildings" /></div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-end gap-3">
            <div className="flex-grow-1" style={{ minWidth: "220px" }}>
              <label className="form-label">Cari dosen</label>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="nama / email…" className="form-control" />
            </div>
            <div className="btn-group" role="group">
              {([["semua", "Semua"], ["sudah", "Sudah upload"], ["belum", "Belum upload"]] as const).map(([f, label]) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`btn ${filter === f ? "btn-primary" : "btn-label-secondary"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive text-nowrap">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Status</th>
                <th>Dosen</th>
                <th>Perusahaan</th>
                <th>Bukti</th>
                <th>Rincian Jenis</th>
                <th>Terakhir Upload</th>
                <th />
              </tr>
            </thead>
            <tbody className="table-border-bottom-0">
              {tampil.length === 0 && (
                <tr><td colSpan={7} className="text-center text-body-secondary py-4">Tidak ada data.</td></tr>
              )}
              {tampil.map((r) => (
                <Fragment key={r.id}>
                  <tr>
                    <td>
                      {r.sudahUpload ? (
                        <span className="badge bg-label-success">Sudah</span>
                      ) : (
                        <span className="badge bg-label-danger">Belum</span>
                      )}
                    </td>
                    <td>
                      <span className="fw-medium">{r.nama}</span>
                      <br /><small className="text-body-secondary">{r.email}</small>
                    </td>
                    <td>
                      <span className="fw-semibold">{r.mitraSudah.length}</span>
                      <span className="text-body-secondary"> / {r.jumlahMitra}</span>
                      {r.mitraBelum.length > 0 && (
                        <span className="badge bg-label-warning ms-2">
                          {r.mitraBelum.length} kosong
                        </span>
                      )}
                    </td>
                    <td><span className="fw-semibold">{r.totalBukti}</span></td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {(["PENYERAHAN", "SUPERVISI", "PENARIKAN"] as const).map((t) => (
                          <span
                            key={t}
                            className={`badge ${r.perTipe[t] ? "bg-label-primary" : "bg-label-secondary"}`}
                            title={t}
                          >
                            {t.slice(0, 3)} {r.perTipe[t] ?? 0}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <small className="text-body-secondary">
                        {r.terakhirUpload
                          ? new Date(r.terakhirUpload).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </small>
                    </td>
                    <td>
                      {r.jumlahMitra > 0 && (
                        <button
                          onClick={() => setBuka(buka === r.id ? "" : r.id)}
                          className="btn btn-sm btn-outline-secondary"
                        >
                          {buka === r.id ? "Tutup" : "Rincian"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {buka === r.id && (
                    <tr className="table-light">
                      <td colSpan={7}>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="text-success fw-semibold small text-uppercase mb-1">
                              Sudah ada bukti ({r.mitraSudah.length})
                            </div>
                            {r.mitraSudah.length === 0 ? (
                              <p className="small text-body-secondary mb-0">—</p>
                            ) : (
                              <ul className="small mb-0">
                                {r.mitraSudah.map((m) => <li key={m}>✓ {m}</li>)}
                              </ul>
                            )}
                          </div>
                          <div className="col-md-6">
                            <div className="text-warning fw-semibold small text-uppercase mb-1">
                              Belum ada bukti ({r.mitraBelum.length})
                            </div>
                            {r.mitraBelum.length === 0 ? (
                              <p className="small text-body-secondary mb-0">— semua lengkap</p>
                            ) : (
                              <ul className="small mb-0">
                                {r.mitraBelum.map((m) => <li key={m}>• {m}</li>)}
                              </ul>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Import Excel ---------------- */

const LABEL_KOLOM: Record<string, string> = {
  nim: "NIM", nama: "Nama", prodi: "Prodi", kelas: "Kelas",
  mitra: "Perusahaan", kota: "Kota", zona: "Zona", dosen: "Dosen Pembimbing",
  status: "Status MBKM",
};

function ImportPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [hasil, setHasil] = useState<HasilImport | null>(null);
  const [error, setError] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [lihat, setLihat] = useState<"baru" | "perbarui" | "ditolak" | "dilewati">("baru");

  async function kirim(terapkan: boolean) {
    if (!file) { setError("Pilih file Excel dulu."); return; }
    setError(""); setSibuk(true);
    const fd = new FormData();
    fd.append("file", file);
    if (terapkan) fd.append("terapkan", "true");
    const res = await fetch("/api/import-mahasiswa", { method: "POST", body: fd });
    setSibuk(false);
    const j = await res.json().catch(() => ({}));
    if (res.ok) { setHasil(j); setLihat("baru"); }
    else { setHasil(null); setError(j.error ?? "Gagal memproses file."); }
  }

  const sudahDiterapkan = hasil?.mode === "terapkan";
  const daftar = hasil
    ? lihat === "baru" ? hasil.contohBaru : lihat === "perbarui" ? hasil.contohPerbarui : hasil.ditolak
    : [];

  return (
    <div>
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Import Data Mahasiswa dari Excel</h5>
          <p className="small text-body-secondary">
            Unggah file <b>.xlsx / .xls / .csv</b>. Baris dicocokkan berdasarkan <b>NIM</b> —
            NIM yang sudah ada akan diperbarui, yang belum ada ditambahkan. Data tidak pernah dihapus.
            Baris berstatus <b>Ditolak</b> dan <b>Menunggu Validasi</b> tidak diimpor, dan satu mahasiswa
            hanya masuk sekali (dipilih status paling final).
          </p>

          <div className="alert alert-light border small">
            <div className="fw-semibold mb-1">Kolom yang dikenali</div>
            <div className="d-flex flex-wrap gap-1">
              {Object.entries(LABEL_KOLOM).map(([k, v]) => (
                <span key={k} className="badge bg-label-secondary">
                  {v}{k === "nim" || k === "nama" || k === "mitra" ? " *" : ""}
                </span>
              ))}
            </div>
            <div className="mt-2 text-body-secondary">
              * wajib. Urutan kolom bebas; baris judul di atas header tidak masalah (dicari sampai 10 baris pertama).
              Nama dosen dicocokkan otomatis dengan akun yang ada — gelar diabaikan.
            </div>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-3">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setHasil(null); setError(""); }}
              className="form-control"
              style={{ maxWidth: "22rem" }}
            />
            <button
              onClick={() => kirim(false)}
              disabled={sibuk || !file}
              className="btn btn-outline-primary"
            >
              <i className="bx bx-search-alt me-1" /> {sibuk ? "Memproses…" : "Pratinjau"}
            </button>
          </div>

          {error && <div className="alert alert-danger mt-3 mb-0 py-2">{error}</div>}
        </div>
      </div>

      {hasil && (
        <>
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                <div>
                  <h5 className="mb-0 fw-semibold">
                    {sudahDiterapkan ? "Hasil Import" : "Pratinjau"} — {hasil.namaFile}
                  </h5>
                  <small className="text-body-secondary">
                    Sheet &quot;{hasil.sheet}&quot; · {hasil.totalBaris} baris terbaca
                    {hasil.kolomHilang.length > 0 &&
                      ` · kolom tidak ditemukan: ${hasil.kolomHilang.map((k) => LABEL_KOLOM[k] ?? k).join(", ")}`}
                  </small>
                </div>
                {!sudahDiterapkan && hasil.jumlahBaru + hasil.jumlahPerbarui > 0 && (
                  <button
                    onClick={() => kirim(true)}
                    disabled={sibuk}
                    className="btn btn-primary"
                  >
                    {sibuk ? "Menyimpan…" : `Terapkan ${hasil.jumlahBaru + hasil.jumlahPerbarui} baris`}
                  </button>
                )}
              </div>

              {sudahDiterapkan && (
                <div className="alert alert-success py-2">
                  Tersimpan: <b>{hasil.dibuat}</b> mahasiswa baru, <b>{hasil.diperbarui}</b> diperbarui.
                  {hasil.jumlahDitolak > 0 && ` ${hasil.jumlahDitolak} baris dilewati karena bermasalah.`}
                  {hasil.jumlahDilewati > 0 && ` ${hasil.jumlahDilewati} baris dilewati (status/duplikat).`}
                </div>
              )}

              <div className="row g-3">
                <div className="col-6 col-sm-3"><MiniStatPlain label={sudahDiterapkan ? "Ditambahkan" : "Akan ditambahkan"} value={hasil.jumlahBaru} /></div>
                <div className="col-6 col-sm-3"><MiniStatPlain label={sudahDiterapkan ? "Diperbarui" : "Akan diperbarui"} value={hasil.jumlahPerbarui} /></div>
                <div className="col-6 col-sm-3"><MiniStatPlain label="Bermasalah" value={hasil.jumlahDitolak} warn={hasil.jumlahDitolak > 0} /></div>
                <div className="col-6 col-sm-3"><MiniStatPlain label="Dilewati (status/duplikat)" value={hasil.jumlahDilewati} /></div>
              </div>

              {hasil.dosenTakDikenal.length > 0 && (
                <div className="alert alert-warning mt-3 mb-0">
                  <b>{hasil.dosenTakDikenal.length} nama dosen belum punya akun</b> — datanya tetap masuk, tapi
                  mahasiswa belum terhubung ke dosen. Buat akunnya di tab Manajemen Pengguna, lalu tugaskan
                  lewat tab Ploting Pembimbing.
                  <div className="d-flex flex-wrap gap-1 mt-2">
                    {hasil.dosenTakDikenal.map((d) => (
                      <span key={d} className="badge bg-label-warning">{d}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header pb-0">
              <ul className="nav nav-pills flex-wrap gap-1">
                {([
                  ["baru", `Baru (${hasil.jumlahBaru})`],
                  ["perbarui", `Diperbarui (${hasil.jumlahPerbarui})`],
                  ["ditolak", `Bermasalah (${hasil.jumlahDitolak})`],
                  ["dilewati", `Dilewati (${hasil.jumlahDilewati})`],
                ] as const).map(([k, label]) => (
                  <li className="nav-item" key={k}>
                    <button
                      onClick={() => setLihat(k)}
                      className={`nav-link py-1 ${lihat === k ? "active" : "bg-label-secondary"}`}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-body">
              {lihat === "dilewati" ? (
                hasil.dilewati.length === 0 ? (
                  <p className="text-center text-body-secondary py-4">Tidak ada baris yang dilewati.</p>
                ) : (
                  <div className="table-responsive text-nowrap">
                    <p className="small text-body-secondary">
                      Baris berikut sengaja tidak diimpor: status belum final (Ditolak / Menunggu Validasi),
                      atau mahasiswa yang sama muncul lebih dari sekali — dipakai baris dengan status paling final.
                    </p>
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th>Baris</th><th>NIM</th><th>Nama</th><th>Status</th><th>Alasan</th>
                        </tr>
                      </thead>
                      <tbody className="table-border-bottom-0">
                        {hasil.dilewati.map((r) => (
                          <tr key={`${r.baris}-${r.nim}`}>
                            <td><small className="text-body-secondary">{r.baris}</small></td>
                            <td><small className="font-monospace">{r.nim || "—"}</small></td>
                            <td><span className="fw-medium">{r.nama || "—"}</span></td>
                            <td><small className="text-body-secondary">{r.status || "—"}</small></td>
                            <td><small className="text-body-secondary">{r.alasan}</small></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : daftar.length === 0 ? (
                <p className="text-center text-body-secondary py-4">Tidak ada baris di kategori ini.</p>
              ) : (
                <div className="table-responsive text-nowrap">
                  <table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th>Baris</th><th>NIM</th><th>Nama</th><th>Perusahaan</th><th>Dosen</th>
                        {lihat === "ditolak" && <th>Masalah</th>}
                      </tr>
                    </thead>
                    <tbody className="table-border-bottom-0">
                      {daftar.map((r) => (
                        <tr key={`${r.baris}-${r.nim}`}>
                          <td><small className="text-body-secondary">{r.baris}</small></td>
                          <td><small className="font-monospace">{r.nim || "—"}</small></td>
                          <td><span className="fw-medium">{r.nama || "—"}</span></td>
                          <td><small className="text-body-secondary text-truncate d-inline-block" style={{ maxWidth: "18rem" }} title={r.mitra}>{r.mitra || "—"}</small></td>
                          <td><small className="text-body-secondary">{r.dosen || "—"}</small></td>
                          {lihat === "ditolak" && (
                            <td>
                              <div className="d-flex flex-wrap gap-1">
                                {r.masalah.map((m) => (
                                  <span key={m} className="badge bg-label-danger">{m}</span>
                                ))}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {lihat !== "ditolak" && daftar.length === 50 && (
                    <p className="small text-body-secondary mb-0">Menampilkan 50 baris pertama.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- primitives ---------------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

/** Kartu statistik Sneat (varian penuh). */
function MiniStat({ label, value, warn, icon }: { label: string; value: number; warn?: boolean; icon: string }) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex align-items-center">
          <div className="avatar flex-shrink-0 me-3">
            <span className={`avatar-initial rounded ${warn ? "bg-label-warning" : "bg-label-primary"}`}>
              <i className={`bx ${icon}`} />
            </span>
          </div>
          <div>
            <h3 className={`mb-0 ${warn ? "text-warning" : ""}`}>{value}</h3>
            <small className="text-body-secondary">{label}</small>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Statistik mini tanpa kartu (dipakai di dalam card import). */
function MiniStatPlain({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="border rounded p-3">
      <div className={`fs-3 fw-bold ${warn ? "text-warning" : ""}`}>{value}</div>
      <div className="small text-body-secondary">{label}</div>
    </div>
  );
}
