import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/signin", "/api/auth"];
const SUPERADMIN_PATHS = ["/superadmin", "/api/users", "/api/ploting", "/api/rekap-bukti", "/api/import-mahasiswa"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const base = process.env.NEXTAUTH_URL || req.nextUrl.origin;
    const url = new URL("/signin", base);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (SUPERADMIN_PATHS.some((p) => pathname.startsWith(p)) && token.role !== "SUPERADMIN") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", process.env.NEXTAUTH_URL || req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|signin).*)"],
};
