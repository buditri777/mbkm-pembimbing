import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperadmin } from "@/lib/roles";
import { parseExcel, kunciDosen, type BarisImport } from "@/lib/import-excel";

export const runtime = "nodejs";
const MAX_BYTES = 5 * 1024 * 1024;

type Rencana = {
  baru: BarisImport[];
  perbarui: BarisImport[];
  ditolak: BarisImport[];
  dosenTakDikenal: string[];
};

/** Bagi baris jadi: baru / perbarui / ditolak, sekaligus petakan nama dosen ke akun. */
async function susunRencana(rows: BarisImport[]) {
  const [mhsAda, dosen] = await Promise.all([
    prisma.mahasiswa.findMany({ select: { nim: true } }),
    prisma.user.findMany({ where: { isLecturer: true }, select: { id: true, name: true } }),
  ]);

  const nimAda = new Set(mhsAda.map((m) => m.nim));
  const petaDosen = new Map(dosen.map((d) => [kunciDosen(d.name), d]));

  const rencana: Rencana = { baru: [], perbarui: [], ditolak: [], dosenTakDikenal: [] };
  const takKenal = new Set<string>();

  for (const r of rows) {
    if (r.masalah.length > 0) {
      rencana.ditolak.push(r);
      continue;
    }
    if (r.dosen && !petaDosen.has(kunciDosen(r.dosen))) takKenal.add(r.dosen);
    (nimAda.has(r.nim) ? rencana.perbarui : rencana.baru).push(r);
  }
  rencana.dosenTakDikenal = [...takKenal].sort();

  return { rencana, petaDosen };
}

/** Pratinjau — tidak menyentuh database. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isSuperadmin((session.user as { role?: string }).role))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "File belum dipilih" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Ukuran file melebihi 5 MB" }, { status: 400 });

  const hasil = parseExcel(Buffer.from(await file.arrayBuffer()));
  if (!hasil.ok) return NextResponse.json({ error: hasil.error }, { status: 400 });
  if (hasil.rows.length === 0)
    return NextResponse.json({ error: "Tidak ada baris data di bawah header." }, { status: 400 });

  const terapkan = form?.get("terapkan") === "true";
  const { rencana, petaDosen } = await susunRencana(hasil.rows);

  const ringkas = {
    sheet: hasil.sheet,
    namaFile: file.name,
    kolomTerbaca: hasil.kolomTerbaca,
    kolomHilang: hasil.kolomHilang,
    totalBaris: hasil.rows.length,
    jumlahBaru: rencana.baru.length,
    jumlahPerbarui: rencana.perbarui.length,
    jumlahDitolak: rencana.ditolak.length,
    jumlahDilewati: hasil.dilewati.length,
    dosenTakDikenal: rencana.dosenTakDikenal,
    contohBaru: rencana.baru.slice(0, 50),
    contohPerbarui: rencana.perbarui.slice(0, 50),
    ditolak: rencana.ditolak.slice(0, 100),
    dilewati: hasil.dilewati.slice(0, 100),
  };

  if (!terapkan) return NextResponse.json({ mode: "pratinjau", ...ringkas });

  // ---- Terapkan ----
  const isiAtau = (v: string) => v || "-"; // kolom yang tak ada di file jangan disimpan kosong
  const semua = [...rencana.baru, ...rencana.perbarui];
  await prisma.$transaction(
    semua.map((r) => {
      const d = r.dosen ? petaDosen.get(kunciDosen(r.dosen)) : undefined;
      const isi = {
        nama: r.nama,
        prodi: isiAtau(r.prodi),
        kelas: isiAtau(r.kelas),
        mitra: r.mitra,
        kota: isiAtau(r.kota),
        zona: isiAtau(r.zona),
        // Nama dosen dari file tetap dicatat walau akunnya belum ada — ploting bisa dibereskan di tab Ploting.
        dosenNama: isiAtau(r.dosen),
        userId: d?.id ?? null,
      };
      return prisma.mahasiswa.upsert({
        where: { nim: r.nim },
        update: isi,
        create: { nim: r.nim, ...isi },
      });
    })
  );

  return NextResponse.json({
    mode: "terapkan",
    ...ringkas,
    dibuat: rencana.baru.length,
    diperbarui: rencana.perbarui.length,
  });
}
