import "server-only";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin, isSuperadmin } from "@/lib/roles";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (!isAdmin((session.user as { role?: string }).role)) redirect("/dashboard");
  return session;
}

export async function requireSuperadmin() {
  const session = await requireSession();
  if (!isSuperadmin((session.user as { role?: string }).role)) redirect("/dashboard");
  return session;
}

/** Untuk route handler: kembalikan sesi atau null (bukan redirect). */
export async function getSession() {
  return getServerSession(authOptions);
}
