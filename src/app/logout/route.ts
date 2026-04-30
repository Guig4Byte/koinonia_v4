import { redirect } from "next/navigation";
import { destroyAuthSession } from "@/lib/auth/session";

export async function GET() {
  await destroyAuthSession();
  redirect("/login");
}

export async function POST() {
  await destroyAuthSession();
  redirect("/login");
}
