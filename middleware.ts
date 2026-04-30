import { NextRequest, NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE, readAuthSessionFromToken } from "@/lib/auth/token";
import { homeForRole } from "@/lib/auth/redirects";

const PUBLIC_ROUTES = new Set(["/login", "/logout"]);

function isPublicPath(pathname: string) {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  return false;
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (nextPath !== "/") {
    loginUrl.searchParams.set("next", nextPath);
  }

  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readAuthSessionFromToken(request.cookies.get(AUTH_SESSION_COOKIE)?.value);

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    return redirectToLogin(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
