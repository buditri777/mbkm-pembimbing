"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TIPE_LABEL, TIPE_COLOR, type TipeBukti } from "@/lib/bukti";

type Mhs = { id: string; nim: string; nama: string; mitra: string; dosenNama: string };
type Bukti = {
  id: string; tipe: string; judul: string; url: string; catatan: string | null;
  createdAt: string; mahasiswa: { nim: string; nama: string; dosenNama: string };
};

export default function BuktiClient() {
  const params = useSearchParams();
  const preselectNim = params.get("nim") ?? "";

  const [mhsList, setMhsList] = useState<Mhs[]>([]);
  const [buktiList, setBuktiList] = useState<Bukti[]>([]);
  const [loading, setLoading] = useState(true);

  const [mahasiswaId, setMahasiswaId] = useState("");
  const [tipe, setTipe] = useState<TipeBukti>("PENYERAHAN");
  const [judul, setJudul] = useState("");
  const [url, setUrl] = useState("");
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [filterTipe, setFilterTipe] = useState("");
  const [filterQ, setFilterQ] = useState("");

  async function load() {
    setLoading(true);
    const [m, b] = await Promise.all([
      fetch("/api/mahasiswa").then((r) => r.json()),
      fetch("/api/bukti").then((r) => r.json()),
    ]);
    setMhsList(Array.isArray(m) ? m : []);
    setBuktiList(Array.isArray(b) ? b : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (preselectNim && mhsList.length) {
      const found = mhsList.find((m) => m.nim === preselectNim);
      if (found) setMahasiswaId(found.id);
    }
  }, [preselectNim, mhsList]);

  const filtered = useMemo(() => {
    return buktiList.filter((b) => {
      if (filterTipe && b.tipe !== filterTipe) return false;
      if (filterQ) {
        const q = filterQ.toLowerCase();
        const hay = `${b.judul} ${b.mahasiswa.nama} ${b.mahasiswa.nim} ${b.mahasiswa.dosenNama} ${b.url}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [buktiList, filterTipe, filterQ]);

  const driveUrlOk = /^https?:\/\//i.test(url.trim()) && /drive\.google\.com|docs\.google\.com/.test(url);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!mahasiswaId) { setError("Pilih mahasiswa dulu."); return; }
    if (!judul.trim()) { setError("Judul wajib diisi."); return; }
    if (!driveUrlOk) { setError("Masukkan link Google Drive yang valid (https://drive.google.com/…)."); return; }
    setSubmitting(true);
    const res = await fetch("/api/bukti", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipe, judul: judul.trim(), url: url.trim(), catatan: catatan.trim(), mahasiswaId }),
    });
    setSubmitting(false);
    if (res.ok) {
      setSuccess("Bukti tersimpan ✓");
      setJudul(""); setUrl(""); setCatatan("");
      await load();
      setTimeout(() => setSuccess(""), 4000);
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Gagal menyimpan.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus bukti ini?")) return;
    const res = await fetch(`/api/bukti?id=${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">M</div>
            <div>
              <div className="font-bold text-slate-800">Upload Bukti</div>
              <div className="text-xs text-slate-500">Penyerahan · Supervisi · Penarikan</div>
            </div>
          </Link>
          <Link href="/dashboard" className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Tambah Bukti</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Jenis Bukti</label>
                <select
                  value={tipe}
                  onChange={(e) => setTipe(e.target.value as TipeBukti)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  {(Object.keys(TIPE_LABEL) as TipeBukti[]).map((t) => (
                    <option key={t} value={t}>{TIPE_LABEL[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Mahasiswa</label>
                <select
                  value={mahasiswaId}
                  onChange={(e) => setMahasiswaId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">— pilih mahasiswa —</option>
                  {mhsList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nim} — {m.nama} ({m.mitra.slice(0, 28)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Judul</label>
                <input
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="cth: Bukti penyerahan ke Dinas Kominfo Gunungkidul"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Link Google Drive</label>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/…"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                {url && !driveUrlOk && (
                  <p className="mt-1 text-xs text-amber-600">⚠️ Bukan link Google Drive — tetap bisa disimpan, tapi harus mulai http(s)://</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Pastikan izin berbagi <b>&quot;Anyone with the link&quot;</b> aktif.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Catatan (opsional)</label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
              {success && <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? "Menyimpan…" : "Simpan Bukti"}
              </button>
            </form>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-800">
                Daftar Bukti <span className="text-sm font-normal text-slate-500">({filtered.length} dari {buktiList.length})</span>
              </h2>
              <div className="flex gap-2">
                <select
                  value={filterTipe}
                  onChange={(e) => setFilterTipe(e.target.value)}
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Semua jenis</option>
                  {(Object.keys(TIPE_LABEL) as TipeBukti[]).map((t) => (
                    <option key={t} value={t}>{TIPE_LABEL[t]}</option>
                  ))}
                </select>
                <input
                  value={filterQ}
                  onChange={(e) => setFilterQ(e.target.value)}
                  placeholder="Cari…"
                  className="w-40 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {loading ? (
              <p className="py-8 text-center text-sm text-slate-400">Memuat…</p>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Belum ada bukti. Tambah lewat form di samping.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filtered.map((b) => (
                  <li key={b.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TIPE_COLOR[b.tipe as TipeBukti] ?? "bg-slate-100 text-slate-600"}`}>
                          {TIPE_LABEL[b.tipe as TipeBukti] ?? b.tipe}
                        </span>
                        <span className="font-medium text-slate-800">{b.judul}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {b.mahasiswa.nim} — {b.mahasiswa.nama} · {new Date(b.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                      {b.catatan && <div className="mt-1 text-xs italic text-slate-500">{b.catatan}</div>}
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block max-w-full truncate text-xs font-medium text-blue-600 hover:underline"
                        title={b.url}
                      >
                        🔗 {b.url}
                      </a>
                    </div>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="shrink-0 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Hapus
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
