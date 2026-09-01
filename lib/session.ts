import "server-only";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if ((session.user as { role?: string }).role !== "ADMIN") redirect("/dashboard");
  return session;
}
