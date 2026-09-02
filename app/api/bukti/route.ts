import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/roles";

const VALID_TIPE = ["PENYERAHAN", "SUPERVISI", "PENARIKAN"];

/** Daftar mitra yang boleh diakses user: admin = semua, dosen = mitra bimbingannya. */
async function mitraTerjangkau(userId: string): Promise<string[]> {
  const rows = await prisma.mahasiswa.findMany({
    where: { userId },
    select: { mitra: true },
    distinct: ["mitra"],
  });
  return rows.map((r) => r.mitra);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  const userId = (session.user as { id?: string }).id!;

  const where = isAdmin(role) ? {} : { mitra: { in: await mitraTerjangkau(userId) } };
  const bukti = await prisma.bukti.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });
  return NextResponse.json(bukti);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id!;
  const role = (session.user as { role?: string }).role;

  let body: { tipe?: string; judul?: string; url?: string; catatan?: string; mitra?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body tidak valid" }, { status: 400 });
  }

  const { tipe, judul, url, catatan, mitra } = body;
  if (!tipe || !VALID_TIPE.includes(tipe))
    return NextResponse.json({ error: "Tipe bukti tidak valid" }, { status: 400 });
  if (!judul?.trim()) return NextResponse.json({ error: "Judul wajib diisi" }, { status: 400 });
  if (!url?.trim() || !/^https?:\/\//i.test(url.trim()))
    return NextResponse.json({ error: "URL Google Drive wajib diisi (mulai http/https)" }, { status: 400 });
  if (!mitra?.trim()) return NextResponse.json({ error: "Perusahaan/mitra wajib dipilih" }, { status: 400 });

  // Mitra harus benar-benar ada di data mahasiswa
  const adaMitra = await prisma.mahasiswa.findFirst({ where: { mitra: mitra.trim() }, select: { id: true } });
  if (!adaMitra) return NextResponse.json({ error: "Perusahaan tidak ditemukan" }, { status: 404 });

  // Dosen hanya boleh upload untuk perusahaan tempat mahasiswa bimbingannya magang
  if (!isAdmin(role)) {
    const boleh = await prisma.mahasiswa.findFirst({ where: { mitra: mitra.trim(), userId }, select: { id: true } });
    if (!boleh)
      return NextResponse.json({ error: "Perusahaan ini bukan lokasi mahasiswa bimbingan Anda" }, { status: 403 });
  }

  const bukti = await prisma.bukti.create({
    data: { tipe, judul: judul.trim(), url: url.trim(), catatan: catatan?.trim() || null, mitra: mitra.trim(), userId },
  });
  return NextResponse.json(bukti, { status: 201 });
}
