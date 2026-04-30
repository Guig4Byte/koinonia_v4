import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { homeForRole } from "@/lib/auth/redirects";

export default async function HomePage() {
  const user = await getCurrentUser();

  redirect(homeForRole(user.role));
}
