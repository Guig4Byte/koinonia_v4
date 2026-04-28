import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user.role === "SUPERVISOR") redirect("/supervisor");
  if (user.role === "LEADER") redirect("/lider");
  redirect("/pastor");
}
