import { redirect } from "next/navigation";
import { destroyAuthSession } from "@/lib/auth/session";

export async function POST() {
  await destroyAuthSession();
  redirect("/login");
}
