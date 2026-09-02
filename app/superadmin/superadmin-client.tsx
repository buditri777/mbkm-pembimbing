"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import TopBar from "@/components/top-bar";
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
  SUPERADMIN: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  DOSEN: "bg-slate-100 text-slate-700",
};

export default function SuperadminClient({ sessionName }: { sessionName: string }) {
  const [tab, setTab] = useState<"users" | "ploting" | "rekap" | "import">("users");
  const TAB_LABEL = {
    users: "Manajemen Pengguna",
    ploting: "Ploting Pembimbing",
    rekap: "Status Upload Bukti",
    import: "Import Excel",
  } as const;
  return (
    <div className="min-h-screen bg-slate-100">
      <TopBar
        title="Panel Super Admin"
        subtitle="Pengguna · ploting · status bukti · import data"
        sessionName={sessionName}
        roleLabel="Super Admin"
      />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 inline-flex flex-wrap rounded-xl bg-white p-1 shadow-sm">
          {(["users", "ploting", "rekap", "import"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                tab === t ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
        {tab === "users" ? (
          <UsersPanel />
        ) : tab === "ploting" ? (
          <PlotingPanel />
        ) : tab === "rekap" ? (
          <RekapPanel />
        ) : (
          <ImportPanel />
        )}
      </main>
    </div>
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-1">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Tambah Pengguna</h2>
        <form onSubmit={createUser} className="space-y-4">
          <Field label="Nama Lengkap">
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} placeholder="cth: Dr. Budi Santoso" />
          </Field>
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} placeholder="nama@udb.ac.id" />
          </Field>
          <Field label="Password">
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className={inputCls} placeholder="minimal 8 karakter" />
          </Field>
          <Field label="Role">
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputCls}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </Field>
          {msg && (
            <div className={`rounded-lg px-3 py-2 text-sm ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              {msg.text}
            </div>
          )}
          <button disabled={saving} className="w-full rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50">
            {saving ? "Menyimpan…" : "Buat Pengguna"}
          </button>
        </form>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Daftar Pengguna <span className="text-sm font-normal text-slate-500">({users.length})</span>
        </h2>
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Memuat…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Nama</th>
                  <th className="px-3 py-2.5">Email</th>
                  <th className="px-3 py-2.5">Role</th>
                  <th className="px-3 py-2.5">Bimbingan</th>
                  <th className="px-3 py-2.5">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="align-top hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-medium text-slate-800">{u.name}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">{u.email}</td>
                    <td className="px-3 py-2.5">
                      {editId === u.id ? (
                        <select value={editRole} onChange={(e) => setEditRole(e.target.value as Role)} className="rounded border border-slate-300 px-2 py-1 text-xs">
                          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                        </select>
                      ) : (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE[u.role]}`}>
                          {ROLE_LABEL[u.role]}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{u._count.mahasiswaList} mhs</td>
                    <td className="px-3 py-2.5">
                      {editId === u.id ? (
                        <div className="space-y-1.5">
                          <input
                            value={editPass}
                            onChange={(e) => setEditPass(e.target.value)}
                            placeholder="password baru (opsional)"
                            className="w-44 rounded border border-slate-300 px-2 py-1 text-xs"
                          />
                          <div className="flex gap-1.5">
                            <button onClick={() => saveEdit(u.id)} className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700">Simpan</button>
                            <button onClick={() => { setEditId(""); setEditPass(""); }} className="rounded border border-slate-300 px-2.5 py-1 text-xs text-slate-600">Batal</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditId(u.id); setEditRole(u.role); setEditPass(""); }}
                          className="rounded border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          Ubah
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MiniStat label="Total Mahasiswa" value={mahasiswa.length} />
        <MiniStat label="Dosen Pembimbing" value={dosen.length} />
        <MiniStat label="Belum Diplot" value={belumPlot} warn={belumPlot > 0} />
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-slate-700">Cari mahasiswa</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="NIM / nama / perusahaan / dosen…" className={inputCls} />
          </div>
          <div className="min-w-[220px]">
            <label className="mb-1 block text-sm font-medium text-slate-700">Tugaskan ke dosen</label>
            <select value={targetDosen} onChange={(e) => setTargetDosen(e.target.value)} className={inputCls}>
              <option value="">— pilih dosen —</option>
              {dosen.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d._count.mahasiswaList} mhs)</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => assign(false)}
            disabled={saving || selected.size === 0}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-40"
          >
            Tugaskan {selected.size > 0 && `(${selected.size})`}
          </button>
          <button
            onClick={() => assign(true)}
            disabled={saving || selected.size === 0}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Lepas Ploting
          </button>
        </div>
        {msg && (
          <div className={`mt-3 rounded-lg px-3 py-2 text-sm ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {msg.text}
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        {loading ? (
          <p className="py-10 text-center text-sm text-slate-400">Memuat…</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">
                  <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleAll} />
                </th>
                <th className="px-3 py-3">NIM</th>
                <th className="px-3 py-3">Nama</th>
                <th className="px-3 py-3">Prodi</th>
                <th className="px-3 py-3">Perusahaan</th>
                <th className="px-3 py-3">Dosen Pembimbing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((m) => (
                <tr key={m.id} className={selected.has(m.id) ? "bg-purple-50" : "hover:bg-slate-50"}>
                  <td className="px-3 py-2.5">
                    <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} />
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">{m.nim}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{m.nama}</td>
                  <td className="px-3 py-2.5 text-slate-600">{m.prodi}</td>
                  <td className="max-w-xs truncate px-3 py-2.5 text-slate-600" title={m.mitra}>{m.mitra}</td>
                  <td className="px-3 py-2.5">
                    {m.userId ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{m.dosenNama}</span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">belum diplot</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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

  if (loading) return <p className="py-10 text-center text-sm text-slate-400">Memuat…</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MiniStat label="Total Dosen" value={rows.length} />
        <MiniStat label="Sudah Upload" value={sudah} />
        <MiniStat label="Belum Upload Sama Sekali" value={belum} warn={belum > 0} />
        <MiniStat label="Ada Perusahaan Kosong" value={belumLengkap} warn={belumLengkap > 0} />
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">Cari dosen</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="nama / email…" className={inputCls} />
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 p-1">
            {(["semua", "sudah", "belum"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded px-3 py-1.5 text-sm font-medium capitalize transition ${
                  filter === f ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f === "semua" ? "Semua" : f === "sudah" ? "Sudah upload" : "Belum upload"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Dosen</th>
              <th className="px-3 py-3">Perusahaan</th>
              <th className="px-3 py-3">Bukti</th>
              <th className="px-3 py-3">Rincian Jenis</th>
              <th className="px-3 py-3">Terakhir Upload</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tampil.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-sm text-slate-400">Tidak ada data.</td></tr>
            )}
            {tampil.map((r) => (
              <Fragment key={r.id}>
                <tr className="hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    {r.sudahUpload ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Sudah</span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Belum</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-slate-800">{r.nama}</div>
                    <div className="text-xs text-slate-500">{r.email}</div>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    <span className="font-semibold text-slate-800">{r.mitraSudah.length}</span>
                    <span className="text-slate-400"> / {r.jumlahMitra}</span>
                    {r.mitraBelum.length > 0 && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {r.mitraBelum.length} kosong
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{r.totalBukti}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {(["PENYERAHAN", "SUPERVISI", "PENARIKAN"] as const).map((t) => (
                        <span
                          key={t}
                          className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                            r.perTipe[t] ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-400"
                          }`}
                          title={t}
                        >
                          {t.slice(0, 3)} {r.perTipe[t] ?? 0}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">
                    {r.terakhirUpload
                      ? new Date(r.terakhirUpload).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    {r.jumlahMitra > 0 && (
                      <button
                        onClick={() => setBuka(buka === r.id ? "" : r.id)}
                        className="rounded border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        {buka === r.id ? "Tutup" : "Rincian"}
                      </button>
                    )}
                  </td>
                </tr>
                {buka === r.id && (
                  <tr className="bg-slate-50">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            Sudah ada bukti ({r.mitraSudah.length})
                          </div>
                          {r.mitraSudah.length === 0 ? (
                            <p className="text-xs text-slate-400">—</p>
                          ) : (
                            <ul className="space-y-1 text-xs text-slate-700">
                              {r.mitraSudah.map((m) => <li key={m}>✓ {m}</li>)}
                            </ul>
                          )}
                        </div>
                        <div>
                          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
                            Belum ada bukti ({r.mitraBelum.length})
                          </div>
                          {r.mitraBelum.length === 0 ? (
                            <p className="text-xs text-slate-400">— semua lengkap</p>
                          ) : (
                            <ul className="space-y-1 text-xs text-slate-700">
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
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-slate-800">Import Data Mahasiswa dari Excel</h2>
        <p className="mb-4 text-sm text-slate-500">
          Unggah file <b>.xlsx / .xls / .csv</b>. Baris dicocokkan berdasarkan <b>NIM</b> —
          NIM yang sudah ada akan diperbarui, yang belum ada ditambahkan. Data tidak pernah dihapus.
          Baris berstatus <b>Ditolak</b> dan <b>Menunggu Validasi</b> tidak diimpor, dan satu mahasiswa
          hanya masuk sekali (dipilih status paling final).
        </p>

        <div className="mb-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          <div className="mb-1.5 font-semibold text-slate-700">Kolom yang dikenali</div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(LABEL_KOLOM).map(([k, v]) => (
              <span key={k} className="rounded bg-white px-2 py-0.5 text-xs font-medium text-slate-700 shadow-sm">
                {v}{k === "nim" || k === "nama" || k === "mitra" ? " *" : ""}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            * wajib. Urutan kolom bebas; baris judul di atas header tidak masalah (dicari sampai 10 baris pertama).
            Nama dosen dicocokkan otomatis dengan akun yang ada — gelar diabaikan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setHasil(null); setError(""); }}
            className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-purple-700 hover:file:bg-purple-100"
          />
          <button
            onClick={() => kirim(false)}
            disabled={sibuk || !file}
            className="rounded-lg border border-purple-300 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50 disabled:opacity-40"
          >
            {sibuk ? "Memproses…" : "Pratinjau"}
          </button>
        </div>

        {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
      </div>

      {hasil && (
        <>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-800">
                  {sudahDiterapkan ? "Hasil Import" : "Pratinjau"} — {hasil.namaFile}
                </h3>
                <p className="text-xs text-slate-500">
                  Sheet &quot;{hasil.sheet}&quot; · {hasil.totalBaris} baris terbaca
                  {hasil.kolomHilang.length > 0 &&
                    ` · kolom tidak ditemukan: ${hasil.kolomHilang.map((k) => LABEL_KOLOM[k] ?? k).join(", ")}`}
                </p>
              </div>
              {!sudahDiterapkan && hasil.jumlahBaru + hasil.jumlahPerbarui > 0 && (
                <button
                  onClick={() => kirim(true)}
                  disabled={sibuk}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {sibuk ? "Menyimpan…" : `Terapkan ${hasil.jumlahBaru + hasil.jumlahPerbarui} baris`}
                </button>
              )}
            </div>

            {sudahDiterapkan && (
              <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Tersimpan: <b>{hasil.dibuat}</b> mahasiswa baru, <b>{hasil.diperbarui}</b> diperbarui.
                {hasil.jumlahDitolak > 0 && ` ${hasil.jumlahDitolak} baris dilewati karena bermasalah.`}
                {hasil.jumlahDilewati > 0 && ` ${hasil.jumlahDilewati} baris dilewati (status/duplikat).`}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MiniStat label={sudahDiterapkan ? "Ditambahkan" : "Akan ditambahkan"} value={hasil.jumlahBaru} />
              <MiniStat label={sudahDiterapkan ? "Diperbarui" : "Akan diperbarui"} value={hasil.jumlahPerbarui} />
              <MiniStat label="Bermasalah" value={hasil.jumlahDitolak} warn={hasil.jumlahDitolak > 0} />
              <MiniStat label="Dilewati (status/duplikat)" value={hasil.jumlahDilewati} />
            </div>

            {hasil.dosenTakDikenal.length > 0 && (
              <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <b>{hasil.dosenTakDikenal.length} nama dosen belum punya akun</b> — datanya tetap masuk, tapi
                mahasiswa belum terhubung ke dosen. Buat akunnya di tab Manajemen Pengguna, lalu tugaskan
                lewat tab Ploting Pembimbing.
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {hasil.dosenTakDikenal.map((d) => (
                    <span key={d} className="rounded bg-white px-2 py-0.5 text-xs font-medium text-amber-800 shadow-sm">{d}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-3 inline-flex rounded-lg border border-slate-200 p-1">
              {([
                ["baru", `Baru (${hasil.jumlahBaru})`],
                ["perbarui", `Diperbarui (${hasil.jumlahPerbarui})`],
                ["ditolak", `Bermasalah (${hasil.jumlahDitolak})`],
                ["dilewati", `Dilewati (${hasil.jumlahDilewati})`],
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setLihat(k)}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                    lihat === k ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {lihat === "dilewati" ? (
              hasil.dilewati.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">Tidak ada baris yang dilewati.</p>
              ) : (
                <div className="overflow-x-auto">
                  <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Baris berikut sengaja tidak diimpor: status belum final (Ditolak / Menunggu Validasi),
                    atau mahasiswa yang sama muncul lebih dari sekali — dipakai baris dengan status paling final.
                  </p>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2.5">Baris</th>
                        <th className="px-3 py-2.5">NIM</th>
                        <th className="px-3 py-2.5">Nama</th>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-3 py-2.5">Alasan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {hasil.dilewati.map((r) => (
                        <tr key={`${r.baris}-${r.nim}`} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-xs text-slate-400">{r.baris}</td>
                          <td className="px-3 py-2 font-mono text-xs">{r.nim || "—"}</td>
                          <td className="px-3 py-2 font-medium text-slate-800">{r.nama || "—"}</td>
                          <td className="px-3 py-2 text-slate-600">{r.status || "—"}</td>
                          <td className="px-3 py-2 text-xs text-slate-500">{r.alasan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : daftar.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Tidak ada baris di kategori ini.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5">Baris</th>
                      <th className="px-3 py-2.5">NIM</th>
                      <th className="px-3 py-2.5">Nama</th>
                      <th className="px-3 py-2.5">Perusahaan</th>
                      <th className="px-3 py-2.5">Dosen</th>
                      {lihat === "ditolak" && <th className="px-3 py-2.5">Masalah</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {daftar.map((r) => (
                      <tr key={`${r.baris}-${r.nim}`} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-xs text-slate-400">{r.baris}</td>
                        <td className="px-3 py-2 font-mono text-xs">{r.nim || "—"}</td>
                        <td className="px-3 py-2 font-medium text-slate-800">{r.nama || "—"}</td>
                        <td className="max-w-xs truncate px-3 py-2 text-slate-600" title={r.mitra}>{r.mitra || "—"}</td>
                        <td className="px-3 py-2 text-slate-600">{r.dosen || "—"}</td>
                        {lihat === "ditolak" && (
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {r.masalah.map((m) => (
                                <span key={m} className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">{m}</span>
                              ))}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {lihat !== "ditolak" && daftar.length === 50 && (
                  <p className="mt-2 text-xs text-slate-400">Menampilkan 50 baris pertama.</p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- primitives ---------------- */

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function MiniStat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className={`text-2xl font-bold ${warn ? "text-amber-600" : "text-slate-800"}`}>{value}</div>
      <div className="mt-0.5 text-sm text-slate-500">{label}</div>
    </div>
  );
}
