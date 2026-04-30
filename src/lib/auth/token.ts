import { jwtVerify, SignJWT } from "jose";
import type { UserRole } from "@/generated/prisma/client";

export const AUTH_SESSION_COOKIE = "koinonia-session";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const SESSION_ISSUER = "koinonia-lite";
const SESSION_AUDIENCE = "koinonia-lite-web";
const USER_ROLE_VALUES = new Set<string>(["ADMIN", "PASTOR", "SUPERVISOR", "LEADER"]);

type SessionUser = {
  id: string;
  role: UserRole;
  churchId: string;
};

export type AuthSession = SessionUser & {
  expiresAt: Date;
};

function isSessionRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLE_VALUES.has(value);
}

function getSessionSecret() {
  const secret = process.env.KOINONIA_SESSION_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("Defina KOINONIA_SESSION_SECRET, AUTH_SECRET ou NEXTAUTH_SECRET para usar sessão em produção.");
  }

  return new TextEncoder().encode(secret ?? "koinonia-lite-dev-session-secret-change-before-production");
}

export async function createAuthToken(user: SessionUser) {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const token = await new SignJWT({
    role: user.role,
    churchId: user.churchId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(getSessionSecret());

  return { token, expiresAt };
}

export async function readAuthSessionFromToken(token: string | undefined): Promise<AuthSession | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });

    if (!payload.sub || !isSessionRole(payload.role) || typeof payload.churchId !== "string") {
      return null;
    }

    return {
      id: payload.sub,
      role: payload.role,
      churchId: payload.churchId,
      expiresAt: new Date((payload.exp ?? 0) * 1000),
    };
  } catch {
    return null;
  }
}
