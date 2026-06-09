import { NextRequest, NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE, readAuthSessionFromToken } from "@/lib/auth/token";
import { API_ROUTES } from "@/lib/api-routes";
import { ROUTES } from "@/lib/routes";

const PUBLIC_ROUTES: ReadonlySet<string> = new Set([ROUTES.login, ROUTES.logout]);

function isPublicPath(pathname: string) {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  return false;
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL(ROUTES.login, request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (nextPath !== ROUTES.root) {
    loginUrl.searchParams.set("next", nextPath);
  }

  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readAuthSessionFromToken(request.cookies.get(AUTH_SESSION_COOKIE)?.value);

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith(API_ROUTES.prefix)) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    return redirectToLogin(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
