import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES, isSuperadmin, type Role } from "@/lib/roles";

async function guard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (!isSuperadmin((session.user as { role?: string }).role))
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { session };
}

export async function GET() {
  const g = await guard();
  if (g.error) return g.error;

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isLecturer: true,
      createdAt: true,
      _count: { select: { mahasiswaList: true, buktiList: true } },
    },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const g = await guard();
  if (g.error) return g.error;

  let body: { email?: string; name?: string; password?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body tidak valid" }, { status: 400 });
  }

  const email = body.email?.toLowerCase().trim();
  const name = body.name?.trim();
  const password = body.password ?? "";
  const role = (body.role ?? "DOSEN") as Role;

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 });
  if (!ROLES.includes(role)) return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });

  const dup = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (dup) return NextResponse.json({ error: "Email sudah terpakai" }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      isLecturer: role === "DOSEN",
    },
    select: { id: true, email: true, name: true, role: true },
  });
  return NextResponse.json(user, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const g = await guard();
  if (g.error) return g.error;

  let body: { id?: string; name?: string; role?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body tidak valid" }, { status: 400 });
  }

  const { id } = body;
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

  const data: { name?: string; role?: Role; isLecturer?: boolean; passwordHash?: string } = {};

  if (body.name?.trim()) data.name = body.name.trim();

  if (body.role) {
    const role = body.role as Role;
    if (!ROLES.includes(role)) return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
    // Super admin terakhir tidak boleh diturunkan — mencegah akun terkunci total
    if (target.role === "SUPERADMIN" && role !== "SUPERADMIN") {
      const jumlah = await prisma.user.count({ where: { role: "SUPERADMIN" } });
      if (jumlah <= 1)
        return NextResponse.json({ error: "Tidak bisa menurunkan super admin terakhir" }, { status: 400 });
    }
    data.role = role;
    data.isLecturer = role === "DOSEN";
  }

  if (body.password) {
    if (body.password.length < 8)
      return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 });
    data.passwordHash = await bcrypt.hash(body.password, 10);
  }

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true },
  });
  return NextResponse.json(user);
}
