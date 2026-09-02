"use client";

import { useEffect, useMemo, useState } from "react";
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

const ROLE_BADGE: Record<Role, string> = {
  SUPERADMIN: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  DOSEN: "bg-slate-100 text-slate-700",
};

export default function SuperadminClient({ sessionName }: { sessionName: string }) {
  const [tab, setTab] = useState<"users" | "ploting">("users");
  return (
    <div className="min-h-screen bg-slate-100">
      <TopBar
        title="Panel Super Admin"
        subtitle="Manajemen pengguna & ploting pembimbing"
        sessionName={sessionName}
        roleLabel="Super Admin"
      />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 inline-flex rounded-xl bg-white p-1 shadow-sm">
          {(["users", "ploting"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                tab === t ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t === "users" ? "Manajemen Pengguna" : "Ploting Pembimbing"}
            </button>
          ))}
        </div>
        {tab === "users" ? <UsersPanel /> : <PlotingPanel />}
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
