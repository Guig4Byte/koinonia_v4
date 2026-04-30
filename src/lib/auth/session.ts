import { cookies } from "next/headers";
import {
  AUTH_SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createAuthToken,
  readAuthSessionFromToken,
  type AuthSession,
} from "@/lib/auth/token";
import type { UserRole } from "@/generated/prisma/client";

export { AUTH_SESSION_COOKIE, readAuthSessionFromToken, type AuthSession };

type SessionUser = {
  id: string;
  role: UserRole;
  churchId: string;
};

export async function createAuthSession(user: SessionUser) {
  const { token } = await createAuthToken(user);
  const cookieStore = await cookies();

  cookieStore.set(AUTH_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroyAuthSession() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_SESSION_COOKIE);
}

export async function readAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  return readAuthSessionFromToken(cookieStore.get(AUTH_SESSION_COOKIE)?.value);
}
