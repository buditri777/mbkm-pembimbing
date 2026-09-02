import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/roles";

/** Daftar perusahaan/mitra beserta jumlah mahasiswa & dosen pembimbingnya. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  const userId = (session.user as { id?: string }).id!;

  const mahasiswa = await prisma.mahasiswa.findMany({
    where: isAdmin(role) ? {} : { userId },
    select: { mitra: true, kota: true, dosenNama: true },
    orderBy: { mitra: "asc" },
  });

  const map = new Map<string, { mitra: string; kota: string; jumlahMhs: number; dosen: string[] }>();
  for (const m of mahasiswa) {
    const e = map.get(m.mitra) ?? { mitra: m.mitra, kota: m.kota, jumlahMhs: 0, dosen: [] };
    e.jumlahMhs += 1;
    if (!e.dosen.includes(m.dosenNama)) e.dosen.push(m.dosenNama);
    map.set(m.mitra, e);
  }

  return NextResponse.json([...map.values()]);
}
