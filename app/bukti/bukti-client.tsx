"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import TopBar from "@/components/top-bar";
import { TIPE_LABEL, TIPE_COLOR, type TipeBukti } from "@/lib/bukti";

type Mitra = { mitra: string; kota: string; jumlahMhs: number; dosen: string[] };
type Bukti = {
  id: string; tipe: string; judul: string; url: string; catatan: string | null;
  mitra: string; createdAt: string; user: { name: string };
};

export default function BuktiClient() {
  const params = useSearchParams();
  const preselectMitra = params.get("mitra") ?? "";

  const [mitraList, setMitraList] = useState<Mitra[]>([]);
  const [buktiList, setBuktiList] = useState<Bukti[]>([]);
  const [loading, setLoading] = useState(true);

  const [mitra, setMitra] = useState("");
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
      fetch("/api/mitra").then((r) => r.json()),
      fetch("/api/bukti").then((r) => r.json()),
    ]);
    setMitraList(Array.isArray(m) ? m : []);
    setBuktiList(Array.isArray(b) ? b : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (preselectMitra && mitraList.some((m) => m.mitra === preselectMitra)) setMitra(preselectMitra);
  }, [preselectMitra, mitraList]);

  const filtered = useMemo(() => {
    return buktiList.filter((b) => {
      if (filterTipe && b.tipe !== filterTipe) return false;
      if (filterQ) {
        const q = filterQ.toLowerCase();
        if (!`${b.judul} ${b.mitra} ${b.user?.name ?? ""} ${b.url}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [buktiList, filterTipe, filterQ]);

  /** Bukti dikelompokkan per perusahaan — inti perubahan: dokumentasi milik perusahaan, bukan mahasiswa. */
  const grouped = useMemo(() => {
    const map = new Map<string, Bukti[]>();
    for (const b of filtered) map.set(b.mitra, [...(map.get(b.mitra) ?? []), b]);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const driveUrlOk = /^https?:\/\//i.test(url.trim()) && /drive\.google\.com|docs\.google\.com/.test(url);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!mitra) { setError("Pilih perusahaan dulu."); return; }
    if (!judul.trim()) { setError("Judul wajib diisi."); return; }
    if (!driveUrlOk) { setError("Masukkan link Google Drive yang valid (https://drive.google.com/…)."); return; }
    setSubmitting(true);
    const res = await fetch("/api/bukti", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipe, judul: judul.trim(), url: url.trim(), catatan: catatan.trim(), mitra }),
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

  return (
    <div className="min-h-screen bg-slate-100">
      <TopBar title="Bukti Dokumentasi" subtitle="Per perusahaan · Penyerahan · Supervisi · Penarikan" />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Tambah Bukti</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Jenis Bukti</label>
                <select value={tipe} onChange={(e) => setTipe(e.target.value as TipeBukti)} className={inputCls}>
                  {(Object.keys(TIPE_LABEL) as TipeBukti[]).map((t) => (
                    <option key={t} value={t}>{TIPE_LABEL[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Perusahaan / Mitra</label>
                <select value={mitra} onChange={(e) => setMitra(e.target.value)} className={inputCls}>
                  <option value="">— pilih perusahaan —</option>
                  {mitraList.map((m) => (
                    <option key={m.mitra} value={m.mitra}>
                      {m.mitra} · {m.jumlahMhs} mhs
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Satu bukti berlaku untuk seluruh mahasiswa di perusahaan tersebut.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Judul</label>
                <input
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="cth: Berita acara penyerahan mahasiswa"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Link Google Drive</label>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/…"
                  className={inputCls}
                />
                {url && !driveUrlOk && (
                  <p className="mt-1 text-xs text-amber-600">⚠️ Bukan link Google Drive — harus mulai http(s)://</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Pastikan izin berbagi <b>&quot;Anyone with the link&quot;</b> aktif.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Catatan (opsional)</label>
                <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2} className={inputCls} />
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
                Bukti per Perusahaan{" "}
                <span className="text-sm font-normal text-slate-500">
                  ({grouped.length} perusahaan · {filtered.length} bukti)
                </span>
              </h2>
              <div className="flex gap-2">
                <select value={filterTipe} onChange={(e) => setFilterTipe(e.target.value)} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500">
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
            ) : grouped.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Belum ada bukti. Tambah lewat form di samping.</p>
            ) : (
              <div className="space-y-5">
                {grouped.map(([namaMitra, items]) => (
                  <section key={namaMitra}>
                    <div className="mb-2 flex items-baseline gap-2 border-b border-slate-100 pb-1.5">
                      <h3 className="font-semibold text-slate-800">{namaMitra}</h3>
                      <span className="text-xs text-slate-500">{items.length} bukti</span>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {items.map((b) => (
                        <li key={b.id} className="py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TIPE_COLOR[b.tipe as TipeBukti] ?? "bg-slate-100 text-slate-600"}`}>
                              {TIPE_LABEL[b.tipe as TipeBukti] ?? b.tipe}
                            </span>
                            <span className="font-medium text-slate-800">{b.judul}</span>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            oleh {b.user?.name ?? "—"} ·{" "}
                            {new Date(b.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
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
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500";
