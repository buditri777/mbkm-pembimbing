const TIPE_BUKTI = ["PENYERAHAN", "SUPERVISI", "PENARIKAN"] as const;
export type TipeBukti = (typeof TIPE_BUKTI)[number];

export const TIPE_LABEL: Record<TipeBukti, string> = {
  PENYERAHAN: "Penyerahan Magang",
  SUPERVISI: "Supervisi",
  PENARIKAN: "Penarikan",
};

export const TIPE_COLOR: Record<TipeBukti, string> = {
  PENYERAHAN: "bg-emerald-100 text-emerald-700",
  SUPERVISI: "bg-blue-100 text-blue-700",
  PENARIKAN: "bg-amber-100 text-amber-700",
};

/** Ubah link Google Drive (apa pun bentuknya) menjadi URL preview langsung. */
export function toGDrivePreview(raw: string): string | null {
  const url = raw.trim();
  // file/d/FILEID atau /d/FILEID
  const m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]{20,})/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  // folder link → tetap pakai URL asli (folder preview juga didukung)
  if (/drive\.google\.com\/drive\/(?:folders|u\/\d+\/folders)\//.test(url)) {
    const fm = url.match(/folders\/([\w-]+)/);
    if (fm) return `https://drive.google.com/drive/folders/${fm[1]}`;
    return url;
  }
  // Sudah link preview?
  if (/drive\.google\.com\/file\/d\/[\w-]+\/preview/.test(url)) return url;
  return null;
}

export function isLikelyDriveLink(url: string): boolean {
  return /drive\.google\.com|docs\.google\.com/.test(url);
}
