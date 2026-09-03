import { requireSession } from "@/lib/session";
import { isSuperadmin, isAdmin as isAdminRole, type Role, ROLE_LABEL } from "@/lib/roles";
import AppShell from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const role = (session.user as { role?: string }).role;
  const isSuper = isSuperadmin(role);
  const isAdmin = isAdminRole(role);

  const menu = [
    { href: "/dashboard", label: "Dashboard", icon: "bx-home-smile" },
    { href: "/bukti", label: "Bukti Dokumentasi", icon: "bx-cloud-upload" },
    ...(isAdmin
      ? [
          { href: "/pembimbing", label: "Data Pembagian", icon: "bx-table" },
          ...(isSuper ? [{ href: "/superadmin", label: "Super Admin", icon: "bx-shield", badge: "Pro" }] : []),
        ]
      : [{ href: "/pembimbing", label: "Mahasiswa Bimbingan", icon: "bx-table" }]),
  ];

  return (
    <AppShell menu={menu}>
      {children}
      <input type="hidden" data-role={ROLE_LABEL[(role as Role) ?? "DOSEN"] ?? "Dosen"} />
    </AppShell>
  );
}
