import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  const userId = (session.user as { id?: string }).id;
  const isAdmin = role === "ADMIN";

  const where = isAdmin ? {} : { userId };
  const mahasiswa = await prisma.mahasiswa.findMany({
    where,
    orderBy: { nama: "asc" },
    select: { id: true, nim: true, nama: true, mitra: true, dosenNama: true },
  });
  return NextResponse.json(mahasiswa);
}
