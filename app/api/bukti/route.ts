import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_TIPE = ["PENYERAHAN", "SUPERVISI", "PENARIKAN"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  const userId = (session.user as { id?: string }).id;

  const where = role === "ADMIN" ? {} : { userId };
  const bukti = await prisma.bukti.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { mahasiswa: { select: { nim: true, nama: true, dosenNama: true } } },
  });
  return NextResponse.json(bukti);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id!;

  let body: { tipe?: string; judul?: string; url?: string; catatan?: string; mahasiswaId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body tidak valid" }, { status: 400 });
  }

  const { tipe, judul, url, catatan, mahasiswaId } = body;
  if (!tipe || !VALID_TIPE.includes(tipe))
    return NextResponse.json({ error: "Tipe bukti tidak valid" }, { status: 400 });
  if (!judul?.trim()) return NextResponse.json({ error: "Judul wajib diisi" }, { status: 400 });
  if (!url?.trim() || !/^https?:\/\//i.test(url.trim()))
    return NextResponse.json({ error: "URL Google Drive wajib diisi (mulai http/https)" }, { status: 400 });
  if (!mahasiswaId) return NextResponse.json({ error: "Mahasiswa wajib dipilih" }, { status: 400 });

  // Dosen hanya boleh upload untuk mahasiswa bimbingannya; admin bebas
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") {
    const mhs = await prisma.mahasiswa.findFirst({ where: { id: mahasiswaId, userId } });
    if (!mhs) return NextResponse.json({ error: "Mahasiswa bukan bimbingan Anda" }, { status: 403 });
  } else {
    const mhs = await prisma.mahasiswa.findUnique({ where: { id: mahasiswaId } });
    if (!mhs) return NextResponse.json({ error: "Mahasiswa tidak ditemukan" }, { status: 404 });
  }

  const bukti = await prisma.bukti.create({
    data: { tipe, judul: judul.trim(), url: url.trim(), catatan: catatan?.trim() || null, mahasiswaId, userId },
    include: { mahasiswa: { select: { nim: true, nama: true } } },
  });
  return NextResponse.json(bukti, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id!;
  const role = (session.user as { role?: string }).role;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });

  const where = role === "ADMIN" ? { id } : { id, userId };
  const existing = await prisma.bukti.findFirst({ where });
  if (!existing) return NextResponse.json({ error: "Bukti tidak ditemukan / bukan milik Anda" }, { status: 404 });

  await prisma.bukti.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
