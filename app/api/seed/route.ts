import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET() {
  return new Response(JSON.stringify({ error: "Gunakan POST untuk seed ulang" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST() {
  try {
    const existing = await prisma.user.count();
    return Response.json({ ok: true, users: existing, message: "Data sudah ter-seed via prisma/seed.ts" });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
