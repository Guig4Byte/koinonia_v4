import { redirect } from "next/navigation";
import { destroyAuthSession } from "@/lib/auth/session";
import { ROUTES } from "@/lib/routes";

export async function POST() {
  await destroyAuthSession();
  redirect(ROUTES.login);
}
