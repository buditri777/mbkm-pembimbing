export const ROLES = ["SUPERADMIN", "ADMIN", "DOSEN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  SUPERADMIN: "Super Admin",
  ADMIN: "Admin",
  DOSEN: "Dosen Pembimbing",
};

/** Super admin mewarisi seluruh kewenangan admin. */
export const isAdmin = (r?: string) => r === "ADMIN" || r === "SUPERADMIN";
export const isSuperadmin = (r?: string) => r === "SUPERADMIN";
