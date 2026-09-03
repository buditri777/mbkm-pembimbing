import { requireSuperadmin } from "@/lib/session";
import SuperadminClient from "./superadmin-client";

export const dynamic = "force-dynamic";

export default async function SuperadminPage() {
  const session = await requireSuperadmin();
  return <SuperadminClient sessionName={session.user?.name ?? ""} />;
}
