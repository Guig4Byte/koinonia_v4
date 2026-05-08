import { compare } from "bcryptjs";

export async function verifyPassword(password: string, passwordHash: string) {
  if (!password || !passwordHash) return false;
  return compare(password, passwordHash);
}
