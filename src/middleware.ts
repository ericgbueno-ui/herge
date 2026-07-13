import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Redirecionar para seleção de projeto se não houver projeto selecionado
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const projectId = request.cookies.get("selectedProject")?.value;
    if (!projectId) {
      return NextResponse.redirect(new URL("/projects", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
