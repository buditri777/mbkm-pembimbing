"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TIPE_LABEL, type TipeBukti } from "@/lib/bukti";

type Mitra = { mitra: string; kota: string; jumlahMhs: number; dosen: string[] };
type Bukti = {
  id: string; tipe: string; judul: string; url: string; catatan: string | null;
  mitra: string; createdAt: string; user: { name: string };
};

const TIPE_BADGE: Record<string, string> = {
  PENYERAHAN: "bg-label-primary",
  SUPERVISI: "bg-label-warning",
  PENARIKAN: "bg-label-success",
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

  /** Bukti dikelompokkan per perusahaan — dokumentasi milik perusahaan, bukan mahasiswa. */
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
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
        <h4 className="fw-bold mb-0">Bukti Dokumentasi</h4>
        <span className="text-body-secondary small">Per perusahaan · Penyerahan · Supervisi · Penarikan</span>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Tambah Bukti</h5>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Jenis Bukti</label>
                  <select value={tipe} onChange={(e) => setTipe(e.target.value as TipeBukti)} className="form-select">
                    {(Object.keys(TIPE_LABEL) as TipeBukti[]).map((t) => (
                      <option key={t} value={t}>{TIPE_LABEL[t]}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Perusahaan / Mitra</label>
                  <select value={mitra} onChange={(e) => setMitra(e.target.value)} className="form-select">
                    <option value="">— pilih perusahaan —</option>
                    {mitraList.map((m) => (
                      <option key={m.mitra} value={m.mitra}>
                        {m.mitra} · {m.jumlahMhs} mhs
                      </option>
                    ))}
                  </select>
                  <small className="text-body-secondary">Satu bukti berlaku untuk seluruh mahasiswa di perusahaan tersebut.</small>
                </div>
                <div className="mb-3">
                  <label className="form-label">Judul</label>
                  <input
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    placeholder="cth: Berita acara penyerahan mahasiswa"
                    className="form-control"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Link Google Drive</label>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/…"
                    className="form-control"
                  />
                  {url && !driveUrlOk && (
                    <small className="text-warning">⚠️ Bukan link Google Drive — harus mulai http(s)://</small>
                  )}
                  <small className="d-block text-body-secondary">
                    Pastikan izin berbagi <b>&quot;Anyone with the link&quot;</b> aktif.
                  </small>
                </div>
                <div className="mb-3">
                  <label className="form-label">Catatan (opsional)</label>
                  <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2} className="form-control" />
                </div>
                {error && <div className="alert alert-danger py-2">{error}</div>}
                {success && <div className="alert alert-success py-2">{success}</div>}
                <button type="submit" disabled={submitting} className="btn btn-success d-grid w-100">
                  {submitting ? "Menyimpan…" : "Simpan Bukti"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex flex-wrap justify-content-between gap-2">
              <h5 className="card-title mb-0">
                Bukti per Perusahaan{" "}
                <span className="text-body-secondary fw-normal small">
                  ({grouped.length} perusahaan · {filtered.length} bukti)
                </span>
              </h5>
              <div className="d-flex gap-2">
                <select value={filterTipe} onChange={(e) => setFilterTipe(e.target.value)} className="form-select form-select-sm">
                  <option value="">Semua jenis</option>
                  {(Object.keys(TIPE_LABEL) as TipeBukti[]).map((t) => (
                    <option key={t} value={t}>{TIPE_LABEL[t]}</option>
                  ))}
                </select>
                <input
                  value={filterQ}
                  onChange={(e) => setFilterQ(e.target.value)}
                  placeholder="Cari…"
                  className="form-control form-control-sm"
                  style={{ width: "9rem" }}
                />
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <p className="text-center text-body-secondary py-4">Memuat…</p>
              ) : grouped.length === 0 ? (
                <p className="text-center text-body-secondary py-4">Belum ada bukti. Tambah lewat form di samping.</p>
              ) : (
                grouped.map(([namaMitra, items]) => (
                  <div key={namaMitra} className="mb-4">
                    <div className="d-flex align-items-baseline gap-2 border-bottom pb-1 mb-2">
                      <h6 className="fw-semibold mb-0">{namaMitra}</h6>
                      <span className="badge bg-label-secondary">{items.length} bukti</span>
                    </div>
                    {items.map((b) => (
                      <div key={b.id} className="py-2">
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          <span className={`badge rounded-pill ${TIPE_BADGE[b.tipe] ?? "bg-label-secondary"}`}>
                            {TIPE_LABEL[b.tipe as TipeBukti] ?? b.tipe}
                          </span>
                          <span className="fw-medium">{b.judul}</span>
                        </div>
                        <div className="small text-body-secondary">
                          oleh {b.user?.name ?? "—"} ·{" "}
                          {new Date(b.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                        {b.catatan && <div className="small fst-italic text-body-secondary">{b.catatan}</div>}
                        <a
                          href={b.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="small fw-medium text-truncate d-inline-block"
                          style={{ maxWidth: "100%" }}
                          title={b.url}
                        >
                          <i className="bx bx-link-external me-1" />{b.url}
                        </a>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
