import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperadmin } from "@/lib/roles";

async function guard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isSuperadmin((session.user as { role?: string }).role))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return null;
}

/** Ploting: daftar mahasiswa + dosen pembimbingnya, untuk ditugaskan ulang. */
export async function GET() {
  const err = await guard();
  if (err) return err;

  const [mahasiswa, dosen] = await Promise.all([
    prisma.mahasiswa.findMany({
      orderBy: [{ mitra: "asc" }, { nama: "asc" }],
      select: { id: true, nim: true, nama: true, prodi: true, kelas: true, mitra: true, kota: true, dosenNama: true, userId: true },
    }),
    prisma.user.findMany({
      where: { isLecturer: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, _count: { select: { mahasiswaList: true } } },
    }),
  ]);

  return NextResponse.json({ mahasiswa, dosen });
}

/** Tugaskan (ploting) satu atau banyak mahasiswa ke seorang dosen. */
export async function PATCH(req: NextRequest) {
  const err = await guard();
  if (err) return err;

  let body: { mahasiswaIds?: string[]; dosenId?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body tidak valid" }, { status: 400 });
  }

  const ids = body.mahasiswaIds ?? [];
  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: "Pilih minimal satu mahasiswa" }, { status: 400 });

  // dosenId null = lepas ploting
  if (body.dosenId == null) {
    const r = await prisma.mahasiswa.updateMany({
      where: { id: { in: ids } },
      data: { userId: null, dosenNama: "-" },
    });
    return NextResponse.json({ ok: true, diubah: r.count });
  }

  const dosen = await prisma.user.findUnique({
    where: { id: body.dosenId },
    select: { id: true, name: true, isLecturer: true },
  });
  if (!dosen) return NextResponse.json({ error: "Dosen tidak ditemukan" }, { status: 404 });
  if (!dosen.isLecturer)
    return NextResponse.json({ error: "User tersebut bukan dosen pembimbing" }, { status: 400 });

  const r = await prisma.mahasiswa.updateMany({
    where: { id: { in: ids } },
    data: { userId: dosen.id, dosenNama: dosen.name },
  });
  return NextResponse.json({ ok: true, diubah: r.count, dosen: dosen.name });
}
