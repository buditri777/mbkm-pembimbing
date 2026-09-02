import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperadmin } from "@/lib/roles";

/** Rekap status upload bukti tiap dosen — sudah / belum, beserta perusahaan yang masih kosong. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isSuperadmin((session.user as { role?: string }).role))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const [dosen, mahasiswa, bukti] = await Promise.all([
    prisma.user.findMany({
      where: { isLecturer: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.mahasiswa.findMany({ select: { userId: true, mitra: true } }),
    prisma.bukti.findMany({ select: { userId: true, mitra: true, tipe: true, createdAt: true } }),
  ]);

  // mitra yang jadi tanggung jawab tiap dosen
  const mitraDosen = new Map<string, Set<string>>();
  for (const m of mahasiswa) {
    if (!m.userId) continue;
    const s = mitraDosen.get(m.userId) ?? new Set<string>();
    s.add(m.mitra);
    mitraDosen.set(m.userId, s);
  }

  // bukti yang sudah diunggah tiap dosen
  const buktiDosen = new Map<string, typeof bukti>();
  for (const b of bukti) buktiDosen.set(b.userId, [...(buktiDosen.get(b.userId) ?? []), b]);

  const rows = dosen.map((d) => {
    const mitra = [...(mitraDosen.get(d.id) ?? [])].sort();
    const milik = buktiDosen.get(d.id) ?? [];
    const sudahMitra = new Set(milik.map((b) => b.mitra));
    const perTipe: Record<string, number> = { PENYERAHAN: 0, SUPERVISI: 0, PENARIKAN: 0 };
    for (const b of milik) perTipe[b.tipe] = (perTipe[b.tipe] ?? 0) + 1;
    const terakhir = milik.reduce<Date | null>(
      (max, b) => (!max || b.createdAt > max ? b.createdAt : max),
      null
    );

    return {
      id: d.id,
      nama: d.name,
      email: d.email,
      jumlahMitra: mitra.length,
      mitraSudah: mitra.filter((m) => sudahMitra.has(m)),
      mitraBelum: mitra.filter((m) => !sudahMitra.has(m)),
      totalBukti: milik.length,
      perTipe,
      terakhirUpload: terakhir,
      sudahUpload: milik.length > 0,
    };
  });

  return NextResponse.json(rows);
}
