import * as XLSX from "xlsx";

export type BarisImport = {
  baris: number;
  nim: string;
  nama: string;
  prodi: string;
  kelas: string;
  mitra: string;
  kota: string;
  zona: string;
  dosen: string;
  status: string;
  masalah: string[];
};

/** Baris yang sengaja tidak diimpor (status tidak layak / duplikat kalah pilih). */
export type BarisDilewati = { baris: number; nim: string; nama: string; status: string; alasan: string };

/** Kolom yang dikenali — sinonim ditulis tanpa spasi & huruf kecil. */
const ALIAS: Record<keyof Omit<BarisImport, "baris" | "masalah">, string[]> = {
  nim: ["nim", "no.mhs", "nomorindukmahasiswa", "nomormahasiswa"],
  nama: ["nama", "namamahasiswa", "namalengkap"],
  prodi: ["prodi", "programstudi", "jurusan"],
  kelas: ["kelas"],
  mitra: ["mitra", "perusahaan", "tempatmagang", "lokasimagang", "instansi", "namamitra", "namaperusahaan"],
  kota: ["kota", "kotakabupaten", "kabupaten", "lokasi"],
  zona: ["zona", "wilayah"],
  dosen: ["dosen", "dosenpembimbing", "pembimbing", "namadosen", "dospem", "namapembimbing"],
  status: ["status", "statusmbkm", "statusmagang"],
};

/** Makin tinggi = makin final. Dipakai memilih pemenang saat NIM muncul lebih dari sekali. */
const PERINGKAT_STATUS: Record<string, number> = {
  pelaksanaan: 3,
  disetujui: 2,
  menungguvalidasi: 1,
  ditolak: 0,
};

/** Status yang tidak diimpor sama sekali. */
const STATUS_DIBUANG = new Set(["menungguvalidasi", "ditolak"]);

const norm = (s: unknown) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const teks = (v: unknown) => String(v ?? "").trim().replace(/\s+/g, " ");

/** Cari baris header di 10 baris pertama — file nyata sering punya judul/logo di atas. */
function cariHeader(grid: unknown[][]): { indeks: number; peta: Map<string, number> } | null {
  for (let i = 0; i < Math.min(grid.length, 10); i++) {
    const peta = new Map<string, number>();
    grid[i]?.forEach((sel, kol) => {
      const n = norm(sel);
      if (!n) return;
      for (const [field, alias] of Object.entries(ALIAS)) {
        if (!peta.has(field) && alias.includes(n)) peta.set(field, kol);
      }
    });
    // header valid kalau minimal NIM + nama ketemu
    if (peta.has("nim") && peta.has("nama")) return { indeks: i, peta };
  }
  return null;
}

export type HasilParse =
  | { ok: false; error: string }
  | {
      ok: true;
      sheet: string;
      kolomTerbaca: string[];
      kolomHilang: string[];
      rows: BarisImport[];
      dilewati: BarisDilewati[];
    };

