import { Suspense } from "react";
import BuktiClient from "./bukti-client";

export default function BuktiPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-400">Memuat…</div>}>
      <BuktiClient />
    </Suspense>
  );
}
