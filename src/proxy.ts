import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PROTECTED_PATHS = ["/dashboard", "/projects", "/meta-ads", "/settings"];

export const proxy = auth((req: any) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/meta-ads/:path*",
    "/settings/:path*",
    "/api/auth/:path*",
  ],
};