export function parseExcel(buf: Buffer): HasilParse {
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buf, { type: "buffer" });
  } catch {
    return { ok: false, error: "File tidak bisa dibaca. Pastikan format .xlsx / .xls / .csv." };
  }

  const namaSheet = wb.SheetNames[0];
  if (!namaSheet) return { ok: false, error: "File tidak punya sheet." };

  const grid = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[namaSheet], { header: 1, blankrows: false, defval: "" });
  const header = cariHeader(grid);
  if (!header)
    return {
      ok: false,
      error: "Kolom NIM dan Nama tidak ditemukan. Pastikan baris header memuat kolom NIM & Nama (10 baris pertama).",
    };

  const { indeks, peta } = header;
  const ambil = (r: unknown[], f: string) => (peta.has(f) ? teks(r[peta.get(f)!]) : "");

  const dilewati: BarisDilewati[] = [];
  const mentah: BarisImport[] = [];

  for (let i = indeks + 1; i < grid.length; i++) {
    const r = grid[i] ?? [];
    const nim = ambil(r, "nim").replace(/\s/g, "");
    const nama = ambil(r, "nama");
    if (!nim && !nama) continue; // baris kosong

    const baris = i + 1; // nomor baris seperti di Excel
    const status = ambil(r, "status");

    // Buang status yang belum final — tidak dihitung sebagai "ditolak" karena bukan kesalahan data.
    if (STATUS_DIBUANG.has(norm(status))) {
      dilewati.push({ baris, nim, nama, status, alasan: `Status "${status}" tidak diimpor` });
      continue;
    }

    const masalah: string[] = [];
    if (!nim) masalah.push("NIM kosong");
    else if (!/^[0-9A-Za-z.\-]{4,}$/.test(nim)) masalah.push("Format NIM tidak wajar");
    if (!nama) masalah.push("Nama kosong");
    if (!ambil(r, "mitra")) masalah.push("Perusahaan/mitra kosong");

    mentah.push({
      baris,
      nim,
      nama,
      prodi: ambil(r, "prodi"),
      kelas: ambil(r, "kelas"),
      mitra: ambil(r, "mitra"),
      kota: ambil(r, "kota"),
      zona: ambil(r, "zona"),
      dosen: ambil(r, "dosen"),
      status,
      masalah,
    });
  }

  const rows = dedup(mentah, dilewati);
  const semua = Object.keys(ALIAS);
  return {
    ok: true,
    sheet: namaSheet,
    kolomTerbaca: semua.filter((f) => peta.has(f)),
    kolomHilang: semua.filter((f) => !peta.has(f)),
    rows,
    dilewati,
  };
}

/**
 * Satu mahasiswa = satu baris. Duplikat dinilai per NIM, lalu per nama (jaga-jaga NIM salah ketik).
 * Pemenang: status paling final, lalu baris paling bawah (entri terbaru), lalu yang punya pembimbing.
 */
function dedup(rows: BarisImport[], dilewati: BarisDilewati[]): BarisImport[] {
  const skor = (r: BarisImport) => PERINGKAT_STATUS[norm(r.status)] ?? 0;
  const lebihBaik = (a: BarisImport, b: BarisImport) => {
    if (skor(a) !== skor(b)) return skor(a) > skor(b);
    if (!!a.dosen !== !!b.dosen) return !!a.dosen;
    return a.baris > b.baris;
  };

  const pilih = (
    daftar: BarisImport[],
    kunci: (r: BarisImport) => string,
    label: string
  ): BarisImport[] => {
    const juara = new Map<string, BarisImport>();
    const kalah: BarisImport[] = [];
    for (const r of daftar) {
      const k = kunci(r);
      if (!k) {
        kalah.push(r); // tanpa kunci — biar divalidasi sebagai "ditolak", jangan dibuang diam-diam
        continue;
      }
      const lawan = juara.get(k);
      if (!lawan) juara.set(k, r);
      else if (lebihBaik(r, lawan)) {
        juara.set(k, r);
        kalah.push(lawan);
      } else kalah.push(r);
    }
    for (const r of kalah) {
      if (!kunci(r)) continue;
      const menang = juara.get(kunci(r))!;
      dilewati.push({
        baris: r.baris,
        nim: r.nim,
        nama: r.nama,
        status: r.status,
        alasan: `${label} ganda — dipakai baris ${menang.baris} (${menang.status || "tanpa status"})`,
      });
    }
    return [...daftar.filter((r) => !kunci(r)), ...Array.from(juara.values())].sort((a, b) => a.baris - b.baris);
  };

  const perNim = pilih(rows, (r) => r.nim, "NIM");
  return pilih(perNim, (r) => (r.nim ? norm(r.nama) : ""), "Nama mahasiswa");
}

/** Samakan nama dosen agar "Dr. Budi, M.Kom" cocok dengan "BUDI". */
export function kunciDosen(nama: string): string {
  return nama
    .toLowerCase()
    .replace(/\b(prof|dr|drs|ir|s\.?kom|m\.?kom|s\.?t|m\.?t|s\.?pd|m\.?pd|s\.?si|m\.?si|m\.?m|ph\.?d|se|mm)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}
